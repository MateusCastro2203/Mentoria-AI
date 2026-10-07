import { MockLanguageModelV4 } from "ai/test";
import { NoObjectGeneratedError } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { CONFIG_PADRAO, gerarObjeto, gerarTexto, lerConfig } from "../src/index.js";

function mockQueResponde(texto: string, providerMetadata?: Record<string, any>) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: texto }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 12, noCache: 12, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 7, text: 7, reasoning: undefined },
      },
      warnings: [],
      providerMetadata,
    }),
  });
}

describe("lerConfig", () => {
  it("usa Ollama local quando nada está configurado", () => {
    expect(lerConfig({})).toEqual({
      baseURL: CONFIG_PADRAO.baseURL,
      modelo: CONFIG_PADRAO.modelo,
      apiKey: undefined,
      reasoningEffort: undefined,
    });
  });

  it("lê o provedor das variáveis de ambiente", () => {
    const config = lerConfig({
      LLM_BASE_URL: "https://exemplo.dev/v1",
      LLM_MODEL: "modelo-x",
      LLM_API_KEY: "chave",
      LLM_REASONING_EFFORT: "none",
    });
    expect(config).toEqual({
      baseURL: "https://exemplo.dev/v1",
      modelo: "modelo-x",
      apiKey: "chave",
      reasoningEffort: "none",
    });
  });
});

describe("gerarTexto", () => {
  it("devolve texto e uso de tokens", async () => {
    const r = await gerarTexto({ prompt: "oi", modelo: mockQueResponde("olá!") });
    expect(r.texto).toBe("olá!");
    expect(r.uso.tokensEntrada).toBe(12);
    expect(r.uso.tokensSaida).toBe(7);
    expect(r.uso.latenciaMs).toBeGreaterThanOrEqual(0);
    expect(r.logprobs).toBeUndefined();
  });

  it("expõe logprobs quando o provedor devolve", async () => {
    const modelo = mockQueResponde("sim", {
      llm: { logprobs: [{ token: "sim", logprob: -0.1, top_logprobs: [{ token: "não", logprob: -2.4 }] }] },
    });
    const r = await gerarTexto({ prompt: "?", modelo });
    expect(r.logprobs).toEqual([{ token: "sim", logprob: -0.1, alternativas: [{ token: "não", logprob: -2.4 }] }]);
  });
});

describe("gerarObjeto", () => {
  const schema = z.object({ relevante: z.boolean(), categoria: z.enum(["modelos", "pesquisa", "outros"]) });

  it("valida a saída com o schema Zod", async () => {
    const r = await gerarObjeto({
      prompt: "classifique",
      schema,
      modelo: mockQueResponde('{"relevante":true,"categoria":"modelos"}'),
    });
    expect(r.objeto).toEqual({ relevante: true, categoria: "modelos" });
  });

  it("lança NoObjectGeneratedError quando o modelo foge do schema", async () => {
    const promessa = gerarObjeto({
      prompt: "classifique",
      schema,
      modelo: mockQueResponde('{"relevante":"talvez","categoria":"fofoca"}'),
    });
    await expect(promessa).rejects.toSatisfy(NoObjectGeneratedError.isInstance);
  });
});

describe("provedor OpenAI-compatible (fetch simulado)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envia reasoning_effort e logprobs e lê os logprobs da resposta", async () => {
    const corpos: any[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        corpos.push(JSON.parse(String(init.body)));
        return Response.json({
          id: "1",
          object: "chat.completion",
          created: 0,
          model: "m",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "ok" },
              finish_reason: "stop",
              logprobs: { content: [{ token: "ok", logprob: -0.05, top_logprobs: [] }] },
            },
          ],
          usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 },
        });
      }),
    );

    const r = await gerarTexto({
      prompt: "diga ok",
      logprobs: true,
      config: { baseURL: "http://fake/v1", modelo: "m", reasoningEffort: "none" },
    });

    expect(corpos[0]).toMatchObject({ model: "m", logprobs: true, top_logprobs: 5, reasoning_effort: "none" });
    expect(r.texto).toBe("ok");
    expect(r.logprobs?.[0]).toEqual({ token: "ok", logprob: -0.05, alternativas: [] });
  });
});
