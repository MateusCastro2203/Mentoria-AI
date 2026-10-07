import { describe, expect, it } from "vitest";
import { acuracia, brier, coberturaVsAcuracia, ece, tabelaDeCalibracao, type Previsao } from "../src/calibracao.js";

const p = (confianca: number, acertou: boolean): Previsao => ({ confianca, acertou });

// 7 previsões: 4 acertos. A maioria está na faixa de 0,8–1,0, onde a acurácia (75%) fica abaixo da confiança (95%).
const previsoes = [p(0.95, true), p(0.95, false), p(0.9, true), p(0.6, true), p(0.55, false), p(0.2, false), p(1, true)];

describe("acuracia e brier", () => {
  it("acurácia = acertos / total", () => {
    expect(acuracia(previsoes)).toBeCloseTo(4 / 7, 10);
    expect(acuracia([])).toBe(0);
  });

  it("brier = média de (confiança − acerto)²", () => {
    expect(brier(previsoes)).toBeCloseTo(1.4175 / 7, 10);
    expect(brier([p(1, true), p(0, false)])).toBe(0);
    expect(brier([])).toBe(0);
  });
});

describe("tabelaDeCalibracao", () => {
  it("devolve todas as faixas, inclusive vazias", () => {
    const tabela = tabelaDeCalibracao(previsoes, 5);
    expect(tabela).toHaveLength(5);
    expect(tabela[0]).toEqual({ de: 0, ate: 0.2, quantidade: 0, confiancaMedia: null, acuracia: null });
  });

  it("agrupa por faixa de confiança (confiança 1 vai para a última)", () => {
    const tabela = tabelaDeCalibracao(previsoes, 5);
    expect(tabela.map((f) => f.quantidade)).toEqual([0, 1, 1, 1, 4]);
    expect(tabela[4]!.confiancaMedia).toBeCloseTo(0.95, 10);
    expect(tabela[4]!.acuracia).toBeCloseTo(0.75, 10);
    expect(tabela[1]!.acuracia).toBe(0);
  });
});

describe("ece", () => {
  it("média ponderada da distância entre acurácia e confiança por faixa", () => {
    expect(ece(previsoes, 5)).toBeCloseTo(1.95 / 7, 10);
  });

  it("modelo calibrado tem ECE 0", () => {
    expect(ece([p(0.5, true), p(0.5, false)], 5)).toBeCloseTo(0, 10);
  });

  it("lista vazia → 0", () => {
    expect(ece([], 5)).toBe(0);
  });
});

describe("coberturaVsAcuracia", () => {
  it("aceita só quem passa do limiar", () => {
    const r = coberturaVsAcuracia(previsoes, 0.9);
    expect(r.cobertura).toBeCloseTo(4 / 7, 10);
    expect(r.acuracia).toBeCloseTo(0.75, 10);
  });

  it("limiar 0 aceita tudo; limiar acima de 1 não aceita nada", () => {
    expect(coberturaVsAcuracia(previsoes, 0)).toEqual({ cobertura: 1, acuracia: 4 / 7 });
    expect(coberturaVsAcuracia(previsoes, 1.01)).toEqual({ cobertura: 0, acuracia: null });
  });
});
