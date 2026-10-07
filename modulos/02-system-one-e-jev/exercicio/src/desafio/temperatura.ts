// DESAFIO EXTRA — temperature scaling (Guo et al., 2017).
// A mesma temperatura do Módulo 1 serve para CALIBRAR: se o modelo é confiante demais,
// dividir os logits por um T > 1 "achata" as probabilidades até elas baterem com a taxa de acerto.
import { softmax } from "../softmax.js";

export interface ExemploRotulado {
  /** Logits do modelo para cada classe. */
  logits: number[];
  /** Índice da classe correta. */
  correta: number;
}

/**
 * Log-verossimilhança negativa média (NLL): média de −ln(p_correta), com p = softmax(logits, T).
 * Quanto menor, melhor o modelo "explica" os rótulos. Use `softmax` de ../softmax.ts.
 */
export function logVerossimilhancaNegativa(exemplos: ExemploRotulado[], temperatura: number): number {
  throw new Error("TODO (desafio): implemente logVerossimilhancaNegativa");
}

/**
 * Procura, entre os candidatos, a temperatura com menor NLL. Em empate, a primeira.
 * Padrão: 0,1 a 5,0 de 0,1 em 0,1 (gere como i / 10 para evitar erro de ponto flutuante).
 */
export function ajustarTemperatura(
  exemplos: ExemploRotulado[],
  candidatos: number[] = Array.from({ length: 50 }, (_, i) => (i + 1) / 10),
): number {
  throw new Error("TODO (desafio): implemente ajustarTemperatura");
}
