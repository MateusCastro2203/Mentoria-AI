// DESAFIO EXTRA — canário: a versão nova do prompt (ou do modelo) recebe só uma parte das execuções;
// com dados, ela é promovida ou revertida automaticamente.
import { balde } from "../estado.js";

export interface Canario {
  estavel: string;
  candidata: string;
  /** De 0 a 100: quanto das execuções vai para a candidata. */
  percentual: number;
}

/**
 * Qual versão atende esta execução. A escolha precisa ser DETERMINÍSTICA pela chave (o mesmo dia,
 * o mesmo cliente, sempre a mesma versão): use balde(chave) (0 a 99) e mande para a candidata quando
 * balde(chave) < percentual. Percentual 0 → sempre a estável; 100 → sempre a candidata.
 */
export function escolherVersao(chave: string, canario: Canario): string {
  throw new Error("TODO (desafio): implemente escolherVersao");
}

export interface Execucao {
  versao: string;
  status: "ok" | "falhou";
}

export interface RegraDoCanario {
  /** Mínimo de execuções da candidata antes de decidir. */
  minimoDeExecucoes: number;
  /** Quanto a taxa de falha da candidata pode passar da estável (ex.: 0.05 = 5 pontos percentuais). */
  tolerancia: number;
}

/**
 * Decide o destino da candidata olhando as execuções das duas versões:
 * - candidata com menos de minimoDeExecucoes → "aguardar";
 * - taxa de falha da candidata > taxa de falha da estável + tolerancia → "reverter";
 * - senão → "promover".
 * Taxa de falha = falhas ÷ execuções daquela versão (estável sem execuções conta como 0).
 * Execuções de outras versões são ignoradas.
 */
export function decidirCanario(execucoes: Execucao[], canario: Canario, regra: RegraDoCanario): "aguardar" | "reverter" | "promover" {
  throw new Error("TODO (desafio): implemente decidirCanario");
}
