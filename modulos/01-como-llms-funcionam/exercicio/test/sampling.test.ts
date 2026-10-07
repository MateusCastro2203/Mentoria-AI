import { describe, expect, it } from "vitest";
import { criarAleatorio } from "../src/aleatorio.js";
import { amostrar, filtrarTopP, softmax } from "../src/sampling.js";

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("softmax", () => {
  it("transforma logits em probabilidades que somam 1", () => {
    const p = softmax([1, 2, 3]);
    expect(p[0]).toBeCloseTo(0.09, 2);
    expect(p[1]).toBeCloseTo(0.2447, 3);
    expect(p[2]).toBeCloseTo(0.6652, 3);
    expect(soma(p)).toBeCloseTo(1, 10);
  });

  it("temperatura baixa concentra a probabilidade no favorito", () => {
    const p = softmax([1, 2, 3], 0.5);
    expect(p[2]).toBeCloseTo(0.8668, 3);
  });

  it("temperatura alta achata a distribuição", () => {
    const p = softmax([1, 2, 3], 100);
    for (const x of p) expect(x).toBeCloseTo(1 / 3, 2);
  });

  it("temperatura 0 é greedy (one-hot no maior logit)", () => {
    expect(softmax([1, 5, 3], 0)).toEqual([0, 1, 0]);
  });

  it("não estoura com logits grandes", () => {
    const p = softmax([1000, 1001]);
    expect(p.every(Number.isFinite)).toBe(true);
    expect(p[1]).toBeCloseTo(0.7311, 3);
  });
});

describe("filtrarTopP", () => {
  it("mantém o menor núcleo que soma >= topP e renormaliza", () => {
    const p = filtrarTopP([0.5, 0.3, 0.15, 0.05], 0.75);
    expect(p[0]).toBeCloseTo(0.625, 10);
    expect(p[1]).toBeCloseTo(0.375, 10);
    expect(p[2]).toBe(0);
    expect(p[3]).toBe(0);
  });

  it("não muda as posições quando a entrada não está ordenada", () => {
    const p = filtrarTopP([0.05, 0.5, 0.15, 0.3], 0.75);
    expect(p[0]).toBe(0);
    expect(p[1]).toBeCloseTo(0.625, 10);
    expect(p[2]).toBe(0);
    expect(p[3]).toBeCloseTo(0.375, 10);
  });

  it("topP pequeno deixa só o mais provável", () => {
    expect(filtrarTopP([0.2, 0.7, 0.1], 0.1)).toEqual([0, 1, 0]);
  });

  it("topP = 1 não altera nada", () => {
    expect(filtrarTopP([0.2, 0.7, 0.1], 1)).toEqual([0.2, 0.7, 0.1]);
  });
});

describe("amostrar", () => {
  const logits = [1, 2, 3]; // probabilidades ≈ [0.090, 0.245, 0.665]

  it("usa a probabilidade acumulada para escolher o índice", () => {
    expect(amostrar(logits, {}, () => 0.05)).toBe(0);
    expect(amostrar(logits, {}, () => 0.2)).toBe(1);
    expect(amostrar(logits, {}, () => 0.9)).toBe(2);
  });

  it("temperatura 0 sempre escolhe o maior logit", () => {
    for (const r of [0, 0.3, 0.99]) expect(amostrar(logits, { temperature: 0 }, () => r)).toBe(2);
  });

  it("topP pequeno corta a cauda", () => {
    for (const r of [0, 0.5, 0.99]) expect(amostrar(logits, { topP: 0.5 }, () => r)).toBe(2);
  });

  it("a frequência dos sorteios acompanha a softmax", () => {
    const aleatorio = criarAleatorio(42);
    const contagem = [0, 0, 0];
    const n = 20_000;
    for (let i = 0; i < n; i++) contagem[amostrar(logits, {}, aleatorio)]!++;
    const esperado = softmax(logits);
    contagem.forEach((c, i) => expect(c / n).toBeCloseTo(esperado[i]!, 1));
  });
});
