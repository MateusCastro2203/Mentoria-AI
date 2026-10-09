import type { Atendimento, Estado } from "./estado.js";

/**
 * A ARESTA CONDICIONAL da triagem: olha o estado depois da classificação e diz para qual nó ir.
 * - confiança ausente ou abaixo de `limiar` (padrão 0.7) → "humano";
 * - senão, pela categoria: "cobranca" → "financeiro", "tecnico" → "suporte", "duvida" → "faq";
 * - categoria ausente → "humano".
 * É uma função pura: dá para testar sem montar o grafo.
 */
export function rotaDeTriagem(estado: Pick<Estado, "categoria" | "confianca">, limiar = 0.7): Atendimento {
  throw new Error("TODO: implemente rotaDeTriagem");
}
