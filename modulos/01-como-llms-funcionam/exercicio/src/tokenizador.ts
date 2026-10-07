// Fornecido: não precisa alterar.
// Usa o tokenizador o200k_base (da família GPT-4o). Cada modelo tem o seu; os números
// mudam de modelo para modelo, mas o fenômeno (texto → pedaços → ids) é o mesmo.
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

const encoder = new Tiktoken(o200k_base);

/** Quebra o texto em tokens: devolve os ids e o pedaço de texto de cada um. */
export function tokenizar(texto: string): { ids: number[]; pedacos: string[] } {
  const ids = encoder.encode(texto);
  return { ids, pedacos: ids.map((id) => encoder.decode([id])) };
}
