// Fornecido (M8): os formatos do rastreio (src/m08/rastreio.ts).

/** Preço do provedor, em qualquer moeda, por MILHÃO de tokens. Modelo local: zero (o custo é tempo e máquina). */
export interface Precos {
  entradaPorMilhao: number;
  saidaPorMilhao: number;
}
export const SEM_CUSTO: Precos = { entradaPorMilhao: 0, saidaPorMilhao: 0 };

export interface Agregado {
  chamadas: number;
  erros: number;
  tokensEntrada: number;
  tokensSaida: number;
  custo: number;
  latenciaTotalMs: number;
  p50Ms: number;
  p95Ms: number;
}

export interface ResumoDoRastro {
  total: Agregado;
  /** Uma entrada por papel (atributos.papel); eventos sem papel caem em "sem-papel". */
  porPapel: Record<string, Agregado>;
}

