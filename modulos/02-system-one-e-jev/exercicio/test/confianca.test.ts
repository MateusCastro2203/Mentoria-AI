import { describe, expect, it } from "vitest";
import { confiancaDaEscolha, probabilidadesDasOpcoes, votacao } from "../src/confianca.js";

const alt = (token: string, p: number) => ({ token, logprob: Math.log(p) });

describe("probabilidadesDasOpcoes", () => {
  const opcoes = ["modelos", "ferramentas", "regulacao", "mercado"];

  it("ignora alternativas que não são começo de nenhuma opção e renormaliza", () => {
    const r = probabilidadesDasOpcoes([alt('"fer', 0.5), alt("IA", 0.3), alt("mod", 0.1), alt("re", 0.05)], opcoes)!;
    expect(r.ferramentas).toBeCloseTo(0.5 / 0.65, 10);
    expect(r.modelos).toBeCloseTo(0.1 / 0.65, 10);
    expect(r.regulacao).toBeCloseTo(0.05 / 0.65, 10);
    expect(r.mercado).toBe(0);
  });

  it("normaliza espaços, aspas e maiúsculas do token", () => {
    const r = probabilidadesDasOpcoes([alt(' "Mod', 0.9), alt(" fer", 0.1)], opcoes)!;
    expect(r.modelos).toBeCloseTo(0.9, 10);
  });

  it("ignora token ambíguo, que começa mais de uma opção", () => {
    const r = probabilidadesDasOpcoes([alt("re", 0.6), alt("reg", 0.3)], ["regulacao", "relevante"])!;
    expect(r).toEqual({ regulacao: 1, relevante: 0 });
  });

  it("devolve null quando nada casa com as opções", () => {
    expect(probabilidadesDasOpcoes([alt("IA", 0.7), alt("**", 0.2), alt(" ", 0.1)], opcoes)).toBeNull();
  });
});

describe("confiancaDaEscolha", () => {
  it("segue o exemplo da documentação: 88% entre 3 opções ≈ 0,82", () => {
    expect(confiancaDaEscolha([0.88, 0.12, 0])).toBeCloseTo(0.82, 10);
  });

  it("uniforme → 0 e certeza → 1", () => {
    expect(confiancaDaEscolha([1 / 3, 1 / 3, 1 / 3])).toBeCloseTo(0, 10);
    expect(confiancaDaEscolha([0.5, 0.5])).toBeCloseTo(0, 10);
    expect(confiancaDaEscolha([0, 1, 0])).toBe(1);
  });

  it("a mesma probabilidade vale mais confiança com mais opções", () => {
    expect(confiancaDaEscolha([0.5, 0.25, 0.25])).toBeGreaterThan(confiancaDaEscolha([0.5, 0.5]));
  });

  it("uma opção só → 1", () => {
    expect(confiancaDaEscolha([1])).toBe(1);
  });
});

describe("votacao", () => {
  it("escolhe a mais votada e usa a fração de votos como confiança", () => {
    const r = votacao(["a", "b", "a", "c", "a"]);
    expect(r.vencedora).toBe("a");
    expect(r.confianca).toBeCloseTo(0.6, 10);
    expect(r.distribuicao).toEqual({ a: 0.6, b: 0.2, c: 0.2 });
  });

  it("em empate, vence a que apareceu primeiro", () => {
    expect(votacao(["b", "a", "a", "b"]).vencedora).toBe("b");
  });

  it("lança erro com lista vazia", () => {
    expect(() => votacao([])).toThrow(/vazia/i);
  });
});
