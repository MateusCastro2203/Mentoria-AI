// Experimento da etapa M2 (fornecido): texto livre (M1) × decisão tipada (M2) nas notícias rotuladas.
// pnpm --filter @mentoria/curador m02:comparar            (usa o seu código, em src/)
// pnpm --filter @mentoria/curador m02:comparar:solucao    (usa as soluções de referência)
// Grava saidas/m02-comparacao.md e saidas/m02-previsoes.json (este último serve para o exercício de calibração).
import { mkdirSync, writeFileSync } from "node:fs";
import { lerConfig } from "@mentoria/llm";
import { CATEGORIAS, carregarNoticias, type Categoria, type Rotulo } from "../src/noticia.js";

const usarSolucao = Boolean(process.env.SOLUCAO);
const { classificarLivre }: typeof import("../src/m01/classificar-livre.js") = usarSolucao
  ? await import("../solucao/m01/classificar-livre.js")
  : await import("../src/m01/classificar-livre.js");
const { classificarTipado }: typeof import("../src/m02/classificar-tipado.js") = usarSolucao
  ? await import("../solucao/m02/classificar-tipado.js")
  : await import("../src/m02/classificar-tipado.js");

const TEMPERATURA_LIVRE = 0.7;

/**
 * Tenta extrair relevância e categoria de uma resposta em texto livre, como um programa faria:
 * olha só a primeira linha (a justificativa costuma citar outras categorias) e procura
 * "relevante" / "não é relevante" e "Categoria: X" (ou uma categoria solta na linha).
 */
function interpretarRespostaLivre(texto: string): Rotulo | null {
  const linha = (texto.split("\n")[0] ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  let relevante: boolean;
  if (/\b(nao e relevante|nao relevante|irrelevante)\b/.test(linha)) relevante = false;
  else if (/\brelevantes?\b/.test(linha)) relevante = true;
  else return null;
  if (!relevante) return { relevante, categoria: null };
  const rotulada = linha.match(/categoria:?\s*\**\s*([a-z]+)/)?.[1] ?? "";
  const categoria = (CATEGORIAS as readonly string[]).includes(rotulada)
    ? (rotulada as Categoria)
    : CATEGORIAS.find((c) => linha.includes(c));
  return categoria ? { relevante, categoria } : null;
}

const acertou = (previsto: Rotulo, esperado: Rotulo) =>
  previsto.relevante === esperado.relevante && (!previsto.relevante || previsto.categoria === esperado.categoria);

const noticias = carregarNoticias();
const linhas: string[] = [];
const previsoes: { id: string; confianca: number; acertou: boolean }[] = [];
const livre = { interpretadas: 0, acertos: 0, ms: 0, caracteres: 0 };
const tipado = { validas: 0, acertos: 0, ms: 0 };

for (const n of noticias) {
  let inicio = Date.now();
  const texto = await classificarLivre(n, { temperature: TEMPERATURA_LIVRE });
  livre.ms += Date.now() - inicio;
  livre.caracteres += texto.length;
  const lido = interpretarRespostaLivre(texto);
  if (lido) livre.interpretadas++;
  if (lido && acertou(lido, n.rotulo)) livre.acertos++;

  inicio = Date.now();
  const r = await classificarTipado(n);
  tipado.ms += Date.now() - inicio;
  let colunaTipado = `⚠️ ${r.ok ? "" : r.motivo}`;
  if (r.ok) {
    tipado.validas++;
    const ok = acertou(r.decisao, n.rotulo);
    if (ok) tipado.acertos++;
    previsoes.push({ id: n.id, confianca: r.decisao.confianca, acertou: ok });
    colunaTipado = `${ok ? "✔" : "✖"} ${r.decisao.relevante ? r.decisao.categoria : "irrelevante"} (${r.decisao.confianca})`;
  }
  const esperado = n.rotulo.relevante ? n.rotulo.categoria : "irrelevante";
  const colunaLivre = lido ? `${acertou(lido, n.rotulo) ? "✔" : "✖"} ${lido.relevante ? lido.categoria : "irrelevante"}` : "❓ não interpretável";
  linhas.push(`| ${n.id} | ${esperado} | ${colunaLivre} | ${colunaTipado} | ${texto.replace(/\s*\n\s*/g, " ⏎ ").replaceAll("|", "\\|").slice(0, 120)}… |`);
  process.stdout.write(".");
}

const N = noticias.length;
const pct = (x: number, total = N) => `${Math.round((100 * x) / total)}%`;
const faixas = [0, 0.5, 0.8, 0.9, 0.95, 1.0001];
const tabelaFaixas = faixas.slice(0, -1).map((de, i) => {
  const ate = faixas[i + 1]!;
  const grupo = previsoes.filter((p) => p.confianca >= de && p.confianca < ate);
  const acc = grupo.length ? grupo.filter((p) => p.acertou).length / grupo.length : null;
  const conf = grupo.length ? grupo.reduce((s, p) => s + p.confianca, 0) / grupo.length : null;
  return `| ${de.toFixed(2)}–${Math.min(ate, 1).toFixed(2)} | ${grupo.length} | ${conf?.toFixed(2) ?? "—"} | ${acc === null ? "—" : pct(acc * grupo.length, grupo.length)} |`;
});

const relatorio = [
  `# M2 · Texto livre × decisão tipada`,
  ``,
  `Modelo: \`${lerConfig().modelo}\` · ${N} notícias · texto livre com temperature ${TEMPERATURA_LIVRE}, tipado com temperature 0`,
  ``,
  `## Resumo`,
  ``,
  `| | Texto livre (M1) | Decisão tipada (M2) |`,
  `|---|---|---|`,
  `| Saídas que um programa consegue usar | ${livre.interpretadas}/${N} (${pct(livre.interpretadas)}) | ${tipado.validas}/${N} (${pct(tipado.validas)}) |`,
  `| Acertos (sobre o total) | ${livre.acertos}/${N} (${pct(livre.acertos)}) | ${tipado.acertos}/${N} (${pct(tipado.acertos)}) |`,
  `| Latência média | ${Math.round(livre.ms / N)} ms | ${Math.round(tipado.ms / N)} ms |`,
  `| Tamanho médio da resposta | ${Math.round(livre.caracteres / N)} caracteres | um objeto JSON |`,
  ``,
  `## A confiança acompanha o acerto?`,
  ``,
  `| Faixa de confiança | Previsões | Confiança média | Acurácia |`,
  `|---|---|---|---|`,
  ...tabelaFaixas,
  ``,
  `Use \`saidas/m02-previsoes.json\` com as funções do exercício 02 (ece, brier, coberturaVsAcuracia).`,
  ``,
  `## Notícia a notícia`,
  ``,
  `| id | Rótulo humano | Texto livre interpretado | Tipado (confiança) | Resposta livre (início) |`,
  `|---|---|---|---|---|`,
  ...linhas,
];

mkdirSync(new URL("../saidas/", import.meta.url), { recursive: true });
writeFileSync(new URL("../saidas/m02-comparacao.md", import.meta.url), relatorio.join("\n"));
writeFileSync(new URL("../saidas/m02-previsoes.json", import.meta.url), JSON.stringify(previsoes, null, 2));
console.log(`\n${relatorio.slice(5, 12).join("\n")}\n\nRelatório completo em projeto-final/saidas/m02-comparacao.md`);
