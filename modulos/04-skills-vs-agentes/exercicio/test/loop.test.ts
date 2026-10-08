import { describe, expect, it } from "vitest";
import { executarAgente, type Acao, type Evento } from "../src/loop.js";

/** "Modelo" com roteiro fixo: devolve as ações da lista, uma por passo, e registra o que viu. */
function roteiro(...acoes: Acao[]) {
  const visto: Evento[][] = [];
  let i = 0;
  return {
    visto,
    decidir: (historico: Evento[]) => {
      visto.push([...historico]);
      return acoes[Math.min(i++, acoes.length - 1)]!;
    },
  };
}

const ferramentas = {
  somar: ({ a, b }: { a: number; b: number }) => a + b,
  falhar: () => {
    throw new Error("serviço fora do ar");
  },
};

describe("executarAgente", () => {
  it("executa ferramentas, devolve o resultado ao modelo e termina quando ele responde", async () => {
    const r1 = roteiro({ tipo: "ferramenta", nome: "somar", entrada: { a: 2, b: 3 } }, { tipo: "resposta", texto: "5" });
    const r = await executarAgente({ decidir: r1.decidir, ferramentas, maxPassos: 5 });
    expect(r).toEqual({
      resposta: "5",
      motivo: "respondeu",
      passos: 2,
      historico: [{ tipo: "ferramenta", nome: "somar", entrada: { a: 2, b: 3 }, saida: 5 }],
    });
    expect(r1.visto[1]).toEqual(r.historico);
  });

  it("ferramenta desconhecida vira evento de erro e o loop continua", async () => {
    const r1 = roteiro({ tipo: "ferramenta", nome: "multiplicar", entrada: {} }, { tipo: "resposta", texto: "ok" });
    const r = await executarAgente({ decidir: r1.decidir, ferramentas, maxPassos: 5 });
    expect(r.historico).toEqual([{ tipo: "erro", nome: "multiplicar", entrada: {}, mensagem: "ferramenta desconhecida: multiplicar" }]);
    expect(r.motivo).toBe("respondeu");
  });

  it("erro dentro da ferramenta também vira evento, com a mensagem", async () => {
    const r1 = roteiro({ tipo: "ferramenta", nome: "falhar", entrada: null }, { tipo: "resposta", texto: "desisto" });
    const r = await executarAgente({ decidir: r1.decidir, ferramentas, maxPassos: 5 });
    expect(r.historico).toEqual([{ tipo: "erro", nome: "falhar", entrada: null, mensagem: "serviço fora do ar" }]);
  });

  it("para no limite de passos", async () => {
    const r1 = roteiro({ tipo: "ferramenta", nome: "somar", entrada: { a: 1, b: 1 } });
    const r = await executarAgente({ decidir: r1.decidir, ferramentas, maxPassos: 3 });
    expect(r.motivo).toBe("limite-de-passos");
    expect(r.resposta).toBeNull();
    expect(r.passos).toBe(3);
    expect(r.historico).toHaveLength(3);
  });
});
