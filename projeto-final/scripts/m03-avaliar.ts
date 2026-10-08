// Avaliação da etapa M3 (fornecida): roda as evals do promptfoo e decide se a mudança pode entrar.
//   pnpm -F @mentoria/curador m03:avaliar               classificação v1 × v2 (seu código)
//   pnpm -F @mentoria/curador m03:avaliar --resumos     + evals de resumo (LLM-as-judge)
//   pnpm -F @mentoria/curador m03:avaliar:solucao       o mesmo, com as soluções de referência
// Grava saidas/m03-relatorio.md. Termina com código 1 se o portão de qualidade reprovar.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lerConfig } from "@mentoria/llm";
import { CATEGORIAS, carregarNoticias } from "../src/noticia.js";

const PASTA = fileURLToPath(new URL("..", import.meta.url));
const SAIDAS = `${PASTA}saidas/`;
mkdirSync(SAIDAS, { recursive: true });

// Portão de qualidade (ajuste com a turma; os números vêm do baseline medido em aula).
const PORTAO = { macroF1Minimo: 0.8, toleranciaContraV1: 0.0, fidelidadeMinima: 0.8 };

function rodarPromptfoo(config: string, saida: string) {
  console.log(`▸ promptfoo eval -c evals/${config}`);
  const r = spawnSync(`${PASTA}node_modules/.bin/promptfoo`, ["eval", "-c", `evals/${config}`, "--no-cache", "--no-table", "--no-progress-bar", "-o", saida], {
    cwd: PASTA,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PROMPTFOO_DISABLE_TELEMETRY: "1", PROMPTFOO_DISABLE_UPDATE: "1" },
  });
  // O promptfoo sai com código != 0 quando alguma asserção falha; isso é esperado aqui.
  if (r.error) throw r.error;
  return JSON.parse(readFileSync(saida, "utf8")).results.results as ResultadoPromptfoo[];
}

interface ResultadoPromptfoo {
  provider: { label: string };
  vars: Record<string, string>;
  namedScores: Record<string, number>;
  response?: { output?: string };
  error?: string;
}

type Saida = {
  resultado: { ok: boolean; decisao?: { relevante: boolean; categoria: string | null; confianca: number } };
  publicacao: { acao: string; motivos: string[] };
};

const rotuloDe = (relevante: boolean, categoria: string | null) => (relevante ? categoria ?? "?" : "irrelevante");
const CLASSES = [...CATEGORIAS, "irrelevante"];

function metricas(pares: { esperado: string; previsto: string }[]) {
  const porClasse = CLASSES.map((c) => {
    const tp = pares.filter((p) => p.previsto === c && p.esperado === c).length;
    const fp = pares.filter((p) => p.previsto === c && p.esperado !== c).length;
    const fn = pares.filter((p) => p.previsto !== c && p.esperado === c).length;
    const precisao = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precisao + recall ? (2 * precisao * recall) / (precisao + recall) : 0;
    return { classe: c, precisao, recall, f1, suporte: tp + fn };
  });
  const acuracia = pares.filter((p) => p.esperado === p.previsto).length / pares.length;
  const macroF1 = porClasse.reduce((s, c) => s + c.f1, 0) / porClasse.length;
  return { porClasse, acuracia, macroF1 };
}

const pct = (x: number) => `${(100 * x).toFixed(0)}%`;
const noticias = new Map(carregarNoticias().map((n) => [n.id, n]));
const brutos = rodarPromptfoo("classificacao.yaml", `${SAIDAS}m03-classificacao.json`);

const versoes = ["v1", "v2"].map((versao) => {
  const linhas = brutos.filter((r) => r.provider.label === versao);
  const itens = linhas.map((r) => {
    const n = noticias.get(r.vars.id!)!;
    let saida: Saida | null = null;
    try {
      saida = JSON.parse(r.response?.output ?? "");
    } catch {}
    const d = saida?.resultado.ok ? saida.resultado.decisao! : null;
    return {
      id: n.id,
      esperado: rotuloDe(n.rotulo.relevante, n.rotulo.categoria),
      previsto: d ? rotuloDe(d.relevante, d.categoria) : "inválido",
      confianca: d?.confianca ?? null,
      acao: saida?.publicacao.acao ?? "erro",
      motivos: saida?.publicacao.motivos ?? [r.error ?? "sem saída"],
      seguro: r.vars.especial ? saida?.publicacao.acao !== "publicar" : true,
    };
  });
  return { versao, itens, ...metricas(itens) };
});

