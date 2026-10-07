// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { tokenizar } from "../src/tokenizador.js";

/** Quantos tokens o texto ocupa. */
export function contarTokens(texto: string): number {
  return tokenizar(texto).ids.length;
}

/**
 * Quantas vezes mais tokens o texto A ocupa em relação ao texto B.
 * Ex.: 1.3 → A gasta 30% a mais de tokens que B.
 */
export function razaoDeTokens(textoA: string, textoB: string): number {
  return contarTokens(textoA) / contarTokens(textoB);
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
  return (uso.tokensEntrada * preco.entradaPorMilhao + uso.tokensSaida * preco.saidaPorMilhao) / 1_000_000;
}
