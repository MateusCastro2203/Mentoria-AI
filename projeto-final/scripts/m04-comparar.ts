// Experimento da etapa M4 (fornecido): o mesmo trabalho feito por um pipeline fixo com a skill e por um agente.
// pnpm -F @mentoria/curador m04:comparar            (seu código, em src/)
// pnpm -F @mentoria/curador m04:comparar:solucao    (soluções de referência)
// Grava saidas/m04-comparacao.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { lerConfig } from "@mentoria/llm";
import { carregarFontes, carregarNoticias, type Noticia } from "../src/noticia.js";
import type { Avaliacao } from "../src/m04/ferramentas.js";

const usarSolucao = Boolean(process.env.SOLUCAO);
const { classificarComSkill }: typeof import("../src/m04/skill.js") = usarSolucao
  ? await import("../solucao/m04/skill.js")
  : await import("../src/m04/skill.js");
const { curarComAgente }: typeof import("../src/m04/agente.js") = usarSolucao
  ? await import("../solucao/m04/agente.js")
  : await import("../src/m04/agente.js");
const { decidirPublicacao }: typeof import("../src/m03/guardrails.js") = usarSolucao
  ? await import("../solucao/m03/guardrails.js")
  : await import("../src/m03/guardrails.js");

const EXECUCOES_DO_AGENTE = Number(process.env.EXECUCOES ?? 2);
const noticias = carregarNoticias();
const fontes = carregarFontes();

// Gabarito: o que um editor publicaria (relevante pelo rótulo humano e com fonte https).
const gabarito = new Set(noticias.filter((n) => n.rotulo.relevante && n.url.startsWith("https://")).map((n) => n.id));

let chamadasAoModelo = 0;
async function avaliar(noticia: Noticia): Promise<Avaliacao> {
  chamadasAoModelo++;
  const resultado = await classificarComSkill(noticia);
  const { acao, motivos } = decidirPublicacao(noticia, resultado);
  return {
    id: noticia.id,
    acao,
    categoria: resultado.ok ? resultado.decisao.categoria : null,
    confianca: resultado.ok ? resultado.decisao.confianca : null,
    motivos,
  };
}

function qualidade(selecao: string[]) {
  const certos = selecao.filter((id) => gabarito.has(id)).length;
  return {
    precisao: selecao.length ? certos / selecao.length : 0,
    recall: certos / gabarito.size,
    indevidas: selecao.filter((id) => !gabarito.has(id)),
  };
}

/** Resume a entrada de uma ferramenta: listas de ids viram "N ids". */
function descrever(entrada: unknown): string {
  const e = entrada as { ids?: string[]; fonte?: string };
  if (Array.isArray(e?.ids)) return `${e.ids.length} ids`;
  if (e?.fonte) return e.fonte;
  return "";
}

/** Notícias das fontes lidas que o agente nunca mandou avaliar. */
function naoAvaliadas(r: { fontesLidas: string[]; chamadas: { ferramenta: string; entrada: unknown }[] }): string[] {
  const avaliadas = new Set(r.chamadas.filter((c) => c.ferramenta === "avaliarNoticias").flatMap((c) => (c.entrada as { ids: string[] }).ids));
  return fontes.filter((f) => r.fontesLidas.includes(f.nome)).flatMap((f) => f.noticias).filter((id) => !avaliadas.has(id));
}

const linhas: string[] = [];
const pct = (x: number) => `${Math.round(100 * x)}%`;

// 1) Pipeline fixo: a skill em todas as notícias de todas as fontes.
console.log("▸ pipeline com a skill (todas as notícias)");
chamadasAoModelo = 0;
let inicio = Date.now();
const selecaoPipeline: string[] = [];
for (const n of noticias) if ((await avaliar(n)).acao === "publicar") selecaoPipeline.push(n.id);
const pipeline = { selecao: selecaoPipeline, chamadas: chamadasAoModelo, ms: Date.now() - inicio, ...qualidade(selecaoPipeline) };
linhas.push(
  `| Pipeline + skill | ${pipeline.selecao.length} | ${pct(pipeline.precisao)} | ${pct(pipeline.recall)} | ${pipeline.chamadas} | ${(pipeline.ms / 1000).toFixed(0)} s | todas (${fontes.length}) | ${pipeline.indevidas.join(", ") || "—"} |`,
);

// 2) Agente: decide quais fontes ler e o que avaliar.
const detalhes: string[] = [];
for (let i = 1; i <= EXECUCOES_DO_AGENTE; i++) {
  console.log(`▸ agente, execução ${i}`);
  chamadasAoModelo = 0;
  inicio = Date.now();
  const r = await curarComAgente({ fontes, noticias, avaliar });
  const q = qualidade(r.selecao);
  const total = chamadasAoModelo + r.passos;
  linhas.push(
    `| Agente #${i} | ${r.selecao.length} | ${pct(q.precisao)} | ${pct(q.recall)} | ${total} (${r.passos} do agente + ${chamadasAoModelo} avaliações) | ${((Date.now() - inicio) / 1000).toFixed(0)} s | ${r.fontesLidas.length} | ${q.indevidas.join(", ") || "—"} |`,
  );
  const puladas = fontes.map((f) => f.nome).filter((f) => !r.fontesLidas.includes(f));
  detalhes.push(
    `### Agente #${i}`,
    ``,
    `- Entregou: ${r.entregou ? "sim" : "**não** (parou antes de entregar)"} · passos: ${r.passos}`,
    `- Fontes lidas: ${r.fontesLidas.join(", ") || "nenhuma"}`,
    `- Fontes puladas: ${puladas.join(", ") || "nenhuma"}`,
    `- Recusadas pelo código: ${r.recusadas.map((x) => `${x.id} (${x.motivo})`).join(", ") || "nenhuma"}`,
    `- Perdidas (no gabarito, fora da seleção): ${[...gabarito].filter((id) => !r.selecao.includes(id)).join(", ") || "nenhuma"}`,
    `- Trajetória: ${r.chamadas.map((c) => `${c.ferramenta}(${descrever(c.entrada)})`).join(" → ")}`,
    `- Lidas e não avaliadas: ${naoAvaliadas(r).join(", ") || "nenhuma"}`,
    ``,
  );
}

const relatorio = [
  `# M4 · Pipeline com skill × agente`,
  ``,
  `Modelo: \`${lerConfig().modelo}\` · ${noticias.length} notícias em ${fontes.length} fontes · gabarito: ${gabarito.size} publicáveis (relevantes e com fonte https)`,
  ``,
  `| Abordagem | Selecionadas | Precisão | Recall | Chamadas ao modelo | Tempo | Fontes lidas | Publicadas indevidamente |`,
  `|---|---|---|---|---|---|---|---|`,
  ...linhas,
  ``,
  ...detalhes,
];
mkdirSync(new URL("../saidas/", import.meta.url), { recursive: true });
writeFileSync(new URL("../saidas/m04-comparacao.md", import.meta.url), relatorio.join("\n"));
console.log(`\n${relatorio.slice(4, 6 + linhas.length).join("\n")}\n\nRelatório completo: projeto-final/saidas/m04-comparacao.md`);
