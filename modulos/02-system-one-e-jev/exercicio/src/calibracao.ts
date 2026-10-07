// Calibração: a confiança acompanha o acerto? Se o modelo diz 0,9 em 100 casos, ele deveria acertar ~90.

export interface Previsao {
  /** Confiança informada, de 0 a 1. */
  confianca: number;
  /** A previsão bateu com o rótulo humano? */
  acertou: boolean;
}

/** Fração de previsões corretas. Lista vazia → 0. */
export function acuracia(previsoes: Previsao[]): number {
  throw new Error("TODO: implemente acuracia");
}

/**
 * Brier score: média de (confiança − acerto)², com acerto = 1 ou 0. Quanto menor, melhor.
 * Lista vazia → 0.
 */
export function brier(previsoes: Previsao[]): number {
  throw new Error("TODO: implemente brier");
}

export interface Faixa {
  de: number;
  ate: number;
  quantidade: number;
  /** null quando a faixa está vazia. */
  confiancaMedia: number | null;
  acuracia: number | null;
}

/**
 * Divide [0, 1] em `nFaixas` faixas de mesma largura e, para cada uma, calcula a confiança média e a
 * acurácia das previsões que caem nela. Uma previsão com confiança c vai para a faixa
 * min(floor(c × nFaixas), nFaixas − 1) — assim a confiança 1 cai na última.
 * Devolve todas as faixas, inclusive as vazias.
 */
export function tabelaDeCalibracao(previsoes: Previsao[], nFaixas = 5): Faixa[] {
  throw new Error("TODO: implemente tabelaDeCalibracao");
}

/**
 * ECE (expected calibration error): média ponderada, pelas faixas não vazias, de
 * |acurácia da faixa − confiança média da faixa|, com peso = quantidade da faixa / total.
 * 0 = perfeitamente calibrado. Lista vazia → 0.
 */
export function ece(previsoes: Previsao[], nFaixas = 5): number {
  throw new Error("TODO: implemente ece");
}

/**
 * Se você só aceitar automaticamente as previsões com confiança >= limiar:
 * - cobertura = fração das previsões aceitas;
 * - acuracia = acurácia entre as aceitas (null se nenhuma for aceita).
 * É a base para decidir quando chamar um humano (Módulo 7).
 */
export function coberturaVsAcuracia(
  previsoes: Previsao[],
  limiar: number,
): { cobertura: number; acuracia: number | null } {
  throw new Error("TODO: implemente coberturaVsAcuracia");
}
