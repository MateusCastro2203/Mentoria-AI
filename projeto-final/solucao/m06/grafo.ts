// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { END, START, StateGraph } from "@langchain/langgraph";
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { Papeis } from "../m05/time.js";
import { EstadoCurador, type GrafoCurador, type Estado, type ItemAvaliado } from "../../src/m06/estado.js";
import { enviarParaClassificacao, rotearPorConfianca, selecionar, type OpcoesDeSelecao } from "./rotas.js";

export interface OpcoesDoGrafo extends OpcoesDeSelecao {
  checkpointer?: BaseCheckpointSaver;
  maxTentativas?: number;
}

export function montarGrafo(
  papeis: Papeis,
  publicar: (itens: ItemEdicao[]) => Promise<{ arquivo: string }>,
  opcoes: OpcoesDoGrafo = {},
): GrafoCurador {
  const maxTentativas = opcoes.maxTentativas ?? 2;

  return new StateGraph(EstadoCurador)
    .addNode("coletar", async () => ({ candidatos: await papeis.coletar(), trajetoria: ["coletar"] }))
    .addNode("classificar", async ({ id }: { id: string }) => ({
      avaliados: [await papeis.classificar(id)],
      trajetoria: [`classificar ${id}`],
    }))
    .addNode("selecionar", (estado: Estado) => ({
      foraDaEdicao: selecionar(estado.avaliados, opcoes).fora,
      trajetoria: ["selecionar"],
    }))
    .addNode("redigir", async ({ item }: { item: ItemAvaliado }) => {
      let feedback: string | undefined;
      for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        const resumo = await papeis.redigir(item.id, feedback);
        const revisao = await papeis.revisar(item.id, resumo);
        if (revisao.aprovado) {
          const aprovado = { id: item.id, titulo: item.titulo, categoria: item.categoria ?? "outros", resumo, url: item.url };
          return { itens: [aprovado], trajetoria: [`redigir ${item.id}`] };
        }
        feedback = revisao.motivo;
      }
      return { reprovadas: [{ id: item.id, motivo: feedback ?? "" }], trajetoria: [`redigir ${item.id}`] };
    })
    .addNode("fila_humana", ({ item, motivo }: { item: ItemAvaliado; motivo: string }) => ({
      paraRevisao: [{ id: item.id, motivo }],
      trajetoria: [`fila_humana ${item.id}`],
    }))
    .addNode("publicar", async (estado: Estado) => ({
      arquivo: estado.itens.length ? (await publicar(estado.itens)).arquivo : null,
      trajetoria: ["publicar"],
    }))
    .addEdge(START, "coletar")
    .addConditionalEdges("coletar", enviarParaClassificacao, ["classificar", END])
    .addEdge("classificar", "selecionar")
    .addConditionalEdges("selecionar", (estado: Estado) => rotearPorConfianca(estado, opcoes), ["redigir", "fila_humana", "publicar"])
    .addEdge("redigir", "publicar")
    .addEdge("fila_humana", "publicar")
    .addEdge("publicar", END)
    .compile({ checkpointer: opcoes.checkpointer });
}

export type { ItemAvaliado };
