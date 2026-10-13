// ETAPA M7 — o grafo da M6 com humanos no circuito.
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { Papeis } from "../m05/time.js";
import type { OpcoesDeSelecao } from "../m06/rotas.js";
import type { GrafoCuradorHitl } from "./estado.js";

export interface OpcoesDoGrafoHitl extends OpcoesDeSelecao {
  checkpointer?: BaseCheckpointSaver;
  maxTentativas?: number;
  /** Pedir aprovação da edição inteira antes de publicar? Padrão true. */
  revisarEdicao?: boolean;
}

/**
 * Monte o grafo da M6 (StateGraph(EstadoCuradorHitl)) com duas pausas humanas:
 *
 *   START → coletar ─(Send)─► classificar ─► selecionar ─┬─(Send)─► redigir ─────────┐
 *                                                        ├─(Send)─► revisao_humana ⏸ ─┼─► aprovar_edicao ⏸ ─► publicar → END
 *                                                        └─ nada a fazer ─────────────┘
 *
 * - coletar, classificar, selecionar: como na M6 (reaproveite as funções de ../m06/rotas.js);
 * - depois de selecionar: os Send para "fila_humana" viram Send para "revisao_humana", e "publicar"
 *   vira "aprovar_edicao";
 * - redigir: use redigirComRevisao (./redacao.js); aprovado → `itens`, reprovado → `reprovadas`;
 * - revisao_humana({ item, motivo }): PRIMEIRO `interrupt(pedido)` com { tipo: "item", id, titulo, url,
 *   categoria, confianca, motivo }; DEPOIS aplicarDecisaoItem; se o item seguir, redigirComRevisao.
 *   Registre a decisão em `decisoes`. (Por que nessa ordem? Ao retomar, o nó roda de novo desde o começo.)
 * - aprovar_edicao: sem itens → edicaoFinal []; com `revisarEdicao: false` → edicaoFinal = itens;
 *   senão `interrupt({ tipo: "edicao", itens })` e aplicarDecisaoEdicao (rejeitada → edicaoRejeitada = motivo);
 * - publicar: só chama `publicar` se edicaoFinal tiver itens; grava `arquivo`.
 * - Cada nó acrescenta o próprio nome em `trajetoria` (como na M6).
 */
export function montarGrafoHitl(
  papeis: Papeis,
  publicar: (itens: ItemEdicao[]) => Promise<{ arquivo: string }>,
  opcoes: OpcoesDoGrafoHitl = {},
): GrafoCuradorHitl {
  throw new Error("TODO (M7): implemente montarGrafoHitl");
}
