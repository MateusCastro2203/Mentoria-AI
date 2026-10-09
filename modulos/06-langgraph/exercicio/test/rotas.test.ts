import { describe, expect, it } from "vitest";
import { rotaDeTriagem } from "../src/rotas.js";

describe("rotaDeTriagem", () => {
  it("roteia pela categoria quando a confiança é alta", () => {
    expect(rotaDeTriagem({ categoria: "cobranca", confianca: 0.95 })).toBe("financeiro");
    expect(rotaDeTriagem({ categoria: "tecnico", confianca: 0.9 })).toBe("suporte");
    expect(rotaDeTriagem({ categoria: "duvida", confianca: 0.7 })).toBe("faq");
  });

  it("confiança baixa ou ausente vai para um humano", () => {
    expect(rotaDeTriagem({ categoria: "cobranca", confianca: 0.69 })).toBe("humano");
    expect(rotaDeTriagem({ categoria: "tecnico", confianca: null })).toBe("humano");
    expect(rotaDeTriagem({ categoria: null, confianca: 0.99 })).toBe("humano");
  });

  it("o limiar é configurável", () => {
    expect(rotaDeTriagem({ categoria: "duvida", confianca: 0.8 }, 0.9)).toBe("humano");
    expect(rotaDeTriagem({ categoria: "duvida", confianca: 0.5 }, 0.4)).toBe("faq");
  });
});
