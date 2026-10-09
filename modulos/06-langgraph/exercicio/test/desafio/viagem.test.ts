import { MemorySaver } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { corrigirCategoria } from "../../src/desafio/viagem.js";
import { montarTriagem } from "../../src/triagem.js";
import { classificadorFalso, thread } from "../apoio.js";

describe("desafio · corrigirCategoria (viagem no tempo)", () => {
  it("refaz o atendimento com a categoria corrigida, sem chamar o classificador de novo", async () => {
    const { classificar, chamados } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver() });
    await g.invoke({ chamado: "Meu boleto veio em dobro" }, thread("v"));
    const errado = await g.invoke({ chamado: "Não recebi o reembolso" }, thread("v"));
    expect(errado.atendidoPor).toBe("faq");

    const certo = await corrigirCategoria(g, thread("v"), "cobranca");
    expect(certo.atendidoPor).toBe("financeiro");
    expect(certo.categoria).toBe("cobranca");
    expect(chamados).toHaveLength(2);
    // O ramo novo parte de antes do atendimento errado: o "faq" some do histórico, o chamado anterior fica.
    expect(certo.historico).toEqual([
      { chamado: "Meu boleto veio em dobro", atendidoPor: "financeiro" },
      { chamado: "Não recebi o reembolso", atendidoPor: "financeiro" },
    ]);
    expect(((await g.getState(thread("v"))).values as any).atendidoPor).toBe("financeiro");
  });

  it("o passado não é apagado: o atendimento errado continua no histórico de checkpoints", async () => {
    const { classificar } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver() });
    await g.invoke({ chamado: "Não recebi o reembolso" }, thread("h"));
    await corrigirCategoria(g, thread("h"), "cobranca");
    const vistos = new Set<string>();
    for await (const c of g.getStateHistory(thread("h"))) if ((c.values as any).atendidoPor) vistos.add((c.values as any).atendidoPor);
    expect([...vistos].sort()).toEqual(["faq", "financeiro"]);
  });

  it("sem execução anterior, não há nada para corrigir", async () => {
    const { classificar } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver() });
    await expect(corrigirCategoria(g, thread("vazia"), "duvida")).rejects.toThrow(/nada para corrigir/);
  });
});
