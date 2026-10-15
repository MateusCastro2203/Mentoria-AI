// Avaliação de UMA versão do prompt (a skill da M4), para promover em produção (M8). Fornecido.
//   pnpm -F @mentoria/curador m08:avaliar                         avalia skills/curar-noticia (a sua)
//   pnpm -F @mentoria/curador m08:avaliar:solucao                 avalia solucao/skills/curar-noticia
//   ... -- --pasta <pasta>                                         avalia outra pasta (ex.: uma cópia com mudanças)
// Grava saidas/m08-avaliacao.json ({ pasta, avaliacao }) e termina com código 1 se reprovar no portão
// absoluto (macro-F1 mínimo, nenhum caso especial publicado). A comparação com a versão ATIVA quem faz é
// o Worker, na hora de promover: só ele sabe qual versão está no ar.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lerConfig } from "@mentoria/llm";
import { metricas, rotuloDe, type Saida } from "../evals/metricas.js";
import { rodarPromptfoo } from "../evals/rodar.js";
import { carregarNoticias } from "../src/noticia.js";
import { hashDoTexto, PORTAO_PADRAO, type Avaliacao } from "../src/m08/tipos-prompts.js";

const PASTA = fileURLToPath(new URL("..", import.meta.url));
const SAIDAS = `${PASTA}saidas/`;
mkdirSync(SAIDAS, { recursive: true });

const i = process.argv.indexOf("--pasta");
const padrao = process.env.SOLUCAO ? "solucao/skills/curar-noticia" : "skills/curar-noticia";
const pastaSkill = resolve(i > 0 ? process.argv[i + 1]! : join(PASTA, padrao));
const texto = readFileSync(join(pastaSkill, "SKILL.md"), "utf8");

console.log(`Avaliando ${relative(process.cwd(), pastaSkill) || "."} com ${lerConfig().modelo}…`);
const inicio = Date.now();
const noticias = new Map(carregarNoticias().map((n) => [n.id, n]));
// O provider (evals/curador.ts) lê a pasta da skill desta variável; o promptfoo herda o ambiente.
process.env.SKILL_PASTA = pastaSkill;
const brutos = rodarPromptfoo(PASTA, "skill.yaml", `${SAIDAS}m08-skill.json`);

const comErro = brutos.filter((r) => r.error && !r.response?.output);
if (comErro.length) console.log(`⚠️  ${comErro.length} caso(s) com erro. Primeiro: ${comErro[0]!.error!.split("\n")[0]}`);

const itens = brutos.map((r) => {
  const n = noticias.get(r.vars.id!)!;
  let saida: Saida | null = null;
  try {
    saida = JSON.parse(r.response?.output ?? "");
  } catch {}
  const d = saida?.resultado.ok ? saida.resultado.decisao! : null;
  return {
    esperado: rotuloDe(n.rotulo.relevante, n.rotulo.categoria),
    previsto: d ? rotuloDe(d.relevante, d.categoria) : "inválido",
    especialPublicado: Boolean(r.vars.especial) && saida?.publicacao.acao === "publicar",
  };
});
const m = metricas(itens);
const avaliacao: Avaliacao = {
  hash: await hashDoTexto(texto),
  modelo: lerConfig().modelo,
  casos: itens.length,
  macroF1: Number(m.macroF1.toFixed(3)),
  acuracia: Number(m.acuracia.toFixed(3)),
  especiaisPublicados: itens.filter((x) => x.especialPublicado).length,
};
writeFileSync(`${SAIDAS}m08-avaliacao.json`, JSON.stringify({ pasta: pastaSkill, avaliacao }, null, 2));

const falhas: string[] = [];
if (avaliacao.especiaisPublicados > 0) falhas.push(`casos especiais publicados: ${avaliacao.especiaisPublicados}`);
if (avaliacao.macroF1 < PORTAO_PADRAO.macroF1Minimo) falhas.push(`macro-F1 ${avaliacao.macroF1} abaixo de ${PORTAO_PADRAO.macroF1Minimo}`);
console.log(
  `\nversão ${avaliacao.hash} · ${avaliacao.casos} casos · macro-F1 ${avaliacao.macroF1} · acurácia ${avaliacao.acuracia} · especiais publicados ${avaliacao.especiaisPublicados} · ${((Date.now() - inicio) / 1000).toFixed(0)} s`,
);
console.log(falhas.length ? `❌ Portão reprovado:\n- ${falhas.join("\n- ")}` : "✅ Portão aprovado. Para promover: pnpm -F @mentoria/curador m08:operar promover <id>");
process.exit(falhas.length ? 1 : 0);
