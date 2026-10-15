// Fornecido (M8): o curador como um Cloudflare Worker.
//
// - scheduled (Cron Trigger): roda a edição da semana com o grafo da M7 até terminar ou pausar;
//   guarda o checkpoint, o rastro (custo, tokens, latência por papel) e a versão do prompt usada.
// - fetch (HTTP): a "tela" da revisão humana e da operação:
//     GET  /edicao            a última edição publicada (markdown)
//     GET  /execucoes         as últimas execuções, com rastro e custo
//     GET  /pendentes         as pausas esperando decisão
//     POST /retomar           { respostas: { <item ou "edicao">: <resposta> } }   (precisa do token)
//     GET  /prompts           a versão ativa do prompt e o histórico
//     POST /prompts           { id, texto, avaliacao }: registra e promove, se passar no portão   (token)
//     POST /prompts/reverter  volta para a versão anterior (rollback)                               (token)
//
// O código do curador (o seu, de src/, ou a solução) chega por injeção em `ModulosDoCurador`:
// worker/curador.ts usa src/, worker/curador.solucao.ts usa solucao/.
import { Command } from "@langchain/langgraph";
import { comAtributos, lerConfig, observarChamadas, type EventoDeChamada } from "@mentoria/llm";
import type { Fonte, Noticia } from "../noticia.js";
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import { redigirResumo, revisarResumo } from "../m05/redator-revisor.js";
import { lerRss, type ItemRss } from "../m05/rss.js";
import type { ItemAvaliado, Papeis } from "../m05/time.js";
import { pausasPendentes, RespostaEdicaoSchema, RespostaItemSchema, type ResultadoHitl } from "../m07/estado.js";
import { gravarJson, lerJson, type Armazenamento } from "./armazenamento.js";
import { CheckpointEmKV } from "./checkpoint-kv.js";
import { CHAVES, hashDoTexto, lerHistorico, PortaoReprovado, type Avaliacao } from "./tipos-prompts.js";
import type { Precos, ResumoDoRastro } from "./tipos-rastreio.js";

export interface ModulosDoCurador {
  classificarTipado: typeof import("../m02/classificar-tipado.js").classificarTipado;
  decidirPublicacao: typeof import("../m03/guardrails.js").decidirPublicacao;
  montarPromptDaSkill: typeof import("../m04/skill.js").montarPromptDaSkill;
  montarMarkdown: typeof import("../m05/servidor-edicao.js").montarMarkdown;
  montarGrafoHitl: typeof import("../m07/grafo.js").montarGrafoHitl;
  rastreio: Pick<typeof import("./rastreio.js"), "rastrearPapeis" | "resumirRastro">;
  prompts: Pick<typeof import("./prompts.js"), "registrarVersao" | "versaoAtiva" | "promover" | "reverter">;
}

/** O que vai junto no pacote do Worker (não há disco no Workers: tudo entra como texto no bundle). */
export interface RecursosDoCurador {
  feeds: Record<string, string>;
  fontes: Fonte[];
  /** SKILL.md da M4: a versão "embutida" do prompt, usada até alguém promover outra. */
  skill: string;
  referencias: Record<string, string>;
}

export interface EnvDoCurador {
  /** Binding do Workers KV (wrangler.jsonc → kv_namespaces). */
  CURADOR: Armazenamento;
  /** Segredo para as rotas que mudam algo (wrangler secret put EDITOR_TOKEN; no local, .dev.vars). */
  EDITOR_TOKEN?: string;
  /** Quantas notícias entram por edição. Cada uma custa de 1 a 5 chamadas ao modelo. */
  MAX_NOTICIAS?: string;
  /** "nao" tira a pausa da edição inteira (a publicação vira automática; os itens incertos continuam pausando). */
  REVISAR_EDICAO?: string;
  PRECO_ENTRADA_POR_MILHAO?: string;
  PRECO_SAIDA_POR_MILHAO?: string;
}

