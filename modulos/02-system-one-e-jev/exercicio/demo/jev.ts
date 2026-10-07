// Demo OPCIONAL do mentor: a mesma decisão feita pelo Jev (TypeSafe AI), via HTTP.
// Precisa de acesso (early access) e da variável TYPESAFE_API_KEY. Sem chave, a demo só explica.
// Formato conforme https://docs.typesafe.ai/api (consultado em 2026-10-07). NÃO testado sem chave.
// pnpm -F @mentoria/ex02-decisoes demo:jev
import { CATEGORIAS, carregarNoticias } from "@mentoria/curador";

const chave = process.env.TYPESAFE_API_KEY;
const noticia = carregarNoticias().find((n) => n.id === (process.argv[2] ?? "n06"))!;

const corpo = {
  model: "jev-latest",
  state: { titulo: noticia.titulo, resumo: noticia.resumo, fonte: noticia.fonte },
  questions: {
    relevante: {
      type: "noul",
      instructions: "Esta notícia ajuda um desenvolvedor a construir, avaliar ou operar sistemas com IA?",
    },
    categoria: {
      type: "choice",
      instructions: "Em que categoria esta notícia entra numa newsletter de IA aplicada para devs?",
      criteria: Object.fromEntries(CATEGORIAS.map((c) => [c, null])),
    },
  },
};

if (!chave) {
  console.log("Sem TYPESAFE_API_KEY: mostrando só a requisição que seria enviada a POST https://api.typesafe.ai/v1/systemone\n");
  console.log(JSON.stringify(corpo, null, 2));
  console.log("\nA resposta traz, para cada pergunta, o valor (noul / choice), as probabilidades de cada opção e a confiança.");
  process.exit(0);
}

const inicio = Date.now();
const resposta = await fetch("https://api.typesafe.ai/v1/systemone", {
  method: "POST",
  headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
  body: JSON.stringify(corpo),
});
console.log(`HTTP ${resposta.status} em ${Date.now() - inicio} ms`);
console.log(JSON.stringify(await resposta.json(), null, 2));
console.log(`\nRótulo humano: ${JSON.stringify(noticia.rotulo)}`);
