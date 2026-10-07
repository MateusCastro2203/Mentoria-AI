import { describe, expect, it } from "vitest";
import { contarTokens, custoPorChamada, razaoDeTokens } from "../src/tokens.js";
import { tokenizar } from "../src/tokenizador.js";

describe("contarTokens", () => {
  it("conta o mesmo que o tokenizador", () => {
    const texto = "Tokenização não é o mesmo que separar palavras.";
    expect(contarTokens(texto)).toBe(tokenizar(texto).ids.length);
  });

  it("texto vazio tem zero tokens", () => {
    expect(contarTokens("")).toBe(0);
  });

  it("palavras não são tokens: uma palavra rara vira vários pedaços", () => {
    expect(contarTokens("inconstitucionalissimamente")).toBeGreaterThan(1);
  });
});

describe("razaoDeTokens", () => {
  it("divide os tokens de A pelos de B", () => {
    const a = "o gato subiu no telhado";
    const b = "o gato";
    expect(razaoDeTokens(a, b)).toBeCloseTo(contarTokens(a) / contarTokens(b), 10);
  });

  it("texto igual dá razão 1", () => {
    expect(razaoDeTokens("olá", "olá")).toBe(1);
  });
});

describe("custoPorChamada", () => {
  // Preços hipotéticos, só para o cálculo. Consulte a página de preços do seu provedor.
  const preco = { entradaPorMilhao: 2, saidaPorMilhao: 8 };

  it("cobra entrada e saída com preços diferentes", () => {
    expect(custoPorChamada({ tokensEntrada: 1_000_000, tokensSaida: 0 }, preco)).toBeCloseTo(2, 10);
    expect(custoPorChamada({ tokensEntrada: 0, tokensSaida: 1_000_000 }, preco)).toBeCloseTo(8, 10);
  });

  it("calcula uma chamada típica", () => {
    // 1.500 de entrada e 300 de saída: 1500 * 2/1e6 + 300 * 8/1e6 = 0,0054
    expect(custoPorChamada({ tokensEntrada: 1500, tokensSaida: 300 }, preco)).toBeCloseTo(0.0054, 10);
  });
});
