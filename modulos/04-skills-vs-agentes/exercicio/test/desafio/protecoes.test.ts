import { describe, expect, it } from "vitest";
import { executarAgenteProtegido } from "../../src/desafio/protecoes.js";
import type { Acao } from "../../src/loop.js";

const sempre = (acao: Acao) => () => acao;
const sequencia = (...acoes: Acao[]) => {
  let i = 0;
  return () => acoes[Math.min(i++, acoes.length - 1)]!;
};
let execucoes = 0;
const ferramentas = {
  buscar: (e: unknown) => {
    execucoes++;
    return `resultado de ${JSON.stringify(e)}`;
  },
  caro: () => "ok",
};

describe("desafio · executarAgenteProtegido", () => {
  it("para quando o modelo repete a mesma chamada, antes de executar a repetição", async () => {
    execucoes = 0;
    const r = await executarAgenteProtegido({
      decidir: sempre({ tipo: "ferramenta", nome: "buscar", entrada: { q: "x" } }),
      ferramentas,
      maxPassos: 10,
      maxRepeticoes: 3,
      orcamento: 100,
    });
    expect(r.motivo).toBe("repeticao");
    expect(execucoes).toBe(2);
    expect(r.passos).toBe(3);
  });

  it("entradas diferentes não contam como repetição", async () => {
    const r = await executarAgenteProtegido({
      decidir: sequencia(
        { tipo: "ferramenta", nome: "buscar", entrada: { q: "a" } },
        { tipo: "ferramenta", nome: "buscar", entrada: { q: "b" } },
        { tipo: "ferramenta", nome: "buscar", entrada: { q: "a" } },
        { tipo: "resposta", texto: "pronto" },
      ),
      ferramentas,
      maxPassos: 10,
      maxRepeticoes: 2,
      orcamento: 100,
    });
    expect(r.motivo).toBe("respondeu");
    expect(r.custo).toBe(3);
  });

  it("para quando a próxima ferramenta estouraria o orçamento", async () => {
    const r = await executarAgenteProtegido({
      decidir: sequencia(
        { tipo: "ferramenta", nome: "buscar", entrada: 1 },
        { tipo: "ferramenta", nome: "caro", entrada: 2 },
        { tipo: "resposta", texto: "não chega aqui" },
      ),
      ferramentas,
      maxPassos: 10,
      maxRepeticoes: 5,
      orcamento: 5,
      custos: { caro: 10 },
    });
    expect(r.motivo).toBe("orcamento");
    expect(r.custo).toBe(1);
    expect(r.historico).toHaveLength(1);
  });
});
