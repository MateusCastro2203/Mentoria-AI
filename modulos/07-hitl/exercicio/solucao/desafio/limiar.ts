// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
import type { PontoDaCurva, Registro } from "../../src/desafio/limiar.js";

export type { PontoDaCurva, Registro };

export function curvaDeLimiar(historico: Registro[]): PontoDaCurva[] {
  const limiares = [...new Set(historico.map((r) => r.confianca))].sort((a, b) => b - a);
  return limiares.map((limiar) => {
    const acima = historico.filter((r) => r.confianca >= limiar);
    return { limiar, cobertura: acima.length / historico.length, precisao: acima.filter((r) => r.correto).length / acima.length };
  });
}

export function escolherLimiar(historico: Registro[], precisaoMinima: number): PontoDaCurva | null {
  const bons = curvaDeLimiar(historico).filter((p) => p.precisao >= precisaoMinima);
  return bons.at(-1) ?? null;
}
