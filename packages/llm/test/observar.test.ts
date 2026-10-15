import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { comAtributos, gerarTexto, observarChamadas, type EventoDeChamada } from "../src/index.js";

const modelo = (falhar = false) =>
  new MockLanguageModelV4({
    modelId: "mock-1",
    doGenerate: async () => {
      if (falhar) throw new Error("fora do ar");
      return {
        content: [{ type: "text", text: "oi" }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 3, text: 3, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });

describe("observarChamadas", () => {
  it("emite um evento por chamada, com tokens, modelo e os atributos do contexto", async () => {
    const eventos: EventoDeChamada[] = [];
    const parar = observarChamadas((e) => eventos.push(e));
    await comAtributos({ papel: "redigir" }, () =>
      Promise.all([
        comAtributos({ alvo: "n1" }, () => gerarTexto({ prompt: "a", modelo: modelo() })),
        comAtributos({ alvo: "n2" }, () => gerarTexto({ prompt: "b", modelo: modelo() })),
      ]),
    );
    parar();
    await gerarTexto({ prompt: "c", modelo: modelo() });
    expect(eventos).toHaveLength(2);
    expect(eventos.map((e) => e.atributos).sort((a, b) => String(a.alvo).localeCompare(String(b.alvo)))).toEqual([
      { papel: "redigir", alvo: "n1" },
      { papel: "redigir", alvo: "n2" },
    ]);
    expect(eventos[0]).toMatchObject({ operacao: "texto", modelo: "mock-1", tokensEntrada: 12, tokensSaida: 3 });
  });

  it("emite também quando a chamada falha, e o erro continua chegando a quem chamou", async () => {
    const eventos: EventoDeChamada[] = [];
    const parar = observarChamadas((e) => eventos.push(e));
    await expect(gerarTexto({ prompt: "a", modelo: modelo(true) })).rejects.toThrow("fora do ar");
    parar();
    expect(eventos).toHaveLength(1);
    expect(eventos[0]!.erro).toContain("fora do ar");
  });

  it("um ouvinte com defeito não derruba a chamada", async () => {
    const parar = observarChamadas(() => {
      throw new Error("bug no ouvinte");
    });
    await expect(gerarTexto({ prompt: "a", modelo: modelo() })).resolves.toMatchObject({ texto: "oi" });
    parar();
  });
});
