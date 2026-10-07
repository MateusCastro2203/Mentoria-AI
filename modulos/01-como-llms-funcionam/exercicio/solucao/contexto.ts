// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

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
  const instrucoes = mensagens.filter((m) => m.papel === "system");
  let usados = instrucoes.reduce((total, m) => total + tokensDaMensagem(m, contar), 0);
  if (usados > limiteTokens) {
    throw new Error(`As mensagens system (${usados} tokens) já passam do limite de ${limiteTokens} tokens.`);
  }

  const mantidas = new Set<Mensagem>(instrucoes);
  for (let i = mensagens.length - 1; i >= 0; i--) {
    const mensagem = mensagens[i]!;
    if (mensagem.papel === "system") continue;
    const custo = tokensDaMensagem(mensagem, contar);
    if (usados + custo > limiteTokens) break;
    usados += custo;
    mantidas.add(mensagem);
  }
  return mensagens.filter((m) => mantidas.has(m));
}
