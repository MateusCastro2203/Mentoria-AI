// ETAPA M6 — as decisões de caminho do grafo. Funções puras: recebem o estado, devolvem para onde ir.
import { END, Send } from "@langchain/langgraph";
import type { Estado, ItemAvaliado } from "./estado.js";

export interface OpcoesDeSelecao {
  /** Abaixo disso, mesmo "publicar" vai para revisão humana. Padrão 0.9. */
  limiar?: number;
  /** Tamanho máximo da edição. Padrão 10. */
  maxItens?: number;
  /** Máximo de itens por categoria (evita a edição só de uma ou duas categorias, como na M5). Padrão 3. */
  maxPorCategoria?: number;
}

/** Depois de coletar: um Send("classificar", { id }) por candidato; sem candidatos → END. */
export function enviarParaClassificacao(estado: Estado): Send[] | typeof END {
  throw new Error("TODO (M6): implemente enviarParaClassificacao");
}

/**
 * Decide o destino de cada avaliado:
 * - acao "descartar" → some;
 * - acao "revisar" → revisar, motivo "guardrails";
 * - acao "publicar" com confiança abaixo do limiar (ou nula) → revisar, motivo "confianca-baixa";
 * - os demais, por confiança (maior primeiro; empate: ordem em `avaliados`), entram em `publicar`
 *   respeitando maxPorCategoria e maxItens; quem não couber vai para `fora` (ids).
 */
export function selecionar(
  avaliados: ItemAvaliado[],
  opcoes: OpcoesDeSelecao = {},
): { publicar: ItemAvaliado[]; revisar: { item: ItemAvaliado; motivo: string }[]; fora: string[] } {
  throw new Error("TODO (M6): implemente selecionar");
}

/**
 * Aresta condicional depois do nó "selecionar" (o roteamento POR CONFIANÇA):
 * - um Send("redigir", { item }) para cada um de `publicar`;
 * - um Send("fila_humana", { item, motivo }) para cada um de `revisar`;
 * - se não houver nenhum dos dois → "publicar" (o nó publicar decide o que fazer com a edição vazia).
 */
export function rotearPorConfianca(estado: Estado, opcoes: OpcoesDeSelecao = {}): Send[] | "publicar" {
  throw new Error("TODO (M6): implemente rotearPorConfianca");
}
