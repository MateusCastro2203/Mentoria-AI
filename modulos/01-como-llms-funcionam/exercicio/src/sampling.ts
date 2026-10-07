/**
 * Transforma logits (pontuações brutas que o modelo dá a cada token candidato) em probabilidades.
 *
 * - Divida cada logit pela `temperature` antes de aplicar a softmax.
 * - `temperature <= 0` significa decodificação gulosa (greedy): probabilidade 1 para o maior logit
 *   (em empate, o de menor índice) e 0 para o resto.
 * - Cuidado com overflow: Math.exp(1000) é Infinity. Subtraia o maior valor antes de exponenciar.
 */
export function softmax(logits: number[], temperature = 1): number[] {
  throw new Error("TODO: implemente softmax");
}

/**
 * Nucleus sampling (top-p): mantém o MENOR conjunto de tokens mais prováveis cuja soma de
 * probabilidades seja >= topP, zera o resto e renormaliza para somar 1.
 * As posições do array não mudam (o índice continua sendo o id do token).
 * `topP >= 1` devolve as probabilidades sem alteração.
 */
export function filtrarTopP(probabilidades: number[], topP: number): number[] {
  throw new Error("TODO: implemente filtrarTopP");
}

export interface OpcoesAmostragem {
  temperature?: number; // padrão 1
  topP?: number; // padrão 1
}

/**
 * Escolhe o índice do próximo token: softmax com temperatura → filtro top-p → sorteio.
 * Sorteio: tire r = aleatorio() em [0, 1) e devolva o primeiro índice i (na ordem do array)
 * em que a probabilidade acumulada até i (inclusive) passa de r.
 */
export function amostrar(
  logits: number[],
  opcoes: OpcoesAmostragem = {},
  aleatorio: () => number = Math.random,
): number {
  throw new Error("TODO: implemente amostrar");
}
