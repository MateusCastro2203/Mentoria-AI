// Métricas de classificação: o que uma eval de verdade calcula além da "acurácia".

export interface Par {
  esperado: string;
  previsto: string;
}

/**
 * Matriz de confusão: matriz[esperado][previsto] = quantidade.
 * Inclua todas as `classes` como linhas e colunas (com 0 onde não houver casos).
 * Pares com classes fora da lista entram assim mesmo (crie a linha/coluna).
 */
export function matrizDeConfusao(pares: Par[], classes: string[]): Record<string, Record<string, number>> {
  throw new Error("TODO: implemente matrizDeConfusao");
}

export interface MetricasDaClasse {
  precisao: number;
  recall: number;
  f1: number;
  /** Quantos casos dessa classe existem de verdade (esperado === classe). */
  suporte: number;
}

/**
 * Para UMA classe:
 * - precisão = VP / (VP + FP): das vezes que o modelo disse "classe", quantas eram;
 * - recall    = VP / (VP + FN): dos casos que eram "classe", quantos o modelo achou;
 * - F1        = média harmônica de precisão e recall.
 * Divisão por zero → 0.
 */
export function metricasDaClasse(pares: Par[], classe: string): MetricasDaClasse {
  throw new Error("TODO: implemente metricasDaClasse");
}

/** Média simples do F1 de cada classe da lista (cada classe pesa igual, rara ou comum). */
export function macroF1(pares: Par[], classes: string[]): number {
  throw new Error("TODO: implemente macroF1");
}
