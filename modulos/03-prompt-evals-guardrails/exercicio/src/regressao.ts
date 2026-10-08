// Regressão: a versão nova melhorou o total, mas quebrou o que funcionava?

/** Resultado de uma execução de eval: id do caso → passou? */
export type Execucao = Record<string, boolean>;

export interface Comparacao {
  /** Casos que passavam na base e falham no candidato. */
  regressoes: string[];
  /** Casos que falhavam na base e passam no candidato. */
  melhorias: string[];
  /** Acurácia do candidato − acurácia da base (só sobre os casos presentes nas DUAS execuções). */
  delta: number;
}

/**
 * Compara duas execuções. Considere só os ids presentes nas duas. Listas em ordem alfabética.
 * Se não houver ids em comum, delta = 0.
 */
export function compararExecucoes(base: Execucao, candidato: Execucao): Comparacao {
  throw new Error("TODO: implemente compararExecucoes");
}

/**
 * Portão de qualidade: aprova se delta >= minDelta E o número de regressões <= maxRegressoes.
 * Devolve os motivos de reprovação (lista vazia quando aprova).
 */
export function aprovarMudanca(
  comparacao: Comparacao,
  regra: { minDelta: number; maxRegressoes: number },
): { aprovado: boolean; motivos: string[] } {
  throw new Error("TODO: implemente aprovarMudanca");
}
