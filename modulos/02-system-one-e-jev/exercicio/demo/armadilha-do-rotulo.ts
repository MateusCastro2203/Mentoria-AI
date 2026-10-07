// Demo (aula, 13–20 min): saída restrita a um schema não deixa o modelo "pensar diferente";
// ela só proíbe tokens. Se o nome das opções colide com o que o modelo queria escrever, a escolha vira outra.
// pnpm -F @mentoria/ex02-decisoes demo:armadilha-do-rotulo
import { z } from "zod";
import { gerarObjeto } from "@mentoria/llm";
import { carregarNoticias } from "@mentoria/curador";

const ROTULOS = ["modelos", "ferramentas", "pesquisa", "regulacao", "mercado", "irrelevante"] as const;
const system =
  "Classifique a notícia para uma newsletter de IA aplicada para devs. Use 'irrelevante' se ela não ajudar um dev a construir, avaliar ou operar sistemas com IA.";

for (const noticia of carregarNoticias().filter((n) => ["n02", "n03", "n05"].includes(n.id))) {
  const r = await gerarObjeto({
    schema: z.object({ rotulo: z.enum(ROTULOS) }),
    system,
    prompt: `${noticia.titulo}\n${noticia.resumo}`,
    temperature: 0,
    logprobs: true,
  });
  // O token de decisão é o primeiro depois de `"rotulo": "`.
  const tokens = r.logprobs ?? [];
  const antes = (k: number) => tokens.slice(0, k).map((t) => t.token).join("");
  const k = tokens.findIndex((_, i) => /"rotulo":\s*"$/.test(antes(i)));
  const decisao = tokens[k];
  console.log(`\n${noticia.id} · esperado: ${noticia.rotulo.categoria ?? "irrelevante"} · escolhido: ${r.objeto.rotulo}`);
  if (decisao) {
    console.log(`  token de decisão: ${JSON.stringify(decisao.token)}; o que o modelo queria escrever ali:`);
    for (const a of decisao.alternativas) console.log(`    ${JSON.stringify(a.token).padEnd(12)} ${(Math.exp(a.logprob) * 100).toFixed(1)}%`);
  }
}
console.log(
  "\nRepare: o modelo queria escrever 'relevante' ou 'IA'. O schema só aceitava rótulos da lista, e o único que começa com 're' é 'regulacao'.",
);
