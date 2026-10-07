import { tokenizar } from "./tokenizador.js";

/** Quantos tokens o texto ocupa. */
export function contarTokens(texto: string): number {
  // TODO: use `tokenizar` (src/tokenizador.ts).
  throw new Error("TODO: implemente contarTokens");
}

/**
 * Quantas vezes mais tokens o texto A ocupa em relação ao texto B.
 * Ex.: 1.3 → A gasta 30% a mais de tokens que B.
 */
export function razaoDeTokens(textoA: string, textoB: string): number {
  throw new Error("TODO: implemente razaoDeTokens");
}

/** Preço em dólares por 1 milhão de tokens, como as tabelas de preço dos provedores costumam mostrar. */
export interface Preco {
  entradaPorMilhao: number;
  saidaPorMilhao: number;
}

export interface UsoDeTokens {
  tokensEntrada: number;
  tokensSaida: number;
}

/** Custo em dólares de uma chamada: tokens de entrada e de saída têm preços diferentes. */
export function custoPorChamada(uso: UsoDeTokens, preco: Preco): number {
  throw new Error("TODO: implemente custoPorChamada");
}
