import { Command, MemorySaver } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { montarReembolso } from "../src/reembolso.js";
import { analise, falsos, thread } from "./apoio.js";

const ANALISES = {
  ana: analise("reembolsar", 40, 0.97), // automático
  bia: analise("reembolsar", 350, 0.92), // aprovação (valor)
  caio: analise("negar", 0, 0.8), // aprovação (negar)
  davi: analise("reembolsar", 5000, 0.99), // bloqueado
};
const pedido = (cliente: keyof typeof ANALISES, valor: number) => ({ pedido: { cliente, valor, motivo: "produto com defeito" } });

function montar() {
  const f = falsos(ANALISES);
  return { ...f, g: montarReembolso(f, { checkpointer: new MemorySaver() }) };
}

describe("montarReembolso", () => {
  it("automático: paga sem perguntar", async () => {
    const { g, pagamentos } = montar();
    const r = await g.invoke(pedido("ana", 40), thread("ana"));
    expect(r.__interrupt__).toBeUndefined();
    expect(r.resultado).toBe("pago");
    expect(r.recibo).toBe("REC-1");
    expect(pagamentos).toEqual([{ cliente: "ana", valor: 40 }]);
    expect(r.trajetoria).toEqual(["analisar", "pagar"]);
  });

  it("bloqueado: escala sem perguntar e sem pagar", async () => {
    const { g, pagamentos } = montar();
    const r = await g.invoke(pedido("davi", 5000), thread("davi"));
    expect(r.resultado).toBe("escalado");
    expect(r.__interrupt__).toBeUndefined();
    expect(pagamentos).toHaveLength(0);
  });

  it("aprovação: pausa com o pedido e a análise, e NÃO paga antes da resposta", async () => {
    const { g, pagamentos } = montar();
    const r = await g.invoke(pedido("bia", 350), thread("bia"));
    expect(r.__interrupt__).toHaveLength(1);
    expect(r.__interrupt__![0]!.value).toEqual({ pedido: { cliente: "bia", valor: 350, motivo: "produto com defeito" }, analise: ANALISES.bia, erro: null });
    expect(r.resultado).toBeNull();
    expect(pagamentos).toHaveLength(0);
    expect((await g.getState(thread("bia"))).next).toEqual(["pedir_aprovacao"]);
  });

  it("aprovar paga o valor sugerido, uma vez", async () => {
    const { g, pagamentos } = montar();
    await g.invoke(pedido("bia", 350), thread("bia"));
    const r = await g.invoke(new Command({ resume: { acao: "aprovar" } }), thread("bia"));
    expect(r.resultado).toBe("pago");
    expect(r.decisao).toBe("aprovar");
    expect(pagamentos).toEqual([{ cliente: "bia", valor: 350 }]);
  });

  it("editar paga o valor novo", async () => {
    const { g, pagamentos } = montar();
    await g.invoke(pedido("bia", 350), thread("bia"));
    const r = await g.invoke(new Command({ resume: { acao: "editar", valor: 200 } }), thread("bia"));
    expect(r.resultado).toBe("pago");
    expect(pagamentos).toEqual([{ cliente: "bia", valor: 200 }]);
  });

  it("rejeitar nega, sem pagar", async () => {
    const { g, pagamentos } = montar();
    await g.invoke(pedido("caio", 90), thread("caio"));
    const r = await g.invoke(new Command({ resume: { acao: "rejeitar", motivo: "fora do prazo" } }), thread("caio"));
    expect(r.resultado).toBe("negado");
    expect(r.trajetoria).toEqual(["analisar", "pedir_aprovacao", "negar"]);
    expect(pagamentos).toHaveLength(0);
  });

  it("resposta inválida pergunta de novo, com o erro; depois segue normalmente", async () => {
    const { g, pagamentos } = montar();
    await g.invoke(pedido("bia", 350), thread("bia"));
    const r1 = await g.invoke(new Command({ resume: { acao: "editar", valor: 9999 } }), thread("bia"));
    expect(r1.__interrupt__![0]!.value.erro).toMatch(/acima do pedido/);
    const r2 = await g.invoke(new Command({ resume: "sim" }), thread("bia"));
    expect(r2.__interrupt__![0]!.value.erro).toMatch(/inválida/);
    expect(pagamentos).toHaveLength(0);
    const r3 = await g.invoke(new Command({ resume: { acao: "aprovar" } }), thread("bia"));
    expect(r3.resultado).toBe("pago");
    expect(r3.erro).toBeNull();
    expect(pagamentos).toHaveLength(1);
  });
});
