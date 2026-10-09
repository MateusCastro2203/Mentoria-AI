// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
import { END, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import { ATENDIMENTOS, EstadoTriagem, RESPOSTAS, type Atendimento, type Classificador, type Estado, type GrafoTriagem } from "../src/estado.js";
import { rotaDeTriagem } from "./rotas.js";

const atender = (quem: Atendimento) => (estado: Estado) => ({
  resposta: RESPOSTAS[quem],
  atendidoPor: quem,
  historico: [{ chamado: estado.chamado, atendidoPor: quem }],
});

export function montarTriagem(
  classificar: Classificador,
  opcoes: { checkpointer?: BaseCheckpointSaver; limiar?: number } = {},
): GrafoTriagem {
  return new StateGraph(EstadoTriagem)
    .addNode("classificar", async (estado: Estado) => await classificar(estado.chamado))
    .addNode("financeiro", atender("financeiro"))
    .addNode("suporte", atender("suporte"))
    .addNode("faq", atender("faq"))
    .addNode("humano", atender("humano"))
    .addEdge(START, "classificar")
    .addConditionalEdges("classificar", (estado: Estado) => rotaDeTriagem(estado, opcoes.limiar), [...ATENDIMENTOS])
    .addEdge("financeiro", END)
    .addEdge("suporte", END)
    .addEdge("faq", END)
    .addEdge("humano", END)
    .compile({ checkpointer: opcoes.checkpointer }) as unknown as GrafoTriagem;
}
