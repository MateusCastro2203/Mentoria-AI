// Três jeitos de obter um sinal de confiança de um LLM comum (sem o Jev).

/** Uma alternativa devolvida pelo provedor para um token: o texto e o log da probabilidade. */
export interface Alternativa {
  token: string;
  logprob: number;
}

/**
 * 1) LOGPROBS — probabilidade de cada opção a partir das alternativas do token em que o modelo "decide".
 *
 * O provedor devolve as alternativas mais prováveis para aquele token, mas algumas não têm nada a ver
 * com as opções (ex.: "IA", "**"). Por isso:
 * - normalize o token: sem espaços nas pontas, sem aspas ("), minúsculo;
 * - a alternativa conta para uma opção se o token normalizado não for vazio e a opção (minúscula)
 *   COMEÇAR com ele (ex.: "fer" conta para "ferramentas");
 * - se o token servir de começo para MAIS de uma opção (ex.: "re" para "regulacao" e "relevante"),
 *   ele é ambíguo: ignore;
 * - some exp(logprob) por opção e renormalize para que as opções somem 1 (opções sem alternativa = 0);
 * - se nenhuma alternativa casar com nenhuma opção, devolva null.
 */
export function probabilidadesDasOpcoes(
  alternativas: Alternativa[],
  opcoes: string[],
): Record<string, number> | null {
  throw new Error("TODO: implemente probabilidadesDasOpcoes");
}

/**
 * Confiança ≠ probabilidade. Com 3 opções, 40% no favorito é bem mais "decidido" que 40% com 2 opções.
 * Esta é a fórmula que a TypeSafe documenta para a confiança de uma Choice:
 *
 *   confiança = (n × p_max − 1) / (n − 1), limitada a [0, 1]
 *
 * onde n é o número de opções e p_max a maior probabilidade. Distribuição uniforme → 0; certeza → 1.
 * Com uma opção só, devolva 1.
 */
export function confiancaDaEscolha(probabilidades: number[]): number {
  throw new Error("TODO: implemente confiancaDaEscolha");
}

export interface ResultadoVotacao {
  vencedora: string;
  /** Fração das respostas que concordam com a vencedora. */
  confianca: number;
  /** Fração de votos de cada resposta. */
  distribuicao: Record<string, number>;
}

/**
 * 2) AUTOCONSISTÊNCIA — rode o mesmo pedido várias vezes com temperatura > 0 e conte os votos.
 * Em empate, vence a que apareceu primeiro. Se a lista estiver vazia, lance um erro cuja mensagem contenha "vazia".
 */
export function votacao(respostas: string[]): ResultadoVotacao {
  throw new Error("TODO: implemente votacao");
}

// 3) AUTOAVALIAÇÃO (verbalizada) — pedir ao modelo um campo `confianca` no próprio JSON.
//    Não tem função aqui: é só um campo no schema. Você vai implementar no projeto final (etapa M2).
