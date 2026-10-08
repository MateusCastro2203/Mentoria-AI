// DESAFIO EXTRA — quanto dá para confiar numa acurácia medida com poucos exemplos?
// Bootstrap: reamostre os resultados com reposição muitas vezes e veja como a acurácia varia.

/**
 * Intervalo de confiança por bootstrap (percentil) para a acurácia.
 * - Repita `reamostragens` vezes (padrão 2000): sorteie N resultados COM reposição
 *   (índice = Math.floor(aleatorio() * N)) e calcule a acurácia da amostra.
 * - Ordene as acurácias e pegue os percentis (1 − nivel)/2 e 1 − (1 − nivel)/2 (nivel padrão 0.95),
 *   usando o índice Math.floor(p × (reamostragens − 1)).
 * - `acuracia` é a do conjunto original.
 * Lista vazia → lance erro.
 */
export function intervaloBootstrap(
  acertos: boolean[],
  opcoes: { reamostragens?: number; nivel?: number; aleatorio?: () => number } = {},
): { acuracia: number; inferior: number; superior: number } {
  throw new Error("TODO (desafio): implemente intervaloBootstrap");
}
