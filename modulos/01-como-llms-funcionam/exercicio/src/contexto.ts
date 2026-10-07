import { contarTokens } from "./tokens.js";

export interface Mensagem {
  papel: "system" | "user" | "assistant";
  conteudo: string;
}

/**
 * Tokens extras que cada mensagem gasta com a "moldura" do chat (papel, separadores).
 * O valor real depende do modelo; 4 é uma aproximação suficiente para o exercício.
 */
export const SOBRECARGA_POR_MENSAGEM = 4;

export function tokensDaMensagem(mensagem: Mensagem, contar: (texto: string) => number = contarTokens): number {
  return contar(mensagem.conteudo) + SOBRECARGA_POR_MENSAGEM;
}

/**
 * Corta o histórico para caber na janela de contexto (`limiteTokens`):
 *
 * 1. Mensagens `system` ficam sempre (são as instruções).
 * 2. Das demais, mantém as MAIS RECENTES que couberem; as antigas saem primeiro.
 *    Pare na primeira que não couber (não pule mensagens para encaixar uma mais antiga).
 * 3. A ordem original das mensagens mantidas é preservada.
 * 4. Se só as mensagens `system` já estouram o limite, lance um erro cuja mensagem mencione o "limite".
 */
export function ajustarAoContexto(
  mensagens: Mensagem[],
  limiteTokens: number,
  contar: (texto: string) => number = contarTokens,
): Mensagem[] {
  throw new Error("TODO: implemente ajustarAoContexto");
}