export interface RegistroDeExecucao {
  execucao: string;
  thread: string;
  inicio: string;
  duracaoMs: number;
  modelo: string;
  prompt: { id: string; hash: string };
  noticias: number;
  pausas: number;
  arquivo: string | null;
  rastro: ResumoDoRastro;
  retomadas: { em: string; duracaoMs: number; rastro: ResumoDoRastro }[];
  erro?: string;
}

export const CHAVES_DO_CURADOR = {
  execucao: (id: string) => `execucao:${id}`,
  execucoes: "execucoes",
  checkpoint: (thread: string) => `checkpoint:${thread}`,
  threadAtual: "edicao:atual",
  edicao: (data: string) => `edicao:${data}`,
  ultimaEdicao: "edicao:ultima",
} as const;

/** O corpo do SKILL.md, sem o frontmatter: é o que o classificador usa como instruções. */
export function corpoDaSkill(texto: string): string {
  return texto.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}

/** As notícias de todas as fontes, na ordem de fontes.json, sem repetir id. */
export function noticiasDosFeeds(recursos: Pick<RecursosDoCurador, "feeds" | "fontes">): ItemRss[] {
  const vistos = new Map<string, ItemRss>();
  for (const f of recursos.fontes) {
    for (const item of lerRss(recursos.feeds[f.nome] ?? "")) if (!vistos.has(item.id)) vistos.set(item.id, item);
  }
  return [...vistos.values()];
}

/**
 * Os papéis na versão agendada. A diferença para a M5: o COLETOR virou código (pega as `max` primeiras
 * notícias dos feeds). Às 9h de segunda ninguém está olhando a trajetória de um agente, e cada passo dele
 * é uma chamada a mais no limite de subrequests da plataforma. Agente só onde a autonomia se paga (Aula 4).
 */
export function papeisDaNuvem(m: ModulosDoCurador, itens: ItemRss[], instrucoes: string, referencias: Record<string, string>): Papeis {
  const porId = new Map(itens.map((i) => [i.id, i]));
  const item = (id: string) => {
    const i = porId.get(id);
    if (!i) throw new Error(`notícia desconhecida: ${id}`);
    return i;
  };
  const skill = { nome: "curar-noticia", descricao: "", instrucoes, referencias };
  return {
    coletar: async () => itens.map((i) => i.id),
    async classificar(id) {
      const i = item(id);
      const n: Noticia = { id: i.id, titulo: i.titulo, resumo: i.resumo, fonte: i.fonte, url: i.url, publicadaEm: i.publicadaEm };
      const resultado = await m.classificarTipado(n, { montarPrompt: (x) => m.montarPromptDaSkill(skill, x) });
      const { acao } = m.decidirPublicacao(n, resultado);
      const avaliado: ItemAvaliado = {
        id,
        titulo: i.titulo,
        url: i.url,
        acao,
        categoria: resultado.ok ? resultado.decisao.categoria : null,
        confianca: resultado.ok ? resultado.decisao.confianca : null,
      };
      return avaliado;
    },
    redigir: async (id, feedback) => redigirResumo(item(id), feedback),
    revisar: async (id, resumo) => revisarResumo(item(id), resumo),
  };
}

