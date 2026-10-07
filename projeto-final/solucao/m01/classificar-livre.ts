// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

// ETAPA M1 — classificação em texto livre.
// Um prompt pede ao modelo para dizer se a notícia é relevante para a newsletter e em que
// categoria ela entra. A resposta é TEXTO: no Módulo 2 você vai sentir na pele o que isso custa.
import { gerarTexto } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import { CATEGORIAS, type Noticia } from "../../src/noticia.js";

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
  const system = [
    "Você é editor de uma newsletter semanal sobre IA aplicada para desenvolvedores.",
    "Uma notícia é relevante quando ajuda um dev a construir, avaliar ou operar sistemas com IA.",
    "Fofoca de mercado, notícias sem relação com IA e anúncios sem conteúdo técnico ou prático não são relevantes.",
    `Se for relevante, escolha uma categoria entre: ${CATEGORIAS.join(", ")}.`,
    "Responda dizendo se a notícia é relevante e, se for, a categoria, com uma frase de justificativa.",
  ].join("\n");
  const prompt = [`Título: ${noticia.titulo}`, `Resumo: ${noticia.resumo}`, `Fonte: ${noticia.fonte}`].join("\n");
  return { system, prompt };
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
  const { system, prompt } = montarPromptClassificacao(noticia);
  const { texto } = await gerarTexto({ system, prompt, temperature: opcoes.temperature, modelo: opcoes.modelo });
  return texto.trim();
}
