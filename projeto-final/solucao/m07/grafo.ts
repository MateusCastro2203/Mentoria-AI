// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import { END, interrupt, Send, START, StateGraph } from "@langchain/langgraph";
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { Papeis } from "../m05/time.js";
import type { ItemAvaliado } from "../../src/m06/estado.js";
import { EstadoCuradorHitl, type EstadoHitl, type GrafoCuradorHitl, type PedidoDeRevisao } from "../../src/m07/estado.js";
import { redigirComRevisao } from "../../src/m07/redacao.js";
import type { OpcoesDoGrafoHitl } from "../../src/m07/grafo.js";
import { enviarParaClassificacao, rotearPorConfianca, selecionar } from "../m06/rotas.js";
import { aplicarDecisaoEdicao, aplicarDecisaoItem } from "./decisoes.js";

export type { OpcoesDoGrafoHitl };

export function montarGrafoHitl(
  papeis: Papeis,
  publicar: (itens: ItemEdicao[]) => Promise<{ arquivo: string }>,
  opcoes: OpcoesDoGrafoHitl = {},
): GrafoCuradorHitl {
  const maxTentativas = opcoes.maxTentativas ?? 2;
  const revisarEdicao = opcoes.revisarEdicao ?? true;

  const redacao = async (item: ItemAvaliado) => {
    const r = await redigirComRevisao(papeis, item, maxTentativas);
    return "aprovado" in r ? { itens: [r.aprovado] } : { reprovadas: [r.reprovado] };
  };

  // A rota da M6, com os destinos humanos da M7.
  const rotear = (estado: EstadoHitl) => {
    const r = rotearPorConfianca(estado as never, opcoes);
    if (!Array.isArray(r)) return "aprovar_edicao";
    return r.map((s) => (s.node === "fila_humana" ? new Send("revisao_humana", s.args) : s));
  };

  return new StateGraph(EstadoCuradorHitl)
    .addNode("coletar", async () => ({ candidatos: await papeis.coletar(), trajetoria: ["coletar"] }))
    .addNode("classificar", async ({ id }: { id: string }) => ({
      avaliados: [await papeis.classificar(id)],
      trajetoria: [`classificar ${id}`],
    }))
    .addNode("selecionar", (estado: EstadoHitl) => ({
      foraDaEdicao: selecionar(estado.avaliados, opcoes).fora,
      trajetoria: ["selecionar"],
    }))
    .addNode("redigir", async ({ item }: { item: ItemAvaliado }) => ({ ...(await redacao(item)), trajetoria: [`redigir ${item.id}`] }))
    .addNode("revisao_humana", async ({ item, motivo }: { item: ItemAvaliado; motivo: string }) => {
      // 1º a pausa; o trabalho caro (LLM) só DEPOIS: ao retomar, este nó roda de novo desde o começo.
      const pedido: PedidoDeRevisao = { tipo: "item", id: item.id, titulo: item.titulo, url: item.url, categoria: item.categoria, confianca: item.confianca, motivo };
      const resposta = interrupt(pedido);
      const { item: seguir, decisao } = aplicarDecisaoItem(item, resposta);
      const trajetoria = [`revisao_humana ${item.id}`];
      if (!seguir) return { decisoes: [decisao], trajetoria };
      return { ...(await redacao(seguir)), decisoes: [decisao], trajetoria };
    })
    .addNode("aprovar_edicao", (estado: EstadoHitl) => {
      const trajetoria = ["aprovar_edicao"];
      if (!estado.itens.length) return { edicaoFinal: [], trajetoria };
      if (!revisarEdicao) return { edicaoFinal: estado.itens, trajetoria };
      const resposta = interrupt({ tipo: "edicao", itens: estado.itens } satisfies PedidoDeRevisao);
      const { itens, decisao } = aplicarDecisaoEdicao(estado.itens, resposta);
      return itens
        ? { edicaoFinal: itens, decisoes: [decisao], trajetoria }
        : { edicaoFinal: [], edicaoRejeitada: decisao.motivo ?? "", decisoes: [decisao], trajetoria };
    })
    .addNode("publicar", async (estado: EstadoHitl) => ({
      arquivo: estado.edicaoFinal?.length ? (await publicar(estado.edicaoFinal)).arquivo : null,
      trajetoria: ["publicar"],
    }))
    .addEdge(START, "coletar")
    .addConditionalEdges("coletar", (e: EstadoHitl) => enviarParaClassificacao(e as never), ["classificar", END])
    .addEdge("classificar", "selecionar")
    .addConditionalEdges("selecionar", rotear, ["redigir", "revisao_humana", "aprovar_edicao"])
    .addEdge("redigir", "aprovar_edicao")
    .addEdge("revisao_humana", "aprovar_edicao")
    .addEdge("aprovar_edicao", "publicar")
    .addEdge("publicar", END)
    .compile({ checkpointer: opcoes.checkpointer }) as unknown as GrafoCuradorHitl;
}
