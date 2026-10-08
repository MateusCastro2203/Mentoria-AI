import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { classificarTipado, montarPromptTipado, SchemaClassificacao } from "../src/m02/classificar-tipado.js";
import { CATEGORIAS, carregarNoticias } from "../src/noticia.js";

const noticia = carregarNoticias()[0]!;

function mockQueResponde(texto: string) {
  const chamadas: any[] = [];
  const modelo = new MockLanguageModelV4({
    doGenerate: async (opcoes) => {
      chamadas.push(opcoes);
      return {
        content: [{ type: "text", text: texto }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 80, noCache: 80, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 20, text: 20, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
  return { modelo, chamadas };
}

const textoEnviado = (chamada: any) =>
  chamada.prompt
    .flatMap((m: any) => (typeof m.content === "string" ? [m.content] : m.content.map((p: any) => p.text ?? "")))
    .join("\n");

describe("M2 · SchemaClassificacao", () => {
  it("aceita uma decisão válida", () => {
    for (const decisao of [
      { relevante: true, categoria: "modelos", confianca: 0.8 },
      { relevante: false, categoria: null, confianca: 1 },
    ]) {
      expect(SchemaClassificacao.safeParse(decisao).data).toEqual(decisao);
    }
  });

  it("rejeita categoria fora da lista, confiança fora de [0, 1] e campos faltando", () => {
    expect(SchemaClassificacao.safeParse({ relevante: true, categoria: "fofoca", confianca: 0.8 }).success).toBe(false);
    expect(SchemaClassificacao.safeParse({ relevante: true, categoria: "modelos", confianca: 1.2 }).success).toBe(false);
    expect(SchemaClassificacao.safeParse({ relevante: true, categoria: "modelos" }).success).toBe(false);
    expect(SchemaClassificacao.safeParse({ relevante: "sim", categoria: "modelos", confianca: 0.5 }).success).toBe(false);
  });
});

describe("M2 · montarPromptTipado", () => {
  it("o system cita todas as categorias, o null e a confiança", () => {
    const { system } = montarPromptTipado(noticia);
    for (const categoria of CATEGORIAS) expect(system).toContain(categoria);
    expect(system).toContain("null");
    expect(system.toLowerCase()).toContain("confianca");
  });

  it("o prompt traz título, resumo e fonte", () => {
    const { prompt } = montarPromptTipado(noticia);
    expect(prompt).toContain(noticia.titulo);
    expect(prompt).toContain(noticia.resumo);
    expect(prompt).toContain(noticia.fonte);
  });
});

describe("M2 · classificarTipado", () => {
  it("devolve a decisão tipada e usa temperature 0 por padrão", async () => {
    const { modelo, chamadas } = mockQueResponde('{"relevante":true,"categoria":"modelos","confianca":0.9}');
    const r = await classificarTipado(noticia, { modelo });
    expect(r).toEqual({ ok: true, decisao: { relevante: true, categoria: "modelos", confianca: 0.9 } });
    expect(chamadas[0].temperature).toBe(0);
    expect(textoEnviado(chamadas[0])).toContain(noticia.titulo);
  });

  it("pede saída estruturada ao modelo (JSON com schema)", async () => {
    const { modelo, chamadas } = mockQueResponde('{"relevante":false,"categoria":null,"confianca":0.7}');
    await classificarTipado(noticia, { modelo });
    expect(chamadas[0].responseFormat?.type).toBe("json");
  });

  it("repassa a temperatura quando informada", async () => {
    const { modelo, chamadas } = mockQueResponde('{"relevante":false,"categoria":null,"confianca":0.7}');
    await classificarTipado(noticia, { modelo, temperature: 1 });
    expect(chamadas[0].temperature).toBe(1);
  });

  it("usa o montarPrompt informado no lugar do padrão", async () => {
    const { modelo, chamadas } = mockQueResponde('{"relevante":false,"categoria":null,"confianca":0.7}');
    await classificarTipado(noticia, { modelo, montarPrompt: () => ({ system: "SISTEMA-X", prompt: "PROMPT-Y" }) });
    expect(textoEnviado(chamadas[0])).toContain("SISTEMA-X");
    expect(textoEnviado(chamadas[0])).toContain("PROMPT-Y");
  });

  it("força categoria null quando não é relevante", async () => {
    const { modelo } = mockQueResponde('{"relevante":false,"categoria":"ferramentas","confianca":0.15}');
    expect(await classificarTipado(noticia, { modelo })).toEqual({
      ok: true,
      decisao: { relevante: false, categoria: null, confianca: 0.15 },
    });
  });

  it("marca como inconsistente: relevante sem categoria", async () => {
    const { modelo } = mockQueResponde('{"relevante":true,"categoria":null,"confianca":0.9}');
    expect(await classificarTipado(noticia, { modelo })).toEqual({ ok: false, motivo: "inconsistente" });
  });

  it("não quebra quando a saída foge do schema", async () => {
    for (const texto of ['{"relevante":true,"categoria":"fofoca","confianca":0.9}', "Relevante: sim", '{"relevante":true}']) {
      const { modelo } = mockQueResponde(texto);
      expect(await classificarTipado(noticia, { modelo })).toEqual({ ok: false, motivo: "saida-invalida" });
    }
  });

  it("deixa passar erros que não são de schema (ex.: rede)", async () => {
    const modelo = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    await expect(classificarTipado(noticia, { modelo })).rejects.toThrow("ECONNREFUSED");
  });
});
