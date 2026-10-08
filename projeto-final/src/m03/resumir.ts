// ETAPA M3 — resumo para a newsletter. Avaliado nas evals por um "juiz" LLM (fidelidade ao original).
import { gerarTexto } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import type { Noticia } from "../noticia.js";

export const LIMITE_RESUMO = 280;

/**
 * Resume a notícia em português, em no máximo 2 frases, usando SÓ as informações do título e do
 * resumo originais (nada de números, nomes ou opiniões que não estejam lá).
 * - chama `gerarTexto` com `temperature` (padrão 0);
 * - devolve o texto sem espaços nas pontas e com espaços/quebras de linha internos colapsados em um espaço;
 * - se passar de LIMITE_RESUMO caracteres, corta em LIMITE_RESUMO − 1 e termina com "…"
 *   (o resultado final tem exatamente LIMITE_RESUMO caracteres).
 */
export async function resumir(
  noticia: Noticia,
  opcoes: { temperature?: number; modelo?: LanguageModel } = {},
): Promise<string> {
  throw new Error("TODO (M3): implemente resumir");
}
