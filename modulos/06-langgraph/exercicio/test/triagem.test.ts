import { MemorySaver } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { montarTriagem } from "../src/triagem.js";
import { classificadorFalso, thread } from "./apoio.js";

describe("montarTriagem", () => {
  it("classifica e manda cada chamado para o nó certo", async () => {
    const { classificar } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver() });
    const casos: [string, string][] = [
      ["Meu boleto veio em dobro", "financeiro"],
      ["O app trava no login", "suporte"],
      ["Como mudo meu e-mail?", "faq"],
      ["Acho que fui cobrado errado, talvez", "humano"],
    ];
    for (const [i, [chamado, esperado]] of casos.entries()) {
      const r = await g.invoke({ chamado }, thread(`t${i}`));
      expect(r.atendidoPor).toBe(esperado);
      expect(r.resposta).toMatch(/\S/);
    }
  });

  it("respeita o limiar passado nas opções", async () => {
    const { classificar } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver(), limiar: 0.95 });
    expect((await g.invoke({ chamado: "Meu boleto veio em dobro" }, thread("x"))).atendidoPor).toBe("humano");
  });

  it("memória: a mesma thread lembra os chamados anteriores; outra thread começa do zero", async () => {
    const { classificar } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver() });
    await g.invoke({ chamado: "Meu boleto veio em dobro" }, thread("ana"));
    const r = await g.invoke({ chamado: "O app trava no login" }, thread("ana"));
    expect(r.historico).toEqual([
      { chamado: "Meu boleto veio em dobro", atendidoPor: "financeiro" },
      { chamado: "O app trava no login", atendidoPor: "suporte" },
    ]);
    expect(r.categoria).toBe("tecnico");

    const outra = await g.invoke({ chamado: "Como mudo meu e-mail?" }, thread("bia"));
    expect(outra.historico).toHaveLength(1);
  });

  it("o estado salvo pode ser consultado depois, e o histórico de checkpoints cresce", async () => {
    const { classificar } = classificadorFalso();
    const g = montarTriagem(classificar, { checkpointer: new MemorySaver() });
    await g.invoke({ chamado: "Meu boleto veio em dobro" }, thread("c"));
    const agora = await g.getState(thread("c"));
    expect(agora.next).toEqual([]);
    expect((agora.values as any).atendidoPor).toBe("financeiro");
    let n = 0;
    for await (const _ of g.getStateHistory(thread("c"))) n++;
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it("o desenho mostra os nós e as arestas condicionais", async () => {
    const { classificar } = classificadorFalso();
    const mermaid = (await montarTriagem(classificar).getGraphAsync()).drawMermaid();
    for (const no of ["financeiro", "suporte", "faq", "humano"]) expect(mermaid).toContain(`classificar -.-> ${no}`);
  });
});
