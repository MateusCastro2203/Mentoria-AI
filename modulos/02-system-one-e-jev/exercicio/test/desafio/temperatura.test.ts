import { describe, expect, it } from "vitest";
import { ajustarTemperatura, logVerossimilhancaNegativa, type ExemploRotulado } from "../../src/desafio/temperatura.js";

// Modelo confiante demais: dá ~96% para a classe 0, mas a classe 0 só está certa em 7 de 10 casos.
const confianteDemais: ExemploRotulado[] = [
  ...Array.from({ length: 7 }, () => ({ logits: [4, 0, 0], correta: 0 })),
  ...Array.from({ length: 3 }, () => ({ logits: [4, 0, 0], correta: 1 })),
];

// Modelo já calibrado: dá 70% para a classe 0, que está certa em 7 de 10 casos.
const calibrado: ExemploRotulado[] = [
  ...Array.from({ length: 7 }, () => ({ logits: [Math.log(0.7), Math.log(0.15), Math.log(0.15)], correta: 0 })),
  ...Array.from({ length: 3 }, () => ({ logits: [Math.log(0.7), Math.log(0.15), Math.log(0.15)], correta: 1 })),
];

describe("logVerossimilhancaNegativa", () => {
  it("é a média de −ln(probabilidade da classe correta)", () => {
    expect(logVerossimilhancaNegativa(confianteDemais, 1)).toBeCloseTo(1.236, 3);
  });

  it("chutar uniforme dá ln(número de classes)", () => {
    expect(logVerossimilhancaNegativa([{ logits: [0, 0, 0], correta: 2 }], 1)).toBeCloseTo(Math.log(3), 10);
  });
});

describe("ajustarTemperatura", () => {
  it("um modelo confiante demais precisa de T > 1 (≈ 2,6 aqui)", () => {
    expect(ajustarTemperatura(confianteDemais)).toBe(2.6);
  });

  it("um modelo calibrado fica com T = 1", () => {
    expect(ajustarTemperatura(calibrado)).toBe(1);
  });

  it("respeita a lista de candidatos", () => {
    expect(ajustarTemperatura(confianteDemais, [0.5, 1, 2])).toBe(2);
  });
});
