// Experimento da etapa M7 (fornecido): o curador com humanos no circuito, revisado pelo terminal.
//   pnpm -F @mentoria/curador m07:edicao                    (seu código)
//   pnpm -F @mentoria/curador m07:edicao:solucao            (soluções de referência)
//   ... -- --nova              começa outra edição (apaga o checkpoint)
//   ... -- --aprovar-tudo      não pergunta: aprova tudo (para testar o fluxo sem digitar)
//   ... -- --respostas r.json  não pergunta: usa as respostas do arquivo ({ "n38": {...}, "edicao": {...} })
// O grafo roda até a primeira pausa e pergunta. Você pode sair a qualquer momento ([s]): a pausa fica
// salva em saidas/m07-checkpoint.json e, rodando de novo (amanhã, em outra máquina), continua dali.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { Command } from "@langchain/langgraph";
import { lerConfig } from "@mentoria/llm";
import { CheckpointEmArquivo } from "../src/m06/checkpoint-arquivo.js";
import { CATEGORIAS } from "../src/noticia.js";
import { pausasPendentes, RespostaEdicaoSchema, RespostaItemSchema, type PedidoDeRevisao, type ResultadoHitl } from "../src/m07/estado.js";

const sol = Boolean(process.env.SOLUCAO);
const m = {
  fontes: (sol ? await import("../solucao/m05/servidor-fontes.js") : await import("../src/m05/servidor-fontes.js")) as typeof import("../src/m05/servidor-fontes.js"),
  edicao: (sol ? await import("../solucao/m05/servidor-edicao.js") : await import("../src/m05/servidor-edicao.js")) as typeof import("../src/m05/servidor-edicao.js"),
  ponte: (sol ? await import("../solucao/m05/mcp-para-ai-sdk.js") : await import("../src/m05/mcp-para-ai-sdk.js")) as typeof import("../src/m05/mcp-para-ai-sdk.js"),
  papeis: (sol ? await import("../solucao/m05/papeis.js") : await import("../src/m05/papeis.js")) as typeof import("../src/m05/papeis.js"),
  grafo: (sol ? await import("../solucao/m07/grafo.js") : await import("../src/m07/grafo.js")) as typeof import("../src/m07/grafo.js"),
  decisoes: (sol ? await import("../solucao/m07/decisoes.js") : await import("../src/m07/decisoes.js")) as typeof import("../src/m07/decisoes.js"),
};

const aprovarTudo = process.argv.includes("--aprovar-tudo");
const iRespostas = process.argv.indexOf("--respostas");
const doArquivo: Record<string, unknown> | null = iRespostas > 0 ? JSON.parse(readFileSync(process.argv[iRespostas + 1]!, "utf8")) : null;
const SAIDAS = fileURLToPath(new URL("../saidas/", import.meta.url));
const ARQUIVO = `${SAIDAS}m07-checkpoint.json`;
if (process.argv.includes("--nova")) rmSync(ARQUIVO, { force: true });
const config = { configurable: { thread_id: "edicao-m07" } };

const clienteFontes = await m.ponte.conectarEmMemoria(m.fontes.criarServidorFontes(), "curador-hitl");
const clienteEdicao = await m.ponte.conectarEmMemoria(m.edicao.criarServidorEdicao({ pasta: SAIDAS }), "curador-hitl");
const { papeis } = await m.papeis.criarPapeis({ clienteFontes });
const data = new Date().toISOString().slice(0, 10);
const grafo = m.grafo.montarGrafoHitl(
  papeis,
  async (itens) => {
    const res: any = await clienteEdicao.callTool({ name: "publicar_edicao", arguments: { titulo: `Curador de IA · semana de ${data}`, itens } });
    if (res.isError) throw new Error(res.content[0].text);
    return { arquivo: res.structuredContent.arquivo };
  },
  { checkpointer: new CheckpointEmArquivo(ARQUIVO) },
);

const rl = createInterface({ input: stdin, output: stdout });
class Sair extends Error {}
async function perguntar(texto: string): Promise<string> {
  // Entrada fechada (Ctrl+D, pipe) também é "sair": a pausa continua salva.
  const r = (await rl.question(texto).catch(() => "s")).trim();
  if (r.toLowerCase() === "s") throw new Sair();
  return r;
}

// Pergunta até a resposta passar no schema (o mesmo que o grafo usa para validar).
async function decidirItem(p: Extract<PedidoDeRevisao, { tipo: "item" }>) {
  console.log(`\n⏸  ${p.id} · ${p.titulo}\n   ${p.url}\n   categoria: ${p.categoria ?? "-"} · confiança: ${p.confianca ?? "-"} · motivo da pausa: ${p.motivo}`);
  if (aprovarTudo) return { acao: "aprovar" as const };
  if (doArquivo?.[p.id]) return RespostaItemSchema.parse(doArquivo[p.id]);
  const inicio = Date.now();
  for (;;) {
    const op = await perguntar("   [a]provar · [e]ditar categoria · [r]ejeitar · [s]air > ");
    let resposta: unknown = null;
    if (op === "a") resposta = { acao: "aprovar" };
    if (op === "e") resposta = { acao: "editar", categoria: await perguntar(`   categoria (${CATEGORIAS.join(", ")}) > `) };
    if (op === "r") resposta = { acao: "rejeitar", motivo: await perguntar("   motivo > ") };
    const ok = RespostaItemSchema.safeParse(resposta);
    if (ok.success) return { ...ok.data, tempoMs: Date.now() - inicio };
    console.log("   resposta inválida, tente de novo");
  }
}

