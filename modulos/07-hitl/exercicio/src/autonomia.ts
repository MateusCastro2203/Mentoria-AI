import type { Analise, Nivel, Pedido, Politica } from "./estado.js";
import { POLITICA_PADRAO } from "./estado.js";

/**
 * O NÍVEL DE AUTONOMIA de cada pedido (quanto o assistente pode fazer sozinho):
 * - valor do pedido acima de `limiteAprovacao` → "bloqueado" (escala para outra equipe);
 * - sugestão "reembolsar", valor do pedido até `limiteAutomatico` e confiança ≥ `confiancaMinima`
 *   → "automatico" (paga sozinho);
 * - qualquer outro caso (inclusive toda sugestão de "negar") → "aprovacao" (uma pessoa decide).
 * `politica` pode vir parcial: o que faltar vem de POLITICA_PADRAO.
 */
export function nivelDeAutonomia(pedido: Pedido, analise: Analise, politica: Partial<Politica> = {}): Nivel {
  throw new Error("TODO: implemente nivelDeAutonomia");
}

export { POLITICA_PADRAO };
