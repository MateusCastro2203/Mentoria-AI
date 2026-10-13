// ETAPA M7 — o que fazer com a resposta da pessoa. Funções puras: fáceis de testar, sem LLM nem grafo.
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { ItemAvaliado } from "../m06/estado.js";
import type { Decisao } from "./estado.js";

/**
 * Aplica a resposta da pessoa a um item incerto. Valide `resposta` com RespostaItemSchema (formato
 * inválido → lance o erro do Zod). Devolva o item que segue para a redação (ou null) e o registro:
 * - "aprovar" → o item como está;
 * - "editar" → o item com a nova categoria (e o novo título, se veio);
 * - "rejeitar" → null; o registro leva o motivo.
 * O registro tem `alvo` = id do item, a `acao` e, se vierem, `motivo` e `tempoMs`.
 */
export function aplicarDecisaoItem(item: ItemAvaliado, resposta: unknown): { item: ItemAvaliado | null; decisao: Decisao } {
  throw new Error("TODO (M7): implemente aplicarDecisaoItem");
}

/**
 * Aplica a resposta da pessoa à edição inteira. Valide com RespostaEdicaoSchema.
 * - "aprovar" → os itens como estão;
 * - "editar" → sem os ids de `remover` e com os `resumos` trocados; id desconhecido em `remover` ou em
 *   `resumos` → lance um erro com "item desconhecido: <id>";
 * - "rejeitar" → itens null.
 * O registro tem `alvo` = "edicao".
 */
export function aplicarDecisaoEdicao(itens: ItemEdicao[], resposta: unknown): { itens: ItemEdicao[] | null; decisao: Decisao } {
  throw new Error("TODO (M7): implemente aplicarDecisaoEdicao");
}

export interface MetricasDeRevisao {
  /** quantas vezes uma pessoa foi chamada */
  pausas: number;
  /** decisões sobre itens ÷ itens avaliados (quanto do trabalho precisou de gente). 0 se não houve avaliados. */
  taxaDeIntervencao: number;
  /** (editar + rejeitar) ÷ decisões (quanto a pessoa discordou da máquina). 0 se não houve decisões. */
  taxaDeOverride: number;
  /** média de tempoMs das decisões que têm tempo; null se nenhuma tem. */
  tempoMedioMs: number | null;
}

/** As métricas de uma rodada de revisão. Decisões com alvo "edicao" contam em pausas e override, não em intervenção. */
export function metricasDeRevisao(totalAvaliados: number, decisoes: Decisao[]): MetricasDeRevisao {
  throw new Error("TODO (M7): implemente metricasDeRevisao");
}
