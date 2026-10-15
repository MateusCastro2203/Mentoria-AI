import { readFileSync } from "node:fs";
import { gerarTexto, observarChamadas, type EventoDeChamada } from "@mentoria/llm";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { carregarFontes } from "../src/noticia.js";
import { classificarTipado } from "../src/m02/classificar-tipado.js";
import { decidirPublicacao } from "../src/m03/guardrails.js";
import { montarPromptDaSkill } from "../src/m04/skill.js";
import { montarMarkdown } from "../src/m05/servidor-edicao.js";
import type { Papeis } from "../src/m05/time.js";
import { montarGrafoHitl } from "../src/m07/grafo.js";
import { armazenamentoEmMemoria } from "../src/m08/armazenamento.js";
import { criarWorker, type EnvDoCurador, type RegistroDeExecucao } from "../src/m08/nuvem.js";
import * as prompts from "../src/m08/prompts.js";
import { hashDoTexto, PortaoReprovado, promover, registrarVersao, reverter, versaoAtiva, type Avaliacao } from "../src/m08/prompts.js";
import * as rastreio from "../src/m08/rastreio.js";
import { custoDaChamada, percentil, rastrearPapeis, resumirRastro } from "../src/m08/rastreio.js";

const modeloFalso = (entrada = 100, saida = 10) =>
  new MockLanguageModelV4({
    modelId: "falso",
    doGenerate: async () => ({
      content: [{ type: "text", text: "ok" }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: entrada, noCache: entrada, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: saida, text: saida, reasoning: undefined },
      },
      warnings: [],
    }),
  });

const evento = (papel: string | undefined, latenciaMs: number, extra: Partial<EventoDeChamada> = {}): EventoDeChamada => ({
  operacao: "texto",
  modelo: "falso",
  inicio: "2026-10-19T09:00:00.000Z",
  latenciaMs,
  tokensEntrada: 100,
  tokensSaida: 10,
  atributos: papel ? { papel } : {},
  ...extra,
});

describe("M8 · rastreio", () => {
  it("percentil pela posição mais próxima, sem alterar a lista", () => {
    const valores = [40, 10, 30, 20];
    expect(percentil(valores, 0.5)).toBe(20);
    expect(percentil(valores, 0.95)).toBe(40);
    expect(percentil(valores, 0.25)).toBe(10);
    expect(percentil([7], 0.95)).toBe(7);
    expect(percentil([], 0.5)).toBe(0);
    expect(valores).toEqual([40, 10, 30, 20]);
  });

  it("custo por milhão de tokens; tokens ausentes contam zero", () => {
    expect(custoDaChamada({ tokensEntrada: 2_000, tokensSaida: 500 }, { entradaPorMilhao: 3, saidaPorMilhao: 15 })).toBeCloseTo(0.0135, 10);
    expect(custoDaChamada({}, { entradaPorMilhao: 3, saidaPorMilhao: 15 })).toBe(0);
  });

  it("resumirRastro agrega no total e por papel (erros e eventos sem papel incluídos)", () => {
    const r = resumirRastro(
      [
        evento("classificar", 100),
        evento("classificar", 300),
        evento("redigir", 50, { tokensSaida: 90 }),
        evento("redigir", 900, { erro: "timeout", tokensEntrada: undefined, tokensSaida: undefined }),
        evento(undefined, 10),
      ],
      { entradaPorMilhao: 1_000_000, saidaPorMilhao: 0 },
    );
    expect(r.total).toEqual({ chamadas: 5, erros: 1, tokensEntrada: 400, tokensSaida: 120, custo: 400, latenciaTotalMs: 1360, p50Ms: 100, p95Ms: 900 });
    expect(r.porPapel.classificar).toMatchObject({ chamadas: 2, erros: 0, tokensEntrada: 200, p50Ms: 100, p95Ms: 300 });
    expect(r.porPapel.redigir).toMatchObject({ chamadas: 2, erros: 1, tokensEntrada: 100, tokensSaida: 90, latenciaTotalMs: 950 });
    expect(r.porPapel["sem-papel"]).toMatchObject({ chamadas: 1 });
    expect(resumirRastro([]).total).toEqual({ chamadas: 0, erros: 0, tokensEntrada: 0, tokensSaida: 0, custo: 0, latenciaTotalMs: 0, p50Ms: 0, p95Ms: 0 });
  });

  it("rastrearPapeis põe papel e item em cada chamada ao modelo, sem mudar o resultado", async () => {
    const modelo = modeloFalso();
    const papeis: Papeis = {
      coletar: async () => (await gerarTexto({ prompt: "c", modelo }), ["n1", "n2"]),
      classificar: async (id) => (await gerarTexto({ prompt: id, modelo }), { id, titulo: id, url: "https://x", acao: "publicar", categoria: "modelos", confianca: 0.9 }),
      redigir: async (id, feedback) => (await gerarTexto({ prompt: id, modelo }), `resumo ${id} ${feedback ?? ""}`.trim()),
      revisar: async (id) => {
        await gerarTexto({ prompt: id, modelo });
        throw new Error("revisor caiu");
      },
    };
    const eventos: EventoDeChamada[] = [];
    const parar = observarChamadas((e) => eventos.push(e));
    const r = rastrearPapeis(papeis);
    expect(await r.coletar()).toEqual(["n1", "n2"]);
    await Promise.all([r.classificar("n1"), r.classificar("n2")]);
    expect(await r.redigir("n1", "curto demais")).toBe("resumo n1 curto demais");
    await expect(r.revisar("n1", "x")).rejects.toThrow("revisor caiu");
    parar();
    expect(eventos.map((e) => e.atributos)).toEqual(
      expect.arrayContaining([{ papel: "coletar" }, { papel: "classificar", alvo: "n1" }, { papel: "classificar", alvo: "n2" }, { papel: "redigir", alvo: "n1" }, { papel: "revisar", alvo: "n1" }]),
    );
    expect(eventos).toHaveLength(5);
  });
});

