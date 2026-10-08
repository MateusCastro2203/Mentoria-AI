import { describe, expect, it } from "vitest";
import { CASOS_DA_AULA } from "../src/casos.js";
import { recomendarAbordagem, type Caso } from "../src/framework.js";

const base: Caso = { saida: "texto", passos: "fixos", precisaDeFerramentas: false, reuso: "pontual", conhecimentoEspecifico: false, volumeAlto: false };

describe("recomendarAbordagem", () => {
  it.each(CASOS_DA_AULA.map((c) => [c.id, c.caso, c.esperado] as const))("caso da aula %s → %s", (_id, caso, esperado) => {
    expect(recomendarAbordagem(caso).abordagem).toBe(esperado);
  });

  it("agente exige passos variáveis E ferramentas", () => {
    expect(recomendarAbordagem({ ...base, passos: "variaveis" }).abordagem).not.toBe("agente");
    expect(recomendarAbordagem({ ...base, precisaDeFerramentas: true }).abordagem).not.toBe("agente");
    expect(recomendarAbordagem({ ...base, passos: "variaveis", precisaDeFerramentas: true }).abordagem).toBe("agente");
  });

  it("uma decisão que precisa investigar com ferramentas vira agente (a regra 1 vem antes)", () => {
    expect(recomendarAbordagem({ ...base, saida: "decisao", passos: "variaveis", precisaDeFerramentas: true }).abordagem).toBe("agente");
  });

  it("decisão com passos fixos é decisão estruturada, mesmo recorrente e com conhecimento", () => {
    expect(recomendarAbordagem({ ...base, saida: "decisao", reuso: "recorrente", conhecimentoEspecifico: true }).abordagem).toBe(
      "decisao-estruturada",
    );
  });

  it("conhecimento específico sozinho já pede skill", () => {
    expect(recomendarAbordagem({ ...base, conhecimentoEspecifico: true }).abordagem).toBe("skill");
  });

  it("os motivos citam o critério e o alto volume quando houver", () => {
    const r = recomendarAbordagem({ ...base, passos: "variaveis", precisaDeFerramentas: true, volumeAlto: true });
    expect(r.motivos).toHaveLength(2);
    expect(r.motivos[0]).toMatch(/passos vari/i);
    expect(r.motivos[1]).toBe("alto volume: custo e latência por chamada pesam");
    expect(recomendarAbordagem(base).motivos).toHaveLength(1);
  });
});
