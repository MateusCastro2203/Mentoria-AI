import { describe, expect, it } from "vitest";
import { macroF1, matrizDeConfusao, metricasDaClasse, type Par } from "../src/metricas.js";

const par = (esperado: string, previsto: string): Par => ({ esperado, previsto });
const pares = [par("a", "a"), par("a", "a"), par("a", "b"), par("b", "b"), par("b", "a"), par("c", "c"), par("c", "b")];

describe("matrizDeConfusao", () => {
  it("conta esperado × previsto, com zeros onde não há casos", () => {
    expect(matrizDeConfusao(pares, ["a", "b", "c"])).toEqual({
      a: { a: 2, b: 1, c: 0 },
      b: { a: 1, b: 1, c: 0 },
      c: { a: 0, b: 1, c: 1 },
    });
  });

  it("inclui classes que aparecem nos pares mas não na lista", () => {
    const m = matrizDeConfusao([par("a", "x")], ["a"]);
    expect(m.a!.x).toBe(1);
    expect(m.x!.a).toBe(0);
  });
});

describe("metricasDaClasse", () => {
  it("calcula precisão, recall, F1 e suporte", () => {
    const a = metricasDaClasse(pares, "a");
    expect(a.precisao).toBeCloseTo(2 / 3, 10);
    expect(a.recall).toBeCloseTo(2 / 3, 10);
    expect(a.f1).toBeCloseTo(2 / 3, 10);
    expect(a.suporte).toBe(3);

    const b = metricasDaClasse(pares, "b");
    expect(b.precisao).toBeCloseTo(1 / 3, 10);
    expect(b.recall).toBeCloseTo(1 / 2, 10);
    expect(b.f1).toBeCloseTo(0.4, 10);

    const c = metricasDaClasse(pares, "c");
    expect(c.precisao).toBe(1);
    expect(c.recall).toBeCloseTo(0.5, 10);
  });

  it("classe ausente → tudo 0, sem dividir por zero", () => {
    expect(metricasDaClasse(pares, "d")).toEqual({ precisao: 0, recall: 0, f1: 0, suporte: 0 });
  });
});

describe("macroF1", () => {
  it("é a média simples do F1 das classes", () => {
    expect(macroF1(pares, ["a", "b", "c"])).toBeCloseTo((2 / 3 + 0.4 + 2 / 3) / 3, 10);
  });

  it("uma classe rara errada pesa o mesmo que uma comum", () => {
    const muitosA = [...Array.from({ length: 9 }, () => par("a", "a")), par("raro", "a")];
    expect(macroF1(muitosA, ["a", "raro"])).toBeLessThan(0.5);
  });
});
