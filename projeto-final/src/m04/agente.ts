// ETAPA M4 — o agente: um loop em que o modelo decide quais fontes ler e o que avaliar.
// O agente PROPÕE a seleção; o código VALIDA antes de aceitar.
import { gerarComFerramentas, type ChamadaDeFerramenta } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import type { Avaliacao, Dependencias } from "./ferramentas.js";

export interface ResultadoDoAgente {
  /** Ids aceitos pelo código (ver validarSelecao). */
  selecao: string[];
  /** O que o agente entregou e o código recusou, com o motivo. */
  recusadas: { id: string; motivo: "nao-avaliada" | "nao-publicavel" }[];
  /** true se o agente chamou entregarSelecao; false se parou antes (ex.: limite de passos). */
  entregou: boolean;
  fontesLidas: string[];
  passos: number;
  chamadas: ChamadaDeFerramenta[];
}

/**
 * Regra do código sobre a proposta do agente:
 * - id que o agente não avaliou com avaliarNoticias → recusado "nao-avaliada"
 *   (ele pode ter inventado ou só lido o título);
 * - id avaliado com ação diferente de "publicar" → recusado "nao-publicavel";
 * - o resto é aceito, na ordem em que o agente entregou, sem repetir ids.
 */
export function validarSelecao(
  propostos: string[],
  avaliacoes: Map<string, Avaliacao>,
): { selecao: string[]; recusadas: ResultadoDoAgente["recusadas"] } {
  throw new Error("TODO (M4): implemente validarSelecao");
}

/** Instruções do agente (fornecidas; experimente mudar e medir com m04:comparar). */
export const INSTRUCOES_DO_AGENTE = [
  "Você monta a seleção semanal de uma newsletter sobre IA aplicada para desenvolvedores.",
  "1. Use listarFontes para ver as fontes e as descrições.",
  "2. Leia com lerFonte só as fontes que podem ter notícias úteis para devs que constroem com IA.",
  "3. Avalie as notícias promissoras com avaliarNoticias (pode mandar várias de uma vez).",
  "4. Entregue com entregarSelecao os ids cuja avaliação foi \"publicar\".",
  "Não invente ids: use só os que as ferramentas devolveram.",
].join("\n");

/**
 * Roda o agente:
 * 1. cria as ferramentas com criarFerramentas(deps);
 * 2. chama gerarComFerramentas (de @mentoria/llm) com INSTRUCOES_DO_AGENTE como system, um prompt
 *    pedindo a seleção da semana, temperature 0, maxPassos (padrão 12) e pararAoChamar "entregarSelecao";
 * 3. valida o que foi entregue com validarSelecao (se nada foi entregue, a seleção é vazia).
 */
export async function curarComAgente(
  deps: Dependencias,
  opcoes: { modelo?: LanguageModel; maxPassos?: number } = {},
): Promise<ResultadoDoAgente> {
  throw new Error("TODO (M4): implemente curarComAgente");
}
