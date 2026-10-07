import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { classificarLivre, montarPromptClassificacao } from "../src/m01/classificar-livre.js";
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
          inputTokens: { total: 50, noCache: 50, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 10, text: 10, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
  return { modelo, chamadas };
}

/** Junta todo o texto enviado ao modelo (system + user). */
const textoEnviado = (chamada: any) =>
  chamada.prompt
    .flatMap((m: any) => (typeof m.content === "string" ? [m.content] : m.content.map((p: any) => p.text ?? "")))
    .join("\n");

describe("M1 · montarPromptClassificacao", () => {
  it("o system cita todas as categorias", () => {
    const { system } = montarPromptClassificacao(noticia);
    for (const categoria of CATEGORIAS) expect(system).toContain(categoria);
  });

  it("o system explica o que é relevante", () => {
    expect(montarPromptClassificacao(noticia).system.toLowerCase()).toContain("relevante");
  });

  it("o prompt traz título, resumo e fonte da notícia", () => {
    const { prompt } = montarPromptClassificacao(noticia);
    expect(prompt).toContain(noticia.titulo);
    expect(prompt).toContain(noticia.resumo);
    expect(prompt).toContain(noticia.fonte);
  });
});

describe("M1 · classificarLivre", () => {
  it("envia o prompt montado e devolve a resposta sem espaços nas pontas", async () => {
    const { modelo, chamadas } = mockQueResponde("  Relevante: sim. Categoria: modelos.\n");
    const resposta = await classificarLivre(noticia, { modelo });

    expect(resposta).toBe("Relevante: sim. Categoria: modelos.");
    expect(chamadas).toHaveLength(1);
    const { system, prompt } = montarPromptClassificacao(noticia);
    expect(textoEnviado(chamadas[0])).toContain(system);
    expect(textoEnviado(chamadas[0])).toContain(prompt);
  });

  it("repassa a temperatura para o modelo", async () => {
    const { modelo, chamadas } = mockQueResponde("ok");
    await classificarLivre(noticia, { modelo, temperature: 0.7 });
    expect(chamadas[0].temperature).toBe(0.7);
  });
});
