// DESAFIO — calibrar o limiar de automação com dados.
// O histórico tem, para cada pedido antigo, a confiança do assistente e se a sugestão dele estava certa
// (segundo a pessoa que revisou). A pergunta: a partir de que confiança dá para pagar sozinho?

export interface Registro {
  confianca: number;
  correto: boolean;
}
export interface PontoDaCurva {
  limiar: number;
  /** fração do histórico com confiança ≥ limiar (o que seria automatizado) */
  cobertura: number;
  /** entre esses, a fração de corretos */
  precisao: number;
}

/**
 * A curva limiar × cobertura × precisão: um ponto para cada valor DISTINTO de confiança do histórico,
 * do maior limiar para o menor. Histórico vazio → [].
 */
export function curvaDeLimiar(historico: Registro[]): PontoDaCurva[] {
  throw new Error("TODO: implemente curvaDeLimiar");
}

/**
 * O MENOR limiar (maior cobertura) cuja precisão é ≥ `precisaoMinima`. Nenhum serve → null.
 * Atenção: a precisão não cai de forma regular conforme o limiar desce; confira todos os pontos.
 */
export function escolherLimiar(historico: Registro[], precisaoMinima: number): PontoDaCurva | null {
  throw new Error("TODO: implemente escolherLimiar");
}
