import { describe, expect, it } from "vitest";
import { executarHandoffs, type RespostaDoAgente } from "../../src/desafio/handoff.js";

const responde = (texto: string) => async (): Promise<RespostaDoAgente> => ({ resposta: texto });
const passa = (para: string) => async (m: string): Promise<RespostaDoAgente> => ({ transferirPara: para, mensagem: `${m} >` });

describe("desafio · executarHandoffs", () => {
  it("segue as transferências até alguém responder", async () => {
    const r = await executarHandoffs({
      agentes: { triagem: passa("financeiro"), financeiro: async (m) => ({ resposta: `resolvido: ${m}` }) },
      inicial: "triagem",
      mensagem: "boleto",
      maxTransferencias: 3,
    });
    expect(r).toEqual({ resposta: "resolvido: boleto >", caminho: ["triagem", "financeiro"], motivo: "respondeu" });
  });

  it("detecta ping-pong entre agentes", async () => {
    const r = await executarHandoffs({ agentes: { a: passa("b"), b: passa("a") }, inicial: "a", mensagem: "x", maxTransferencias: 10 });
    expect(r).toEqual({ resposta: null, caminho: ["a", "b"], motivo: "ciclo" });
  });

  it("para em agente desconhecido e no limite de transferências", async () => {
    expect((await executarHandoffs({ agentes: { a: passa("z") }, inicial: "a", mensagem: "x", maxTransferencias: 3 })).motivo).toBe("desconhecido");
    const cadeia = { a: passa("b"), b: passa("c"), c: passa("d"), d: responde("fim") };
    const r = await executarHandoffs({ agentes: cadeia, inicial: "a", mensagem: "x", maxTransferencias: 2 });
    expect(r).toEqual({ resposta: null, caminho: ["a", "b", "c"], motivo: "limite" });
  });
});
