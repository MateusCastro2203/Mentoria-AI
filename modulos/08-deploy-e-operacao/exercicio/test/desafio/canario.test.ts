import { describe, expect, it } from "vitest";
import { decidirCanario, escolherVersao, type Execucao } from "../../src/desafio/canario.js";

const canario = { estavel: "v1", candidata: "v2", percentual: 20 };

describe("desafio · escolherVersao", () => {
  it("determinística pela chave", () => {
    for (const chave of ["2026-10-13", "2026-10-14", "cliente-42"]) expect(escolherVersao(chave, canario)).toBe(escolherVersao(chave, canario));
  });

  it("respeita o percentual (aproximadamente, em muitas chaves)", () => {
    const chaves = Array.from({ length: 2000 }, (_, i) => `execucao-${i}`);
    const naCandidata = chaves.filter((c) => escolherVersao(c, canario) === "v2").length / chaves.length;
    expect(naCandidata).toBeGreaterThan(0.15);
    expect(naCandidata).toBeLessThan(0.25);
    expect(chaves.every((c) => escolherVersao(c, { ...canario, percentual: 0 }) === "v1")).toBe(true);
    expect(chaves.every((c) => escolherVersao(c, { ...canario, percentual: 100 }) === "v2")).toBe(true);
  });
});

const execs = (versao: string, ok: number, falhou: number): Execucao[] => [
  ...Array.from({ length: ok }, () => ({ versao, status: "ok" as const })),
  ...Array.from({ length: falhou }, () => ({ versao, status: "falhou" as const })),
];

describe("desafio · decidirCanario", () => {
  const regra = { minimoDeExecucoes: 10, tolerancia: 0.05 };

  it("aguarda até ter dados suficientes da candidata", () => {
    expect(decidirCanario([...execs("v1", 50, 0), ...execs("v2", 9, 0)], canario, regra)).toBe("aguardar");
  });

  it("reverte quando a candidata falha mais que a estável + tolerância", () => {
    expect(decidirCanario([...execs("v1", 95, 5), ...execs("v2", 8, 2)], canario, regra)).toBe("reverter");
  });

  it("promove quando está dentro da tolerância; ignora outras versões", () => {
    expect(decidirCanario([...execs("v1", 95, 5), ...execs("v2", 9, 1), ...execs("v0", 0, 30)], canario, regra)).toBe("promover");
    expect(decidirCanario(execs("v2", 10, 0), canario, regra)).toBe("promover");
  });
});
