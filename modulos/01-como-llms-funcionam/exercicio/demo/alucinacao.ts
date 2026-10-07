// Demo (aula, 27–37 min): perguntas sobre coisas que NÃO existem. O modelo costuma responder
// com confiança mesmo assim. Os nomes abaixo são inventados para a demo.
// pnpm --filter @mentoria/ex01-llms demo:alucinacao
import { gerarTexto } from "@mentoria/llm";

const perguntas = [
  "Resuma em duas frases o artigo 'Gradientes Tropicais', publicado por Helena Vasconcellos Prado no NeurIPS 2019.",
  "Qual foi a principal contribuição do framework Jabuticaba.js para a orquestração de agentes?",
  "Em que ano foi fundada a cidade de Porto Esmeralda do Norte, em Minas Gerais?",
];

for (const pergunta of perguntas) {
  const { texto } = await gerarTexto({ prompt: pergunta, temperature: 0 });
  console.log(`❓ ${pergunta}\n💬 ${texto.trim()}\n`);
}
console.log("Nenhum desses itens existe (até onde a demo foi preparada). Quantas respostas admitiram não saber?");
