import { describe, expect, it } from "vitest";
import { custo, estimarTokens } from "../src/custo.js";

describe("custo", () => {
  it("estimarTokens: caracteres ÷ 4, arredondando para cima", () => {
    expect(estimarTokens("")).toBe(0);
    expect(estimarTokens("abcd")).toBe(1);
    expect(estimarTokens("abcde")).toBe(2);
    expect(estimarTokens("x".repeat(1000))).toBe(250);
  });

  it("custo por milhão de tokens; ausente conta zero", () => {
    const precos = { entradaPorMilhao: 0.5, saidaPorMilhao: 2 };
    expect(custo({ tokensEntrada: 1_000_000, tokensSaida: 1_000_000 }, precos)).toBeCloseTo(2.5, 10);
    expect(custo({ tokensEntrada: 4_000, tokensSaida: 500 }, precos)).toBeCloseTo(0.003, 10);
    expect(custo({}, precos)).toBe(0);
  });
});
