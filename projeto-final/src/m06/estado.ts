// Fornecido: o estado do grafo do curador. Cada campo é um "canal": os nós devolvem atualizações parciais
// e o LangGraph junta. Campos com ReducedValue ACUMULAM (concatenam listas) em vez de substituir:
// é o que permite vários nós em paralelo escreverem no mesmo campo sem um apagar o outro.
import { ReducedValue, StateSchema, type StateSnapshot } from "@langchain/langgraph";
import { z } from "zod";

export const ItemAvaliadoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  url: z.string(),
  acao: z.enum(["publicar", "revisar", "descartar"]),
  categoria: z.string().nullable(),
  confianca: z.number().nullable(),
});
export const ItemEdicaoSchema = z.object({ id: z.string(), titulo: z.string(), categoria: z.string(), resumo: z.string(), url: z.string() });
export const PendenciaSchema = z.object({ id: z.string(), motivo: z.string() });

/** Um campo que acumula: cada atualização é concatenada ao que já existe. */
function lista<T extends z.ZodType>(item: T) {
  return new ReducedValue(z.array(item).default(() => []), {
    inputSchema: z.array(item),
    reducer: (atual: z.infer<T>[], novo: z.infer<T>[]) => atual.concat(novo),
  });
}

export const EstadoCurador = new StateSchema({
  candidatos: z.array(z.string()).default(() => []),
  avaliados: lista(ItemAvaliadoSchema),
  itens: lista(ItemEdicaoSchema),
  reprovadas: lista(PendenciaSchema),
  /** Fila de revisão humana (o Módulo 7 transforma isso numa pausa de verdade). */
  paraRevisao: lista(PendenciaSchema),
  /** Publicáveis que ficaram fora pela cota da edição. */
  foraDaEdicao: lista(z.string()),
  arquivo: z.string().nullable().default(null),
  /** Por onde o grafo passou (para depurar e para a aula). */
  trajetoria: lista(z.string()),
});

export type Estado = typeof EstadoCurador.State;
export type ItemAvaliado = z.infer<typeof ItemAvaliadoSchema>;

/** O que usamos do grafo compilado (fornecido, para tipar o retorno de montarGrafo). */
export interface GrafoCurador {
  invoke(entrada: unknown, config?: { configurable?: Record<string, unknown> } & Record<string, unknown>): Promise<Estado>;
  getState(config: { configurable: Record<string, unknown> }): Promise<StateSnapshot>;
  getStateHistory(config: { configurable: Record<string, unknown> }): AsyncIterable<StateSnapshot>;
  getGraphAsync(): Promise<{ drawMermaid(): string }>;
}