const SKILL_V2 = "---\nname: curar-noticia\ndescription: v2\n---\nINSTRUÇÕES V2";
const avaliacaoDe = async (texto: string, extra: Partial<Avaliacao> = {}): Promise<Avaliacao> => ({
  hash: await hashDoTexto(texto),
  modelo: "qwen3:4b-instruct",
  casos: 40,
  macroF1: 0.85,
  acuracia: 0.88,
  especiaisPublicados: 0,
  ...extra,
});

describe("M8 · versões do prompt", () => {
  it("registrarVersao: imutável e idempotente", async () => {
    const arm = armazenamentoEmMemoria();
    const v1 = await registrarVersao(arm, "v1", "texto 1", new Date("2026-10-01T00:00:00Z"));
    expect(v1).toEqual({ id: "v1", texto: "texto 1", hash: await hashDoTexto("texto 1"), criadaEm: "2026-10-01T00:00:00.000Z" });
    expect(await registrarVersao(arm, "v1", "texto 1", new Date("2026-10-09T00:00:00Z"))).toEqual(v1);
    await expect(registrarVersao(arm, "v1", "texto mudado")).rejects.toThrow("versão v1 já existe com outro conteúdo");
    expect(await versaoAtiva(arm)).toBeNull();
  });

  it("promover passa pelo portão e junta todos os motivos de reprovação", async () => {
    const arm = armazenamentoEmMemoria();
    await registrarVersao(arm, "v1", "texto 1");
    await expect(promover(arm, "v9", await avaliacaoDe("x"))).rejects.toThrow("versão desconhecida: v9");
    await expect(promover(arm, "v1", await avaliacaoDe("outro texto"))).rejects.toThrow(PortaoReprovado);
    const erro = await promover(arm, "v1", await avaliacaoDe("texto 1", { macroF1: 0.7, especiaisPublicados: 2 })).catch((e) => e);
    expect(erro).toBeInstanceOf(PortaoReprovado);
    expect(erro.motivos).toEqual(["casos especiais publicados: 2", "macro-F1 0.7 abaixo de 0.8"]);
    expect(await versaoAtiva(arm)).toBeNull();
    const ativa = await promover(arm, "v1", await avaliacaoDe("texto 1"));
    expect(ativa.avaliacao?.macroF1).toBe(0.85);
    expect((await versaoAtiva(arm))?.id).toBe("v1");
  });

  it("não deixa piorar em relação à versão ativa (com o mesmo modelo); com outro modelo não compara", async () => {
    const arm = armazenamentoEmMemoria();
    await registrarVersao(arm, "v1", "texto 1");
    await promover(arm, "v1", await avaliacaoDe("texto 1", { macroF1: 0.9 }));
    await registrarVersao(arm, "v2", "texto 2");
    const erro = await promover(arm, "v2", await avaliacaoDe("texto 2", { macroF1: 0.85 })).catch((e) => e);
    expect(erro.motivos).toEqual(["macro-F1 0.85 pior que a versão ativa (0.9)"]);
    expect((await promover(arm, "v2", await avaliacaoDe("texto 2", { macroF1: 0.89 }))).id).toBe("v2");
    await registrarVersao(arm, "v3", "texto 3");
    expect((await promover(arm, "v3", await avaliacaoDe("texto 3", { macroF1: 0.82, modelo: "outro" }))).id).toBe("v3");
    expect(await prompts.lerHistorico(arm)).toEqual(["v1", "v2"]);
  });

  it("reverter volta para a anterior, uma de cada vez, até acabar o histórico", async () => {
    const arm = armazenamentoEmMemoria();
    await expect(reverter(arm)).rejects.toThrow("não há versão anterior para reverter");
    for (const id of ["v1", "v2", "v3"]) {
      await registrarVersao(arm, id, `texto ${id}`);
      await promover(arm, id, await avaliacaoDe(`texto ${id}`, { modelo: id }));
    }
    await promover(arm, "v3", await avaliacaoDe("texto v3", { modelo: "v3", macroF1: 0.95 }));
    expect(await prompts.lerHistorico(arm)).toEqual(["v1", "v2"]);
    expect((await reverter(arm)).id).toBe("v2");
    expect((await versaoAtiva(arm))?.id).toBe("v2");
    expect((await reverter(arm)).id).toBe("v1");
    await expect(reverter(arm)).rejects.toThrow("não há versão anterior");
    expect((await versaoAtiva(arm))?.id).toBe("v1");
  });
});