const [v1, v2] = versoes as [(typeof versoes)[0], (typeof versoes)[0]];
const acertouEm = (v: typeof v1) => new Map(v.itens.map((i) => [i.id, i.esperado === i.previsto]));
const a1 = acertouEm(v1);
const a2 = acertouEm(v2);
const regressoes = [...a1].filter(([id, ok]) => ok && !a2.get(id)).map(([id]) => id);
const melhorias = [...a1].filter(([id, ok]) => !ok && a2.get(id)).map(([id]) => id);
const inseguros = v2.itens.filter((i) => !i.seguro).map((i) => i.id);

const relatorio: string[] = [
  `# M3 · Relatório de avaliação`,
  ``,
  `Modelo: \`${lerConfig().modelo}\` · ${noticias.size} notícias rotuladas · classificação com temperature 0`,
  ``,
  `## Classificação: v1 (prompt da M2) × v2 (prompt da M3)`,
  ``,
  `| | v1 | v2 |`,
  `|---|---|---|`,
  `| Acurácia | ${pct(v1.acuracia)} | ${pct(v2.acuracia)} |`,
  `| Macro-F1 | ${v1.macroF1.toFixed(2)} | ${v2.macroF1.toFixed(2)} |`,
  `| Publicaria automaticamente | ${v1.itens.filter((i) => i.acao === "publicar").length} | ${v2.itens.filter((i) => i.acao === "publicar").length} |`,
  `| Mandaria para revisão | ${v1.itens.filter((i) => i.acao === "revisar").length} | ${v2.itens.filter((i) => i.acao === "revisar").length} |`,
  `| Casos especiais publicados (deve ser 0) | ${v1.itens.filter((i) => !i.seguro).length} | ${inseguros.length} |`,
  ``,
  `Melhorias de v1 → v2: ${melhorias.join(", ") || "nenhuma"} · Regressões: ${regressoes.join(", ") || "nenhuma"}`,
  ``,
  `### Por classe (v2)`,
  ``,
  `| Classe | Precisão | Recall | F1 | Suporte |`,
  `|---|---|---|---|---|`,
  ...v2.porClasse.map((c) => `| ${c.classe} | ${pct(c.precisao)} | ${pct(c.recall)} | ${c.f1.toFixed(2)} | ${c.suporte} |`),
  ``,
  `### Erros (v2)`,
  ``,
  `| id | Esperado | Previsto | Confiança | Ação |`,
  `|---|---|---|---|---|`,
  ...v2.itens.filter((i) => i.esperado !== i.previsto).map((i) => `| ${i.id} | ${i.esperado} | ${i.previsto} | ${i.confianca ?? "—"} | ${i.acao} |`),
];

const falhas: string[] = [];
if (v2.macroF1 < PORTAO.macroF1Minimo) falhas.push(`macro-F1 da v2 (${v2.macroF1.toFixed(2)}) abaixo de ${PORTAO.macroF1Minimo}`);
if (v2.macroF1 < v1.macroF1 - PORTAO.toleranciaContraV1) falhas.push(`v2 piorou o macro-F1 em relação à v1`);
if (inseguros.length) falhas.push(`casos especiais publicados automaticamente: ${inseguros.join(", ")}`);

if (process.argv.includes("--resumos")) {
  const resumos = rodarPromptfoo("resumos.yaml", `${SAIDAS}m03-resumos.json`);
  const media = (m: string) => resumos.reduce((s, r) => s + (r.namedScores[m] ?? 0), 0) / resumos.length;
  relatorio.push(
    ``,
    `## Resumos (${resumos.length} notícias relevantes com fonte)`,
    ``,
    `| Métrica | Média |`,
    `|---|---|`,
    `| Tamanho ≤ 280 (código) | ${pct(media("tamanho"))} |`,
    `| Fidelidade (juiz LLM) | ${pct(media("fidelidade"))} |`,
    `| Estilo: português e ≤ 2 frases (juiz LLM) | ${pct(media("estilo"))} |`,
    `| ≤ 2 frases (código) | ${pct(media("duas_frases"))} |`,
    ``,
    `O juiz é o mesmo modelo que escreveu os resumos: leia as reprovações em saidas/m03-resumos.json antes de confiar na nota.`,
  );
  if (media("fidelidade") < PORTAO.fidelidadeMinima) falhas.push(`fidelidade média dos resumos abaixo de ${pct(PORTAO.fidelidadeMinima)}`);
}

relatorio.push(``, `## Portão de qualidade`, ``, falhas.length ? falhas.map((f) => `- ❌ ${f}`).join("\n") : "- ✅ aprovado");
writeFileSync(`${SAIDAS}m03-relatorio.md`, relatorio.join("\n"));
console.log(`\n${relatorio.slice(6, 15).join("\n")}\n\n${falhas.length ? `❌ Portão reprovado:\n- ${falhas.join("\n- ")}` : "✅ Portão aprovado"}`);
console.log(`Relatório completo: projeto-final/saidas/m03-relatorio.md`);
process.exit(falhas.length ? 1 : 0);
