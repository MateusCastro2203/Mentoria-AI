// Fornecido: o estado do grafo da M7. É o estado da M6 com três campos a mais (as decisões humanas e o
// resultado da aprovação da edição) e os formatos do que o grafo PERGUNTA e do que a pessoa RESPONDE.
import { StateSchema, type Command, type StateSnapshot } from "@langchain/langgraph";
import { z } from "zod";
import { ItemAvaliadoSchema, ItemEdicaoSchema, PendenciaSchema, lista } from "../m06/estado.js";
import { CATEGORIAS } from "../noticia.js";

const tempoMs = z.number().nonnegative().optional();

/** O que a pessoa pode responder sobre UM item incerto. */
export const RespostaItemSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("aprovar"), tempoMs }),
  z.object({ acao: z.literal("editar"), categoria: z.enum(CATEGORIAS), titulo: z.string().min(1).optional(), tempoMs }),
  z.object({ acao: z.literal("rejeitar"), motivo: z.string().min(1), tempoMs }),
]);
export type RespostaItem = z.infer<typeof RespostaItemSchema>;

/** O que a pessoa pode responder sobre a EDIÇÃO inteira, antes de publicar. */
export const RespostaEdicaoSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("aprovar"), tempoMs }),
  z.object({
    acao: z.literal("editar"),
    /** ids dos itens a tirar da edição */
    remover: z.array(z.string()).default([]),
    /** resumos reescritos, por id */
    resumos: z.record(z.string(), z.string().min(1)).default({}),
    tempoMs,
  }),
  z.object({ acao: z.literal("rejeitar"), motivo: z.string().min(1), tempoMs }),
]);
export type RespostaEdicao = z.infer<typeof RespostaEdicaoSchema>;

/** Registro de cada decisão humana (para as métricas de revisão). `alvo` é o id do item ou "edicao". */
export const DecisaoSchema = z.object({
  alvo: z.string(),
  acao: z.enum(["aprovar", "editar", "rejeitar"]),
  motivo: z.string().optional(),
  tempoMs: z.number().optional(),
});
export type Decisao = z.infer<typeof DecisaoSchema>;

/** O que o grafo mostra à pessoa quando pausa (o valor passado para interrupt()). */
export type PedidoDeRevisao =
  | { tipo: "item"; id: string; titulo: string; url: string; categoria: string | null; confianca: number | null; motivo: string }
  | { tipo: "edicao"; itens: z.infer<typeof ItemEdicaoSchema>[] };

export const EstadoCuradorHitl = new StateSchema({
  candidatos: z.array(z.string()).default(() => []),
  avaliados: lista(ItemAvaliadoSchema),
  itens: lista(ItemEdicaoSchema),
  reprovadas: lista(PendenciaSchema),
  foraDaEdicao: lista(z.string()),
  trajetoria: lista(z.string()),
  /** Cada decisão humana, na ordem em que chegou. */
  decisoes: lista(DecisaoSchema),
  /** Os itens que vão ser publicados, depois da aprovação da edição (null = ainda não decidido). */
  edicaoFinal: z.array(ItemEdicaoSchema).nullable().default(null),
  /** Motivo, se a pessoa rejeitou a edição inteira. */
  edicaoRejeitada: z.string().nullable().default(null),
  arquivo: z.string().nullable().default(null),
});

export type EstadoHitl = typeof EstadoCuradorHitl.State;
export type ResultadoHitl = EstadoHitl & { __interrupt__?: { id: string; value: PedidoDeRevisao }[] };
type Config = { configurable: { thread_id: string } & Record<string, unknown> };

/** O que usamos do grafo compilado. `invoke` aceita a entrada inicial, `null` (retomar) ou um Command (responder). */
export interface GrafoCuradorHitl {
  invoke(entrada: Record<string, unknown> | null | Command, config: Config): Promise<ResultadoHitl>;
  getState(config: Config): Promise<StateSnapshot>;
  getGraphAsync(): Promise<{ drawMermaid(): string }>;
}

/** As pausas pendentes de uma thread (lendo o checkpoint). */
export async function pausasPendentes(grafo: GrafoCuradorHitl, config: Config): Promise<{ id: string; value: PedidoDeRevisao }[]> {
  const estado = await grafo.getState(config);
  return estado.tasks.flatMap((t) => (t.interrupts ?? []) as { id: string; value: PedidoDeRevisao }[]);
}