export interface OpcoesDoWorker {
  /** Troca os papéis (nos testes, papéis com modelo simulado). */
  papeis?: (itens: ItemRss[], instrucoes: string) => Papeis;
  agora?: () => Date;
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export function criarWorker(m: ModulosDoCurador, recursos: RecursosDoCurador, opcoes: OpcoesDoWorker = {}) {
  const agora = opcoes.agora ?? (() => new Date());

  const precosDe = (env: EnvDoCurador): Precos => ({
    entradaPorMilhao: Number(env.PRECO_ENTRADA_POR_MILHAO ?? 0),
    saidaPorMilhao: Number(env.PRECO_SAIDA_POR_MILHAO ?? 0),
  });

  async function promptEmUso(env: EnvDoCurador) {
    const ativa = await m.prompts.versaoAtiva(env.CURADOR);
    if (ativa) return ativa;
    return { id: "embutida", texto: recursos.skill, hash: await hashDoTexto(recursos.skill) };
  }

  function montar(env: EnvDoCurador, instrucoes: string, checkpointer: CheckpointEmKV, data: string) {
    const max = Number(env.MAX_NOTICIAS ?? 8);
    const itens = noticiasDosFeeds(recursos).slice(0, max);
    const base = opcoes.papeis ? opcoes.papeis(itens, instrucoes) : papeisDaNuvem(m, itens, instrucoes, recursos.referencias);
    const publicar = async (edicao: ItemEdicao[]) => {
      // O guardrail de fonte vale também no destino (M3/M5).
      const semHttps = edicao.find((i) => !i.url.startsWith("https://"));
      if (semHttps) throw new Error(`item ${semHttps.id} sem fonte https`);
      const md = m.montarMarkdown(`Curador de IA · semana de ${data}`, edicao);
      await env.CURADOR.put(CHAVES_DO_CURADOR.edicao(data), md);
      await env.CURADOR.put(CHAVES_DO_CURADOR.ultimaEdicao, md);
      return { arquivo: `kv://${CHAVES_DO_CURADOR.edicao(data)}` };
    };
    const grafo = m.montarGrafoHitl(m.rastreio.rastrearPapeis(base), publicar, {
      checkpointer,
      revisarEdicao: env.REVISAR_EDICAO !== "nao",
    });
    return { grafo, itens };
  }

  /** Roda o grafo coletando o rastro de todas as chamadas ao modelo feitas lá dentro. */
  async function comRastro<T>(atributos: Record<string, string>, fn: () => Promise<T>) {
    const eventos: EventoDeChamada[] = [];
    const parar = observarChamadas((e) => {
      if (e.atributos.execucao === atributos.execucao) eventos.push(e);
    });
    const inicio = Date.now();
    try {
      return { valor: await comAtributos(atributos, fn), eventos, duracaoMs: Date.now() - inicio };
    } finally {
      parar();
    }
  }

  async function registrar(env: EnvDoCurador, registro: RegistroDeExecucao) {
    await gravarJson(env.CURADOR, CHAVES_DO_CURADOR.execucao(registro.execucao), registro);
    const lista = (await lerJson<string[]>(env.CURADOR, CHAVES_DO_CURADOR.execucoes)) ?? [];
    if (!lista.includes(registro.execucao)) await gravarJson(env.CURADOR, CHAVES_DO_CURADOR.execucoes, [...lista, registro.execucao].slice(-20));
  }

  /** Uma execução agendada. Idempotente por dia: se o cron disparar duas vezes, a segunda não faz nada. */
  async function rodarEdicao(env: EnvDoCurador, quando: Date): Promise<RegistroDeExecucao | null> {
    const data = quando.toISOString().slice(0, 10);
    const thread = `edicao-${data}`;
    if (await env.CURADOR.get(CHAVES_DO_CURADOR.execucao(data))) {
      console.log(JSON.stringify({ evento: "edicao-pulada", execucao: data, motivo: "já rodou hoje" }));
      return null;
    }
    const prompt = await promptEmUso(env);
    const checkpointer = await CheckpointEmKV.abrir(env.CURADOR, CHAVES_DO_CURADOR.checkpoint(thread));
    const { grafo, itens } = montar(env, corpoDaSkill(prompt.texto), checkpointer, data);
    const config = { configurable: { thread_id: thread } };
    const inicio = agora().toISOString();
    let resultado: ResultadoHitl | null = null;
    let erro: string | undefined;
    const r = await comRastro({ execucao: data, prompt: prompt.id }, async () => {
      try {
        resultado = await grafo.invoke({}, config);
      } catch (e) {
        erro = e instanceof Error ? e.message : String(e);
      }
    });
    await checkpointer.salvar();
    await env.CURADOR.put(CHAVES_DO_CURADOR.threadAtual, thread);
    const final = resultado as ResultadoHitl | null;
    const registro: RegistroDeExecucao = {
      execucao: data,
      thread,
      inicio,
      duracaoMs: r.duracaoMs,
      modelo: lerConfig().modelo,
      prompt: { id: prompt.id, hash: prompt.hash },
      noticias: itens.length,
      pausas: final?.__interrupt__?.length ?? 0,
      arquivo: final?.arquivo ?? null,
      rastro: m.rastreio.resumirRastro(r.eventos, precosDe(env)),
      retomadas: [],
      ...(erro ? { erro } : {}),
    };
    await registrar(env, registro);
    // Uma linha JSON por execução: é o que aparece (e dá para filtrar) nos Workers Logs.
    console.log(JSON.stringify({ evento: erro ? "edicao-falhou" : "edicao", ...registro, rastro: registro.rastro.total }));
    return registro;
  }

  async function contexto(env: EnvDoCurador) {
    const thread = await env.CURADOR.get(CHAVES_DO_CURADOR.threadAtual);
    if (!thread) return null;
    const data = thread.replace(/^edicao-/, "");
    const registro = await lerJson<RegistroDeExecucao>(env.CURADOR, CHAVES_DO_CURADOR.execucao(data));
    // Retoma com o MESMO prompt com que a edição começou, mesmo que outra versão tenha sido promovida depois.
    const usada = registro && registro.prompt.id !== "embutida" ? await lerJson<{ texto: string }>(env.CURADOR, CHAVES.versao(registro.prompt.id)) : null;
    const prompt = usada ?? (await promptEmUso(env));
    const checkpointer = await CheckpointEmKV.abrir(env.CURADOR, CHAVES_DO_CURADOR.checkpoint(thread));
    const { grafo } = montar(env, corpoDaSkill(prompt.texto), checkpointer, data);
    return { thread, data, registro, checkpointer, grafo, config: { configurable: { thread_id: thread } } };
  }

  async function retomar(env: EnvDoCurador, corpo: unknown): Promise<Response> {
    const ctx = await contexto(env);
    if (!ctx) return json({ erro: "nenhuma edição em andamento" }, 404);
    const pendentes = await pausasPendentes(ctx.grafo, ctx.config);
    const respostas = (corpo as { respostas?: Record<string, unknown> })?.respostas;
    if (!respostas || typeof respostas !== "object") return json({ erro: "mande { respostas: { <id>: <resposta> } }" }, 400);
    const validadas: Record<string, unknown> = {};
    for (const [chave, resposta] of Object.entries(respostas)) {
      // A chave pode ser o id da pausa, o id do item (ex.: "n38") ou "edicao".
      const pausa = pendentes.find(
        (p) => p.id === chave || (p.value.tipo === "item" ? p.value.id === chave : chave === "edicao"),
      );
      if (!pausa) return json({ erro: `pausa desconhecida: ${chave}` }, 400);
      const id = pausa.id;
      const schema = pausa.value.tipo === "item" ? RespostaItemSchema : RespostaEdicaoSchema;
      const ok = schema.safeParse(resposta);
      if (!ok.success) return json({ erro: `resposta inválida para ${id}`, detalhes: ok.error.issues }, 400);
      validadas[id] = ok.data;
    }
    let resultado: ResultadoHitl | null = null;
    const r = await comRastro({ execucao: ctx.data, prompt: ctx.registro?.prompt.id ?? "embutida" }, async () => {
      resultado = await ctx.grafo.invoke(new Command({ resume: validadas }), ctx.config);
    });
    await ctx.checkpointer.salvar();
    const final = resultado as ResultadoHitl | null;
    if (ctx.registro) {
      ctx.registro.retomadas.push({ em: agora().toISOString(), duracaoMs: r.duracaoMs, rastro: m.rastreio.resumirRastro(r.eventos, precosDe(env)) });
      ctx.registro.pausas = final?.__interrupt__?.length ?? 0;
      ctx.registro.arquivo = final?.arquivo ?? ctx.registro.arquivo;
      await registrar(env, ctx.registro);
    }
    return json({ pausas: (final?.__interrupt__ ?? []).map((p) => ({ pausa: p.id, ...p.value })), arquivo: final?.arquivo ?? null });
  }

  async function prompts(env: EnvDoCurador, metodo: string, caminho: string, corpo: unknown): Promise<Response> {
    if (metodo === "GET") {
      const ativa = await m.prompts.versaoAtiva(env.CURADOR);
      return json({ ativa: ativa ? { ...ativa, texto: undefined } : null, historico: await lerHistorico(env.CURADOR) });
    }
    try {
      if (caminho === "/prompts/reverter") return json({ ativa: { ...(await m.prompts.reverter(env.CURADOR)), texto: undefined } });
      const { id, texto, avaliacao } = (corpo ?? {}) as { id?: string; texto?: string; avaliacao?: Avaliacao };
      if (!id || !texto || !avaliacao) return json({ erro: "mande { id, texto, avaliacao }" }, 400);
      await m.prompts.registrarVersao(env.CURADOR, id, texto, agora());
      const promovida = await m.prompts.promover(env.CURADOR, id, avaliacao);
      return json({ ativa: { ...promovida, texto: undefined } });
    } catch (e) {
      if (e instanceof PortaoReprovado || (e as Error).name === "PortaoReprovado") return json({ erro: (e as Error).message, motivos: (e as PortaoReprovado).motivos }, 422);
      return json({ erro: (e as Error).message }, 409);
    }
  }

  return {
    rodarEdicao,

    async scheduled(controller: { scheduledTime: number; cron?: string }, env: EnvDoCurador): Promise<void> {
      await rodarEdicao(env, new Date(controller.scheduledTime));
    },

    async fetch(request: Request, env: EnvDoCurador): Promise<Response> {
      const url = new URL(request.url);
      const metodo = request.method;
      if (metodo === "POST") {
        if (!env.EDITOR_TOKEN) return json({ erro: "configure o segredo EDITOR_TOKEN" }, 503);
        if (request.headers.get("authorization") !== `Bearer ${env.EDITOR_TOKEN}`) return json({ erro: "token inválido" }, 401);
      }
      const corpo = metodo === "POST" ? await request.json().catch(() => null) : null;
      switch (`${metodo} ${url.pathname}`) {
        case "GET /edicao": {
          const md = await env.CURADOR.get(CHAVES_DO_CURADOR.ultimaEdicao);
          return md ? new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } }) : json({ erro: "nenhuma edição publicada" }, 404);
        }
        case "GET /execucoes": {
          const ids = (await lerJson<string[]>(env.CURADOR, CHAVES_DO_CURADOR.execucoes)) ?? [];
          const registros = await Promise.all(ids.reverse().map((id) => lerJson<RegistroDeExecucao>(env.CURADOR, CHAVES_DO_CURADOR.execucao(id))));
          return json(registros.filter(Boolean));
        }
        case "GET /pendentes": {
          const ctx = await contexto(env);
          if (!ctx) return json({ thread: null, pausas: [] });
          const pausas = await pausasPendentes(ctx.grafo, ctx.config);
          return json({ thread: ctx.thread, pausas: pausas.map((p) => ({ pausa: p.id, ...p.value })) });
        }
        case "POST /retomar":
          return retomar(env, corpo);
        case "GET /prompts":
        case "POST /prompts":
        case "POST /prompts/reverter":
          return prompts(env, metodo, url.pathname, corpo);
        default:
          return new Response(
            "Curador de IA (Módulo 8)\n\nGET /edicao · GET /execucoes · GET /pendentes · POST /retomar\nGET /prompts · POST /prompts · POST /prompts/reverter\n",
            { status: url.pathname === "/" ? 200 : 404, headers: { "content-type": "text/plain; charset=utf-8" } },
          );
      }
    },
  };
}
