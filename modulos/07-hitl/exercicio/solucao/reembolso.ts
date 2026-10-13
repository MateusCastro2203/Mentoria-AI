// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
import { END, interrupt, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import { EstadoReembolso, RespostaSchema, type Analisador, type Estado, type GrafoReembolso, type Pagador, type PedidoDeAprovacao, type Politica } from "../src/estado.js";
import { nivelDeAutonomia } from "./autonomia.js";

export function montarReembolso(
  deps: { analisar: Analisador; pagar: Pagador },
  opcoes: { politica?: Partial<Politica>; checkpointer?: BaseCheckpointSaver } = {},
): GrafoReembolso {
  return new StateGraph(EstadoReembolso)
    .addNode("analisar", async (e: Estado) => {
      const analise = await deps.analisar(e.pedido);
      const nivel = nivelDeAutonomia(e.pedido, analise, opcoes.politica);
      return { analise, nivel, valorAutorizado: nivel === "automatico" ? analise.valor : null, trajetoria: ["analisar"] };
    })
    .addNode("pedir_aprovacao", (e: Estado) => {
      // Nada antes do interrupt além de montar a pergunta: ao retomar, o nó roda de novo desde aqui.
      const resposta = interrupt({ pedido: e.pedido, analise: e.analise!, erro: e.erro } satisfies PedidoDeAprovacao);
      const trajetoria = ["pedir_aprovacao"];
      const r = RespostaSchema.safeParse(resposta);
      if (!r.success) return { erro: `resposta inválida: ${r.error.issues[0]?.message ?? "formato"}`, trajetoria };
      if (r.data.acao === "editar" && r.data.valor > e.pedido.valor) return { erro: `valor acima do pedido (R$ ${e.pedido.valor})`, trajetoria };
      const valorAutorizado = r.data.acao === "editar" ? r.data.valor : r.data.acao === "aprovar" ? e.analise!.valor : null;
      return { erro: null, decisao: r.data.acao, valorAutorizado, trajetoria };
    })
    .addNode("pagar", async (e: Estado) => ({
      recibo: await deps.pagar(e.pedido.cliente, e.valorAutorizado!),
      resultado: "pago" as const,
      trajetoria: ["pagar"],
    }))
    .addNode("negar", () => ({ resultado: "negado" as const, trajetoria: ["negar"] }))
    .addNode("escalar", () => ({ resultado: "escalado" as const, trajetoria: ["escalar"] }))
    .addEdge(START, "analisar")
    .addConditionalEdges(
      "analisar",
      (e: Estado) => (e.nivel === "automatico" ? "pagar" : e.nivel === "bloqueado" ? "escalar" : "pedir_aprovacao"),
      ["pagar", "pedir_aprovacao", "escalar"],
    )
    .addConditionalEdges(
      "pedir_aprovacao",
      (e: Estado) => (e.erro ? "pedir_aprovacao" : e.decisao === "rejeitar" ? "negar" : "pagar"),
      ["pedir_aprovacao", "pagar", "negar"],
    )
    .addEdge("pagar", END)
    .addEdge("negar", END)
    .addEdge("escalar", END)
    .compile({ checkpointer: opcoes.checkpointer }) as unknown as GrafoReembolso;
}
