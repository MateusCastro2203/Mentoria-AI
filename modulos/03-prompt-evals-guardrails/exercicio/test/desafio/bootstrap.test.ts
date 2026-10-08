import { describe, expect, it } from "vitest";
import { criarAleatorio } from "../../src/aleatorio.js";
import { intervaloBootstrap } from "../../src/desafio/bootstrap.js";

// 15 acertos em 20, como na comparação da M2.
const acertos = [...Array(15).fill(true), ...Array(5).fill(false)] as boolean[];

describe("intervaloBootstrap", () => {
  it("devolve a acurácia original e um intervalo largo para 20 exemplos", () => {
    const r = intervaloBootstrap(acertos, { aleatorio: criarAleatorio(1) });
    expect(r.acuracia).toBe(0.75);
    expect(r.inferior).toBeGreaterThanOrEqual(0.5);
    expect(r.inferior).toBeLessThanOrEqual(0.6);
    expect(r.superior).toBeGreaterThanOrEqual(0.9);
    expect(r.superior).toBeLessThanOrEqual(0.95);
  });

  it("com 4× mais exemplos (mesma acurácia), o intervalo fica mais estreito", () => {
    const largura = (xs: boolean[]) => {
      const r = intervaloBootstrap(xs, { aleatorio: criarAleatorio(1) });
      return r.superior - r.inferior;
    };
    expect(largura([...acertos, ...acertos, ...acertos, ...acertos])).toBeLessThan(largura(acertos));
  });

  it("é reprodutível com a mesma semente", () => {
    expect(intervaloBootstrap(acertos, { aleatorio: criarAleatorio(7) })).toEqual(
      intervaloBootstrap(acertos, { aleatorio: criarAleatorio(7) }),
    );
  });

  it("tudo certo → [1, 1]; lista vazia → erro", () => {
    expect(intervaloBootstrap([true, true, true], { aleatorio: criarAleatorio(1) })).toEqual({ acuracia: 1, inferior: 1, superior: 1 });
    expect(() => intervaloBootstrap([])).toThrow();
  });
});
