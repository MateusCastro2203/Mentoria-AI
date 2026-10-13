// Analisador e pagador de mentira.
import type { Analise, Analisador, Pagador } from "../src/estado.js";

export function falsos(analises: Record<string, Analise>) {
  const pagamentos: { cliente: string; valor: number }[] = [];
  const analisar: Analisador = async (p) => analises[p.cliente]!;
  const pagar: Pagador = async (cliente, valor) => {
    pagamentos.push({ cliente, valor });
    return `REC-${pagamentos.length}`;
  };
  return { analisar, pagar, pagamentos };
}

export const thread = (id: string) => ({ configurable: { thread_id: id } });
export const analise = (sugestao: Analise["sugestao"], valor: number, confianca: number): Analise => ({ sugestao, valor, confianca, justificativa: "..." });
