// ETAPA M6 — o time do curador como um GRAFO de estado (LangGraph.js), com checkpoint.
//
//   START → coletar ─(Send por candidato)→ classificar ──→ selecionar ─(por confiança)→ redigir ─────→ publicar → END
//                                                                                    └→ fila_humana ─┘
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { END, START, StateGraph } from "@langchain/langgraph";
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { Papeis } from "../m05/time.js";
import { EstadoCurador, type GrafoCurador, type ItemAvaliado } from "./estado.js";
import { enviarParaClassificacao, rotearPorConfianca, selecionar, type OpcoesDeSelecao } from "./rotas.js";

export interface OpcoesDoGrafo extends OpcoesDeSelecao {
  checkpointer?: BaseCheckpointSaver;
  /** Redações por item no ciclo redator ⇄ revisor. Padrão 2. */
  maxTentativas?: number;
}

/**
 * Monte e compile o grafo (use EstadoCurador). Todo nó acrescenta seu nome em `trajetoria`
 * (classificar/redigir/fila_humana com o id: "classificar n01").
 *
 * Nós:
 * - "coletar": candidatos = papeis.coletar()
 * - "classificar" (recebe { id }): avaliados = [papeis.classificar(id)]
 * - "selecionar": não chama modelo; foraDaEdicao = selecionar(estado.avaliados, opcoes).fora
 *   (é o ponto de JUNÇÃO: espera todas as classificações paralelas terminarem)
 * - "redigir" (recebe { item }): ciclo redigir → revisar até maxTentativas, com o motivo da reprovação como
 *   feedback (como na M5). Aprovado → itens = [{ id, titulo, categoria, resumo, url }];
 *   senão → reprovadas = [{ id, motivo do último revisar }]
 * - "fila_humana" (recebe { item, motivo }): paraRevisao = [{ id, motivo }]
 * - "publicar": se houver itens, arquivo = (await publicar(itens)).arquivo; senão não chama publicar
 *
 * Arestas: START→coletar; coletar ⇢ enviarParaClassificacao; classificar→selecionar;
 * selecionar ⇢ rotearPorConfianca; redigir→publicar; fila_humana→publicar; publicar→END.
 * (⇢ = addConditionalEdges)
 *
 * Atenção: nome de nó não pode repetir nome de campo do estado (ex.: não crie um nó "itens").
 */
export function montarGrafo(
  papeis: Papeis,
  publicar: (itens: ItemEdicao[]) => Promise<{ arquivo: string }>,
  opcoes: OpcoesDoGrafo = {},
): GrafoCurador {
  throw new Error("TODO (M6): implemente montarGrafo");
}

export type { ItemAvaliado };
