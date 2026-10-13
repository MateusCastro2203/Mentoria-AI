import { describe, expect, it } from "vitest";
import { curvaDeLimiar, escolherLimiar } from "../../src/desafio/limiar.js";

// 10 pedidos antigos: confiança do assistente e se a sugestão estava certa.
const HISTORICO = [
  { confianca: 0.99, correto: true },
  { confianca: 0.99, correto: true },
  { confianca: 0.97, correto: true },
  { confianca: 0.95, correto: false },
  { confianca: 0.95, correto: true },
  { confianca: 0.9, correto: true },
  { confianca: 0.9, correto: true },
  { confianca: 0.8, correto: false },
  { confianca: 0.8, correto: false },
  { confianca: 0.6, correto: true },
];

describe("desafio · curvaDeLimiar", () => {
  it("um ponto por confiança distinta, do maior para o menor", () => {
    expect(curvaDeLimiar(HISTORICO)).toEqual([
      { limiar: 0.99, cobertura: 0.2, precisao: 1 },
      { limiar: 0.97, cobertura: 0.3, precisao: 1 },
      { limiar: 0.95, cobertura: 0.5, precisao: 0.8 },
      { limiar: 0.9, cobertura: 0.7, precisao: 6 / 7 },
      { limiar: 0.8, cobertura: 0.9, precisao: 6 / 9 },
      { limiar: 0.6, cobertura: 1, precisao: 0.7 },
    ]);
    expect(curvaDeLimiar([])).toEqual([]);
  });
});

describe("desafio · escolherLimiar", () => {
  it("o menor limiar que ainda atinge a precisão pedida", () => {
    expect(escolherLimiar(HISTORICO, 1)?.limiar).toBe(0.97);
    expect(escolherLimiar(HISTORICO, 0.85)?.limiar).toBe(0.9);
  });

  it("a precisão não é regular: 0.95 falha em 85%, mas 0.9 passa", () => {
    const curva = curvaDeLimiar(HISTORICO);
    expect(curva.find((p) => p.limiar === 0.95)!.precisao).toBeLessThan(0.85);
    expect(escolherLimiar(HISTORICO, 0.85)).toEqual({ limiar: 0.9, cobertura: 0.7, precisao: 6 / 7 });
  });

  it("aceitar precisão menor libera mais automação; impossível → null", () => {
    expect(escolherLimiar(HISTORICO, 0.7)?.limiar).toBe(0.6);
    expect(escolherLimiar([{ confianca: 0.9, correto: false }], 0.5)).toBeNull();
  });
});
