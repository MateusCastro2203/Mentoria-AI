import { describe, expect, it } from "vitest";
import { concordancia, kappaDeCohen } from "../src/concordancia.js";

const juiz = ["aprova", "aprova", "reprova", "reprova", "aprova", "reprova"];
const humano = ["aprova", "reprova", "reprova", "reprova", "aprova", "aprova"];

describe("concordancia", () => {
  it("fração de itens com o mesmo rótulo", () => {
    expect(concordancia(juiz, humano)).toBeCloseTo(4 / 6, 10);
    expect(concordancia([], [])).toBe(0);
  });
});

describe("kappaDeCohen", () => {
  it("desconta a concordância esperada por acaso", () => {
    // pₒ = 4/6; pₑ = 0,5 × 0,5 + 0,5 × 0,5 = 0,5 → κ = (0,667 − 0,5) / 0,5 ≈ 0,333
    expect(kappaDeCohen(juiz, humano)).toBeCloseTo(1 / 3, 10);
  });

  it("concordância perfeita → 1", () => {
    expect(kappaDeCohen(juiz, juiz)).toBe(1);
  });

  it("um juiz que aprova tudo concorda bastante, mas não ajuda: κ = 0", () => {
    const humanoMaioriaAprova = ["aprova", "aprova", "aprova", "reprova"];
    expect(concordancia(["aprova", "aprova", "aprova", "aprova"], humanoMaioriaAprova)).toBe(0.75);
    expect(kappaDeCohen(["aprova", "aprova", "aprova", "aprova"], humanoMaioriaAprova)).toBeCloseTo(0, 10);
  });

  it("os dois sempre com o mesmo rótulo → 1", () => {
    expect(kappaDeCohen(["x", "x"], ["x", "x"])).toBe(1);
  });

  it("listas de tamanhos diferentes → erro", () => {
    expect(() => kappaDeCohen(["a"], ["a", "b"])).toThrow(/tamanho/);
  });
});
