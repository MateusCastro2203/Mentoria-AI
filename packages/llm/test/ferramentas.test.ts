import { tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { gerarComFerramentas } from "../src/index.js";

const uso = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const chamar = (toolName: string, input: object) => ({
  content: [{ type: "tool-call" as const, toolCallId: `c-${toolName}`, toolName, input: JSON.stringify(input) }],
  finishReason: { unified: "tool-calls" as const, raw: undefined },
  usage: uso,
  warnings: [],
});
const responder = (text: string) => ({
  content: [{ type: "text" as const, text }],
  finishReason: { unified: "stop" as const, raw: undefined },
  usage: uso,
  warnings: [],
});

/** Modelo simulado que devolve as respostas da lista, uma por passo. */
function roteiro(...respostas: any[]) {
  let i = 0;
  return new MockLanguageModelV4({ doGenerate: async () => respostas[Math.min(i++, respostas.length - 1)] });
}

const ferramentas = {
  somar: tool({
    description: "Soma dois números",
    inputSchema: z.object({ a: z.number(), b: z.number() }),
    execute: async ({ a, b }) => a + b,
  }),
  entregar: tool({ description: "Entrega", inputSchema: z.object({ valor: z.number() }), execute: async () => "ok" }),
};

describe("gerarComFerramentas", () => {
  it("executa as ferramentas pedidas e devolve o texto final", async () => {
    const r = await gerarComFerramentas({
      prompt: "quanto é 1 + 2?",
      ferramentas,
      maxPassos: 5,
      modelo: roteiro(chamar("somar", { a: 1, b: 2 }), responder("3")),
    });
    expect(r.texto).toBe("3");
    expect(r.passos).toBe(2);
    expect(r.chamadas).toEqual([{ passo: 1, ferramenta: "somar", entrada: { a: 1, b: 2 }, saida: 3 }]);
    expect(r.uso.tokensEntrada).toBe(20);
  });

  it("para ao chamar a ferramenta indicada", async () => {
    const r = await gerarComFerramentas({
      prompt: "x",
      ferramentas,
      maxPassos: 5,
      pararAoChamar: "entregar",
      modelo: roteiro(chamar("entregar", { valor: 1 }), responder("não deveria chegar aqui")),
    });
    expect(r.passos).toBe(1);
    expect(r.chamadas.map((c) => c.ferramenta)).toEqual(["entregar"]);
  });

  it("respeita o limite de passos", async () => {
    const r = await gerarComFerramentas({
      prompt: "x",
      ferramentas,
      maxPassos: 3,
      modelo: roteiro(chamar("somar", { a: 1, b: 1 })),
    });
    expect(r.passos).toBe(3);
    expect(r.chamadas).toHaveLength(3);
  });
});
