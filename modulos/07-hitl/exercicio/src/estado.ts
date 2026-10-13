// Fornecido: o estado e os formatos do fluxo de reembolso.
// Um assistente analisa pedidos de reembolso. Conforme o valor e a confiança, ele paga sozinho, pede a
// aprovação de uma pessoa ou escala o caso. Pagar é uma AÇÃO no mundo: não dá para desfazer.
import { ReducedValue, StateSchema, type Command, type StateSnapshot } from "@langchain/langgraph";
import { z } from "zod";

export const PedidoSchema = z.object({ cliente: z.string(), valor: z.number().positive(), motivo: z.string() });
export type Pedido = z.infer<typeof PedidoSchema>;

export const AnaliseSchema = z.object({
  sugestao: z.enum(["reembolsar", "negar"]),
  /** valor sugerido para reembolsar (0 se a sugestão é negar) */
  valor: z.number().nonnegative(),
  confianca: z.number().min(0).max(1),
  justificativa: z.string(),
});
export type Analise = z.infer<typeof AnaliseSchema>;

/** O que a pessoa responde quando o grafo pausa. */
export const RespostaSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("aprovar") }),
  z.object({ acao: z.literal("editar"), valor: z.number().positive() }),
  z.object({ acao: z.literal("rejeitar"), motivo: z.string().min(1) }),
]);
export type Resposta = z.infer<typeof RespostaSchema>;

export type Nivel = "automatico" | "aprovacao" | "bloqueado";

export interface Politica {
  /** até este valor (R$), com confiança alta e sugestão de reembolsar, paga sozinho. Padrão 100. */
  limiteAutomatico: number;
  /** acima deste valor, ninguém aprova aqui: o caso é escalado. Padrão 2000. */
  limiteAprovacao: number;
  /** confiança mínima para pagar sozinho. Padrão 0.9. */
  confiancaMinima: number;
}
export const POLITICA_PADRAO: Politica = { limiteAutomatico: 100, limiteAprovacao: 2000, confiancaMinima: 0.9 };

/** O que o grafo mostra à pessoa (o valor passado para interrupt()). */
export interface PedidoDeAprovacao {
  pedido: Pedido;
  analise: Analise;
  /** preenchido quando a resposta anterior foi inválida */
  erro: string | null;
}

export const EstadoReembolso = new StateSchema({
  pedido: PedidoSchema,
  analise: AnaliseSchema.nullable().default(null),
  nivel: z.enum(["automatico", "aprovacao", "bloqueado"]).nullable().default(null),
  /** valor que a pessoa (ou a política) autorizou */
  valorAutorizado: z.number().nullable().default(null),
  /** erro da última resposta humana (faz o grafo perguntar de novo) */
  erro: z.string().nullable().default(null),
  /** a decisão humana, se houve */
  decisao: z.enum(["aprovar", "editar", "rejeitar"]).nullable().default(null),
  resultado: z.enum(["pago", "negado", "escalado"]).nullable().default(null),
  recibo: z.string().nullable().default(null),
  /** por onde o grafo passou */
  trajetoria: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (a: string[], b: string[]) => a.concat(b),
  }),
});
export type Estado = typeof EstadoReembolso.State;

/** Quem analisa o pedido: nos testes, uma função de mentira; na vida real, um LLM com saída tipada. */
export type Analisador = (pedido: Pedido) => Promise<Analise>;
/** Quem paga: devolve um recibo. É o efeito externo que não pode acontecer duas vezes. */
export type Pagador = (cliente: string, valor: number) => Promise<string>;

type Config = { configurable: { thread_id: string } };
export type Resultado = Estado & { __interrupt__?: { id: string; value: PedidoDeAprovacao }[] };

export interface GrafoReembolso {
  invoke(entrada: { pedido: Pedido } | null | Command, config: Config): Promise<Resultado>;
  getState(config: Config): Promise<StateSnapshot>;
  getGraphAsync(): Promise<{ drawMermaid(): string }>;
}
