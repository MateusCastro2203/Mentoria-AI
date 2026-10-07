// Demo (aula, 4–11 min): o mesmo conteúdo em PT e EN ocupa quantidades diferentes de tokens.
// Roda offline: pnpm --filter @mentoria/ex01-llms demo:tokens
import { tokenizar } from "../src/tokenizador.js";

const pares = [
  ["O modelo prevê o próximo token com base no contexto.", "The model predicts the next token based on the context."],
  ["Parcelamento sem juros no cartão de crédito", "Interest-free credit card installments"],
  ["inconstitucionalissimamente", "unconstitutionally"],
];

for (const [pt, en] of pares) {
  for (const texto of [pt!, en!]) {
    const { ids, pedacos } = tokenizar(texto);
    console.log(`${ids.length.toString().padStart(3)} tokens │ ${pedacos.map((p) => `[${p}]`).join("")}`);
  }
  console.log();
}
console.log("Tokenizador: o200k_base. Outros modelos usam outros tokenizadores e dão outros números.");
