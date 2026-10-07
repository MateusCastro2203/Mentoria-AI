import { beforeAll, describe, expect, it } from "vitest";
import { criarAleatorio } from "../../src/aleatorio.js";
import { FIM, gerarFrase, INICIO, logitsDoProximo, treinarBigrama } from "../../src/desafio/bigrama.js";

const corpus = [
  "o brasil tem capital em brasília",
  "a frança tem capital em paris",
  "o japão tem capital em tóquio",
  "o brasil fala português",
];

describe("treinarBigrama", () => {
  it("conta pares de palavras com marcadores de início e fim", () => {
    const m = treinarBigrama(["O gato", "o rato"]);
    expect(m.get(INICIO)?.get("o")).toBe(2);
    expect(m.get("o")?.get("gato")).toBe(1);
    expect(m.get("gato")?.get(FIM)).toBe(1);
  });
});

describe("logitsDoProximo", () => {
  it("logit = ln(contagem), na ordem de primeira aparição", () => {
    const m = treinarBigrama(corpus);
    const { candidatos, logits } = logitsDoProximo(m, "o");
    expect(candidatos).toEqual(["brasil", "japão"]);
    expect(logits[0]).toBeCloseTo(Math.log(2), 10);
    expect(logits[1]).toBeCloseTo(0, 10);
  });
});

describe("gerarFrase", () => {
  let modelo: ReturnType<typeof treinarBigrama>;
  beforeAll(() => {
    modelo = treinarBigrama(corpus);
  });

  it("greedy é determinístico", () => {
    const a = gerarFrase(modelo, { temperature: 0 }, criarAleatorio(1));
    const b = gerarFrase(modelo, { temperature: 0 }, criarAleatorio(2));
    expect(a).toBe(b);
  });

  it("respeita maxPalavras", () => {
    const frase = gerarFrase(modelo, { temperature: 0, maxPalavras: 2 }, criarAleatorio(1));
    expect(frase.split(" ")).toHaveLength(2);
  });

  it("toda transição gerada existe no corpus…", () => {
    const aleatorio = criarAleatorio(7);
    for (let i = 0; i < 100; i++) {
      const palavras = [INICIO, ...gerarFrase(modelo, {}, aleatorio).split(" ")];
      for (let j = 1; j < palavras.length; j++) {
        expect(modelo.get(palavras[j - 1]!)?.has(palavras[j]!)).toBe(true);
      }
    }
  });

  it("…e mesmo assim ele inventa frases que nunca viu (alucinação em miniatura)", () => {
    const aleatorio = criarAleatorio(7);
    const geradas = new Set(Array.from({ length: 200 }, () => gerarFrase(modelo, {}, aleatorio)));
    const inventadas = [...geradas].filter((f) => !corpus.includes(f));
    expect(inventadas.length).toBeGreaterThan(0);
  });
});
