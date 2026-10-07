import { describe, expect, it } from "vitest";
import { ajustarAoContexto, SOBRECARGA_POR_MENSAGEM, type Mensagem } from "../src/contexto.js";

// Contador simples para o teste ser previsível: 1 token por palavra.
const porPalavra = (texto: string) => texto.split(/\s+/).filter(Boolean).length;
const custo = (palavras: number) => palavras + SOBRECARGA_POR_MENSAGEM;

const historico: Mensagem[] = [
  { papel: "system", conteudo: "você é um assistente" }, // 4 palavras
  { papel: "user", conteudo: "um dois tres" }, // 3
  { papel: "assistant", conteudo: "quatro cinco" }, // 2
  { papel: "user", conteudo: "seis" }, // 1
];

describe("ajustarAoContexto", () => {
  it("devolve tudo quando cabe", () => {
    const total = custo(4) + custo(3) + custo(2) + custo(1);
    expect(ajustarAoContexto(historico, total, porPalavra)).toEqual(historico);
  });

  it("descarta as mensagens mais antigas primeiro e mantém o system", () => {
    const limite = custo(4) + custo(2) + custo(1);
    expect(ajustarAoContexto(historico, limite, porPalavra)).toEqual([historico[0], historico[2], historico[3]]);
  });

  it("para na primeira que não cabe, sem pular para uma mais antiga menor", () => {
    const msgs: Mensagem[] = [
      { papel: "system", conteudo: "s" },
      { papel: "user", conteudo: "a" },
      { papel: "assistant", conteudo: "b c d e f g h" },
      { papel: "user", conteudo: "i" },
    ];
    const limite = custo(1) + custo(1) + custo(1) + 2; // cabe a última e a antiga "a", mas não "b c d…"
    expect(ajustarAoContexto(msgs, limite, porPalavra)).toEqual([msgs[0], msgs[3]]);
  });

  it("lança erro se só as instruções já estouram o limite", () => {
    expect(() => ajustarAoContexto(historico, 3, porPalavra)).toThrow(/limite/i);
  });

  it("usa o tokenizador real por padrão", () => {
    const r = ajustarAoContexto([{ papel: "user", conteudo: "oi" }], 100);
    expect(r).toHaveLength(1);
  });
});
