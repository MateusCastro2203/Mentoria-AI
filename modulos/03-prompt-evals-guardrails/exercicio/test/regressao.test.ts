import { describe, expect, it } from "vitest";
import { aprovarMudanca, compararExecucoes } from "../src/regressao.js";

describe("compararExecucoes", () => {
  it("lista regressões e melhorias e calcula o delta de acurácia", () => {
    const r = compararExecucoes({ a: true, b: false, c: false, d: true }, { a: true, b: true, c: true, d: false });
    expect(r).toEqual({ regressoes: ["d"], melhorias: ["b", "c"], delta: 0.25 });
  });

  it("considera só os casos presentes nas duas execuções", () => {
    const r = compararExecucoes({ x: true, y: false, z: true, w: true }, { x: false, y: true, z: true, k: true });
    expect(r.regressoes).toEqual(["x"]);
    expect(r.melhorias).toEqual(["y"]);
    expect(r.delta).toBeCloseTo(0, 10);
  });

  it("acurácia igual pode esconder trocas: uma regressão e uma melhoria", () => {
    const r = compararExecucoes({ a: true, b: false }, { a: false, b: true });
    expect(r.delta).toBe(0);
    expect(r.regressoes).toEqual(["a"]);
  });

  it("sem casos em comum → delta 0", () => {
    expect(compararExecucoes({ a: true }, { b: true })).toEqual({ regressoes: [], melhorias: [], delta: 0 });
  });
});

describe("aprovarMudanca", () => {
  const comparacao = { regressoes: ["d"], melhorias: ["b", "c"], delta: 0.25 };

  it("reprova se houver mais regressões que o permitido", () => {
    const r = aprovarMudanca(comparacao, { minDelta: 0, maxRegressoes: 0 });
    expect(r.aprovado).toBe(false);
    expect(r.motivos).toHaveLength(1);
  });

  it("aprova dentro da regra", () => {
    expect(aprovarMudanca(comparacao, { minDelta: 0, maxRegressoes: 1 })).toEqual({ aprovado: true, motivos: [] });
  });

  it("reprova se o delta for menor que o mínimo, e junta os motivos", () => {
    const r = aprovarMudanca(comparacao, { minDelta: 0.3, maxRegressoes: 0 });
    expect(r.aprovado).toBe(false);
    expect(r.motivos).toHaveLength(2);
  });
});