async function decidirEdicao(p: Extract<PedidoDeRevisao, { tipo: "edicao" }>) {
  console.log(`\n⏸  A edição tem ${p.itens.length} itens:`);
  p.itens.forEach((i, n) => console.log(`   ${String(n + 1).padStart(2)}. [${i.categoria}] ${i.titulo}\n       ${i.resumo}`));
  if (aprovarTudo) return { acao: "aprovar" as const };
  if (doArquivo?.edicao) return RespostaEdicaoSchema.parse(doArquivo.edicao);
  const inicio = Date.now();
  for (;;) {
    const op = await perguntar("   [a]provar e publicar · [e]ditar (remover itens) · [r]ejeitar · [s]air > ");
    let resposta: unknown = null;
    if (op === "a") resposta = { acao: "aprovar" };
    if (op === "e") {
      const nums = (await perguntar("   números para remover (ex.: 2 5) > ")).split(/[\s,]+/).filter(Boolean).map(Number);
      resposta = { acao: "editar", remover: nums.map((n) => p.itens[n - 1]?.id ?? `#${n}`) };
    }
    if (op === "r") resposta = { acao: "rejeitar", motivo: await perguntar("   motivo > ") };
    const ok = RespostaEdicaoSchema.safeParse(resposta);
    const ids = new Set(p.itens.map((i) => i.id));
    if (ok.success && (ok.data.acao !== "editar" || ok.data.remover.every((id) => ids.has(id)))) return { ...ok.data, tempoMs: Date.now() - inicio };
    console.log("   resposta inválida, tente de novo");
  }
}

const inicio = Date.now();
let resultado: ResultadoHitl | null = null;
let pendentes = await pausasPendentes(grafo, config);
const estadoAtual = await grafo.getState(config);
try {
  if (!pendentes.length && estadoAtual.next.length === 0 && !(estadoAtual.values as { arquivo?: unknown }).arquivo) {
    console.log("Começando uma edição nova (o modelo trabalha alguns minutos até a primeira pausa)…");
    resultado = await grafo.invoke({}, config);
    pendentes = resultado.__interrupt__ ?? [];
  } else if (pendentes.length) {
    console.log(`Continuando: há ${pendentes.length} pausa(s) esperando uma decisão.`);
  }
  while (pendentes.length) {
    const respostas: Record<string, unknown> = {};
    for (const p of pendentes) respostas[p.id] = p.value.tipo === "item" ? await decidirItem(p.value) : await decidirEdicao(p.value);
    console.log("\n▶  Retomando o grafo…");
    resultado = await grafo.invoke(new Command({ resume: respostas }), config);
    pendentes = resultado.__interrupt__ ?? [];
  }
} catch (e) {
  if (!(e instanceof Sair)) throw e;
  console.log(`\nSaindo. O grafo continua pausado em ${ARQUIVO}. Rode de novo para continuar.`);
}
rl.close();

const v = (await grafo.getState(config)).values as ResultadoHitl;
if (!(await pausasPendentes(grafo, config)).length && v.edicaoFinal) {
  const met = m.decisoes.metricasDeRevisao(v.avaliados.length, v.decisoes);
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  const relatorio = [
    `# M7 · Humanos no circuito`,
    ``,
    `Modelo: \`${lerConfig().modelo}\` · thread \`${config.configurable.thread_id}\`${aprovarTudo ? " · **--aprovar-tudo**" : ""}`,
    ``,
    `| Pausas | Intervenção | Override | Tempo médio de decisão |`,
    `|---|---|---|---|`,
    `| ${met.pausas} | ${pct(met.taxaDeIntervencao)} dos avaliados | ${pct(met.taxaDeOverride)} das decisões | ${met.tempoMedioMs === null ? "-" : `${(met.tempoMedioMs / 1000).toFixed(1)} s`} |`,
    ``,
    `- Decisões: ${v.decisoes.map((d) => `${d.alvo} → ${d.acao}${d.motivo ? ` (${d.motivo})` : ""}`).join("; ") || "nenhuma"}`,
    `- Publicados: ${v.edicaoFinal.map((i) => `${i.id} (${i.categoria})`).join(", ") || "nenhum"}`,
    v.edicaoRejeitada ? `- **Edição rejeitada:** ${v.edicaoRejeitada}` : `- Edição: ${v.arquivo ?? "não publicada"}`,
    `- Reprovadas pelo revisor: ${v.reprovadas.map((x) => x.id).join(", ") || "nenhuma"}`,
    `- Tempo desta execução: ${((Date.now() - inicio) / 1000).toFixed(0)} s`,
  ];
  writeFileSync(`${SAIDAS}m07-relatorio.md`, relatorio.join("\n"));
  console.log(`\n${relatorio.join("\n")}`);
}
await clienteFontes.close();
await clienteEdicao.close();
