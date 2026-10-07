// ETAPA M2 — decisão tipada com confiança (estilo System One, simulado com um LLM comum).
// Em vez de texto livre, o modelo devolve um objeto validado por Zod. O código fica no controle:
// regras de consistência e o que fazer quando a saída é inválida são decididas aqui, não pelo modelo.
import { gerarObjeto } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import { z } from "zod";
import { CATEGORIAS, type Categoria, type Noticia } from "../noticia.js";

/**
 * Schema da resposta do modelo:
 * - relevante: boolean
 * - categoria: uma de CATEGORIAS, ou null
 * - confianca: número de 0 a 1 (inclusive)
 */
export const SchemaClassificacao = z.object({
  // TODO (M2): defina os três campos.
});

export interface Decisao {
  relevante: boolean;
  categoria: Categoria | null;
  confianca: number;
}

export type ResultadoClassificacao =
  | { ok: true; decisao: Decisao }
  | { ok: false; motivo: "saida-invalida" | "inconsistente" };

/**
 * Monta o prompt da classificação tipada.
 * - `system` explica o critério de relevância, cita TODAS as categorias, diz que `categoria` é null
 *   quando a notícia não é relevante e explica o que é `confianca` (a certeza de que a classificação
 *   INTEIRA está correta, não a chance de a notícia ser relevante).
 * - `prompt` traz título, resumo e fonte.
 */
export function montarPromptTipado(noticia: Noticia): { system: string; prompt: string } {
  throw new Error("TODO (M2): implemente montarPromptTipado");
}

/**
 * Classifica com saída estruturada:
 * 1. chama `gerarObjeto` (de @mentoria/llm) com o schema, o prompt e `temperature` (padrão 0);
 * 2. se o modelo não respeitar o schema (gerarObjeto lança NoObjectGeneratedError), devolve
 *    { ok: false, motivo: "saida-invalida" } — outros erros (ex.: rede) devem continuar sendo lançados;
 * 3. se `relevante` for false, força `categoria` para null (regra determinística, no código);
 * 4. se `relevante` for true e `categoria` vier null, devolve { ok: false, motivo: "inconsistente" };
 * 5. senão, { ok: true, decisao }.
 */
export async function classificarTipado(
  noticia: Noticia,
  opcoes: { temperature?: number; modelo?: LanguageModel } = {},
): Promise<ResultadoClassificacao> {
  throw new Error("TODO (M2): implemente classificarTipado");
}
