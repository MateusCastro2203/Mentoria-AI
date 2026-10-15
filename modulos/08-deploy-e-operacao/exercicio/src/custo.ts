// EXERCÍCIO 08 — custo. Tokens custam dinheiro (ou tempo de máquina); antes de chamar o modelo,
// dá para ESTIMAR, e depois de chamar, dá para MEDIR.
import type { Precos, Uso } from "./estado.js";

/**
 * Estimativa grosseira de tokens: Math.ceil(texto.length / 4).
 * É uma regra de bolso: o número real depende do tokenizador do modelo e do idioma (Aula 1), e a chamada
 * ainda soma as instruções do sistema. Serve para um teto de segurança, não para a fatura: a fatura usa o
 * `uso` que o provedor devolve.
 */
export function estimarTokens(texto: string): number {
  throw new Error("TODO: implemente estimarTokens");
}

/** custo = tokensEntrada × entradaPorMilhao / 1.000.000 + tokensSaida × saidaPorMilhao / 1.000.000 (ausente = 0). */
export function custo(uso: Uso, precos: Precos): number {
  throw new Error("TODO: implemente custo");
}
