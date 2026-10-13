import { describe, expect, it } from "vitest";
import { nivelDeAutonomia } from "../src/autonomia.js";
import { analise } from "./apoio.js";

const pedido = (valor: number) => ({ cliente: "c", valor, motivo: "m" });

describe("nivelDeAutonomia", () => {
  it("pequeno, confiante e a favor do cliente → automático", () => {
    expect(nivelDeAutonomia(pedido(80), analise("reembolsar", 80, 0.95))).toBe("automatico");
    expect(nivelDeAutonomia(pedido(100), analise("reembolsar", 100, 0.9))).toBe("automatico");
  });

  it("confiança baixa, valor médio ou sugestão de negar → aprovação humana", () => {
    expect(nivelDeAutonomia(pedido(80), analise("reembolsar", 80, 0.89))).toBe("aprovacao");
    expect(nivelDeAutonomia(pedido(101), analise("reembolsar", 101, 0.99))).toBe("aprovacao");
    expect(nivelDeAutonomia(pedido(50), analise("negar", 0, 0.99))).toBe("aprovacao");
    expect(nivelDeAutonomia(pedido(2000), analise("reembolsar", 2000, 0.99))).toBe("aprovacao");
  });

  it("acima do limite de aprovação → bloqueado (escala)", () => {
    expect(nivelDeAutonomia(pedido(2000.01), analise("reembolsar", 2000, 0.99))).toBe("bloqueado");
  });

  it("a política é configurável e parcial", () => {
    expect(nivelDeAutonomia(pedido(300), analise("reembolsar", 300, 0.95), { limiteAutomatico: 500 })).toBe("automatico");
    expect(nivelDeAutonomia(pedido(80), analise("reembolsar", 80, 0.95), { confiancaMinima: 0.99 })).toBe("aprovacao");
    expect(nivelDeAutonomia(pedido(600), analise("reembolsar", 600, 0.95), { limiteAprovacao: 500 })).toBe("bloqueado");
  });
});
