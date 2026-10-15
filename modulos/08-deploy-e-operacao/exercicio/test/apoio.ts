import type { Armazenamento, Chamado, Dependencias, Uso } from "../src/estado.js";

export const chamado = (id: string, aberto: string, texto = "x".repeat(400)): Chamado => ({ id, aberto, prioridade: "media", titulo: `T-${id}`, texto });

/** Dependências falsas: um KV em memória, um relógio parado e um modelo com roteiro de respostas. */
export function falsas(roteiro: (Error | { texto: string; uso: Uso })[]) {
  const dados = new Map<string, string>();
  const armazenamento: Armazenamento = {
    get: async (k) => dados.get(k) ?? null,
    put: async (k, v) => void dados.set(k, v),
  };
  const esperas: number[] = [];
  const pedidos: Chamado[][] = [];
  const deps: Dependencias = {
    armazenamento,
    agora: () => new Date("2026-10-13T09:00:00Z"),
    esperar: async (ms) => void esperas.push(ms),
    async resumir(chamados) {
      pedidos.push(chamados);
      const proxima = roteiro.shift();
      if (!proxima) throw new Error("roteiro acabou");
      if (proxima instanceof Error) throw proxima;
      return proxima;
    },
  };
  return { deps, dados, esperas, pedidos };
}
