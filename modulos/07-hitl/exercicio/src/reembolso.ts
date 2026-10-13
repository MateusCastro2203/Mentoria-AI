import type { BaseCheckpointSaver } from "@langchain/langgraph";
import type { Analisador, GrafoReembolso, Pagador, Politica } from "./estado.js";

/**
 * Monte o grafo com StateGraph(EstadoReembolso):
 *
 *   START → analisar ─┬─ automatico ─────────────────────────────► pagar ──► END
 *                     ├─ aprovacao ──► pedir_aprovacao ⏸ ─┬─ aprovar/editar ─► pagar
 *                     │                    ▲               ├─ rejeitar ───────► negar ──► END
 *                     │                    └─ inválida ────┘
 *                     └─ bloqueado ──► escalar ──► END
 *
 * - analisar: chama `analisar(pedido)`, grava `analise` e `nivel` (nivelDeAutonomia com a política);
 *   no nível "automatico", já grava `valorAutorizado` = analise.valor;
 * - pedir_aprovacao: `interrupt({ pedido, analise, erro })` e valide a resposta com RespostaSchema.
 *   Inválida, ou "editar" com valor acima do pedido → grave `erro` e volte a pedir_aprovacao.
 *   Válida → `erro` null, `decisao` = acao e `valorAutorizado` (aprovar: analise.valor; editar: o valor novo);
 * - pagar: chama `pagar(cliente, valorAutorizado)` UMA vez; grava resultado "pago" e o recibo;
 * - negar: resultado "negado"; escalar: resultado "escalado";
 * - cada nó acrescenta o próprio nome em `trajetoria`.
 * Nada de efeito externo (pagar!) antes de um interrupt: ao retomar, o nó roda de novo desde o começo.
 */
export function montarReembolso(
  deps: { analisar: Analisador; pagar: Pagador },
  opcoes: { politica?: Partial<Politica>; checkpointer?: BaseCheckpointSaver } = {},
): GrafoReembolso {
  throw new Error("TODO: implemente montarReembolso");
}
