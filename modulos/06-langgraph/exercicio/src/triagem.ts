import type { BaseCheckpointSaver } from "@langchain/langgraph";
import type { Classificador, GrafoTriagem } from "./estado.js";

/**
 * Monte o grafo de triagem com StateGraph(EstadoTriagem):
 *
 *   START → classificar ─┬─► financeiro ─┐
 *                        ├─► suporte ────┤
 *                        ├─► faq ────────┼─► END
 *                        └─► humano ─────┘
 *
 * - "classificar": chama `classificar(estado.chamado)` e grava categoria e confianca;
 * - aresta condicional depois de "classificar": `rotaDeTriagem(estado, opcoes.limiar)`;
 * - cada nó de atendimento grava `resposta` (use RESPOSTAS), `atendidoPor` e acrescenta
 *   `{ chamado, atendidoPor }` ao `historico`;
 * - compile com `opcoes.checkpointer` (sem ele não há memória entre chamadas).
 */
export function montarTriagem(
  classificar: Classificador,
  opcoes: { checkpointer?: BaseCheckpointSaver; limiar?: number } = {},
): GrafoTriagem {
  throw new Error("TODO: implemente montarTriagem");
}
