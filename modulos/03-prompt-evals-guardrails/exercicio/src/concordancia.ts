// Quem avalia o avaliador? Antes de confiar num juiz LLM, compare as notas dele com as de um humano.

/** Concordância simples: fração dos itens em que os dois deram o mesmo rótulo. Listas vazias → 0. */
export function concordancia(a: string[], b: string[]): number {
  throw new Error("TODO: implemente concordancia");
}

/**
 * Kappa de Cohen: concordância descontando a que aconteceria por acaso.
 *   κ = (pₒ − pₑ) / (1 − pₑ)
 * pₒ = concordância observada; pₑ = Σ, para cada rótulo, (fração em a) × (fração em b).
 * 1 = concordância perfeita; 0 = igual ao acaso; negativo = pior que o acaso.
 * Se pₑ = 1 (os dois usaram sempre o mesmo rótulo), devolva 1 se pₒ = 1, senão 0.
 * As listas devem ter o mesmo tamanho (lance erro se não tiverem).
 */
export function kappaDeCohen(a: string[], b: string[]): number {
  throw new Error("TODO: implemente kappaDeCohen");
}