describe("M8 · o Worker (cron + revisão por HTTP + prompts)", () => {
  const recursos = {
    feeds: Object.fromEntries(carregarFontes().map((f) => [f.nome, readFileSync(new URL(`../../dados/rss/${f.nome}.xml`, import.meta.url), "utf8")])),
    fontes: carregarFontes(),
    skill: "---\nname: curar-noticia\ndescription: embutida\n---\nINSTRUÇÕES EMBUTIDAS",
    referencias: {},
  };

  function montar() {
    const instrucoesUsadas: string[] = [];
    const modelo = modeloFalso(100, 10);
    const worker = criarWorker(
      { classificarTipado, decidirPublicacao, montarPromptDaSkill, montarMarkdown, montarGrafoHitl, rastreio, prompts },
      recursos,
      {
        papeis: (itens, instrucoes) => {
          instrucoesUsadas.push(instrucoes);
          return {
            coletar: async () => itens.map((i) => i.id),
            async classificar(id) {
              await gerarTexto({ prompt: id, modelo });
              const i = itens.find((x) => x.id === id)!;
              const incerto = id === itens[1]!.id;
              return { id, titulo: i.titulo, url: i.url, acao: incerto ? "revisar" : "publicar", categoria: "modelos", confianca: incerto ? 0.6 : 0.97 };
            },
            redigir: async (id) => (await gerarTexto({ prompt: id, modelo }), `Resumo de ${id}.`),
            revisar: async (id) => (await gerarTexto({ prompt: id, modelo }), { aprovado: true, motivo: "fiel" }),
          };
        },
      },
    );
    const env: EnvDoCurador = {
      CURADOR: armazenamentoEmMemoria(),
      EDITOR_TOKEN: "segredo",
      MAX_NOTICIAS: "3",
      PRECO_ENTRADA_POR_MILHAO: "2",
      PRECO_SAIDA_POR_MILHAO: "10",
    };
    const pedir = async (metodo: string, caminho: string, corpo?: unknown, token: string | null = "segredo") => {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (token) headers.authorization = `Bearer ${token}`;
      const r = await worker.fetch(new Request(`https://curador.exemplo${caminho}`, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) }), env);
      return { status: r.status, corpo: r.headers.get("content-type")?.includes("json") ? await r.json() : await r.text() } as { status: number; corpo: any };
    };
    return { worker, env, pedir, instrucoesUsadas };
  }

  const segunda = Date.parse("2026-10-19T09:00:00Z");

  it("o cron roda até a pausa, registra rastro e custo, e não roda duas vezes no mesmo dia", async () => {
    const { worker, env, pedir } = montar();
    await worker.scheduled({ scheduledTime: segunda, cron: "0 9 * * 1" }, env);
    const [registro] = (await pedir("GET", "/execucoes")).corpo as RegistroDeExecucao[];
    expect(registro).toMatchObject({ execucao: "2026-10-19", thread: "edicao-2026-10-19", noticias: 3, pausas: 1, arquivo: null, prompt: { id: "embutida" } });
    expect(registro!.rastro.porPapel.classificar?.chamadas).toBe(3);
    expect(registro!.rastro.porPapel.redigir?.chamadas).toBe(2);
    expect(registro!.rastro.porPapel.revisar?.chamadas).toBe(2);
    expect(registro!.rastro.total.tokensEntrada).toBe(700);
    expect(registro!.rastro.total.custo).toBeCloseTo((700 * 2 + 70 * 10) / 1_000_000, 10);

    expect(await worker.rodarEdicao(env, new Date(segunda + 60_000))).toBeNull();
    expect(((await pedir("GET", "/execucoes")).corpo as unknown[]).length).toBe(1);
  });

  it("a revisão por HTTP: token obrigatório, resposta validada, item e edição, e a edição publicada", async () => {
    const { worker, env, pedir } = montar();
    await worker.scheduled({ scheduledTime: segunda }, env);
    const pendentes = (await pedir("GET", "/pendentes")).corpo;
    expect(pendentes.pausas).toHaveLength(1);
    const incerto = pendentes.pausas[0].id as string;
    expect(pendentes.pausas[0]).toMatchObject({ tipo: "item", motivo: "guardrails" });

    expect((await pedir("POST", "/retomar", { respostas: { [incerto]: { acao: "aprovar" } } }, null)).status).toBe(401);
    expect((await pedir("POST", "/retomar", { respostas: { [incerto]: "sim" } })).status).toBe(400);
    expect((await pedir("POST", "/retomar", { respostas: { n99: { acao: "aprovar" } } })).status).toBe(400);

    const r1 = await pedir("POST", "/retomar", { respostas: { [incerto]: { acao: "rejeitar", motivo: "fora do tema" } } });
    expect(r1.status).toBe(200);
    expect(r1.corpo.pausas).toEqual([expect.objectContaining({ tipo: "edicao" })]);
    expect(r1.corpo.pausas[0].itens).toHaveLength(2);

    const r2 = await pedir("POST", "/retomar", { respostas: { edicao: { acao: "aprovar" } } });
    expect(r2.corpo).toEqual({ pausas: [], arquivo: "kv://edicao:2026-10-19" });
    const md = (await pedir("GET", "/edicao")).corpo as string;
    expect(md).toContain("# Curador de IA · semana de 2026-10-19");
    expect(md).not.toContain(pendentes.pausas[0].titulo);
    const [registro] = (await pedir("GET", "/execucoes")).corpo as RegistroDeExecucao[];
    expect(registro!.retomadas).toHaveLength(2);
    expect(registro!.arquivo).toBe("kv://edicao:2026-10-19");
  });

  it("promover e reverter o prompt por HTTP; a próxima edição usa a versão ativa", async () => {
    const { worker, env, pedir, instrucoesUsadas } = montar();
    expect((await pedir("GET", "/prompts")).corpo).toEqual({ ativa: null, historico: [] });
    const ruim = await pedir("POST", "/prompts", { id: "v2", texto: SKILL_V2, avaliacao: await avaliacaoDe(SKILL_V2, { macroF1: 0.5 }) });
    expect(ruim.status).toBe(422);
    expect(ruim.corpo.motivos).toEqual(["macro-F1 0.5 abaixo de 0.8"]);
    const ok = await pedir("POST", "/prompts", { id: "v2", texto: SKILL_V2, avaliacao: await avaliacaoDe(SKILL_V2) });
    expect(ok.status).toBe(200);
    expect(ok.corpo.ativa).toMatchObject({ id: "v2", hash: await hashDoTexto(SKILL_V2) });

    await worker.scheduled({ scheduledTime: segunda }, env);
    expect(instrucoesUsadas.at(-1)).toBe("INSTRUÇÕES V2");
    const [registro] = (await pedir("GET", "/execucoes")).corpo as RegistroDeExecucao[];
    expect(registro!.prompt.id).toBe("v2");

    expect((await pedir("POST", "/prompts/reverter")).status).toBe(409);
  });
});
