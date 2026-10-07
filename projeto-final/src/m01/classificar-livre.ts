// ETAPA M1 — classificação em texto livre.
// Um prompt pede ao modelo para dizer se a notícia é relevante para a newsletter e em que
// categoria ela entra. A resposta é TEXTO: no Módulo 2 você vai sentir na pele o que isso custa.
import { gerarTexto } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import { CATEGORIAS, type Noticia } from "../noticia.js";

export interface PromptClassificacao {
  /** Instruções fixas: papel, critério de relevância e a lista de categorias. */
  system: string;
  /** A notícia a classificar: título, resumo e fonte. */
  prompt: string;
}

/**
 * Monta o prompt de classificação.
 * - `system` deve citar TODAS as categorias de `CATEGORIAS` e explicar o critério de relevância
 *   (veja dados/README.md).
 * - `prompt` deve conter o título, o resumo e a fonte da notícia.
 */
export function montarPromptClassificacao(noticia: Noticia): PromptClassificacao {
  throw new Error("TODO (M1): implemente montarPromptClassificacao");
}

export interface OpcoesClassificacao {
  temperature?: number;
  /** Injetado nos testes (mock). Em uso real, fica vazio e o .env decide o modelo. */
  modelo?: LanguageModel;
}

/**
 * Classifica a notícia em texto livre: monta o prompt, chama `gerarTexto` (de @mentoria/llm)
 * repassando `temperature` e `modelo`, e devolve a resposta sem espaços nas pontas.
 */
export async function classificarLivre(noticia: Noticia, opcoes: OpcoesClassificacao = {}): Promise<string> {
  throw new Error("TODO (M1): implemente classificarLivre");
}
