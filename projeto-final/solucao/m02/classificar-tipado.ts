// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { gerarObjeto } from "@mentoria/llm";
import { NoObjectGeneratedError, type LanguageModel } from "ai";
import { z } from "zod";
import { CATEGORIAS, type Categoria, type Noticia } from "../../src/noticia.js";

export const SchemaClassificacao = z.object({
  relevante: z.boolean(),
  categoria: z.enum(CATEGORIAS).nullable(),
  confianca: z.number().min(0).max(1),
});

export interface Decisao {
  relevante: boolean;
  categoria: Categoria | null;
  confianca: number;
}

export interface OpcoesClassificarTipado {
  temperature?: number;
  /** Injetado nos testes (mock). Em uso real, fica vazio e o .env decide o modelo. */
  modelo?: LanguageModel;
  /** Troca o prompt (o Módulo 3 usa isso para comparar versões). Padrão: montarPromptTipado. */
  montarPrompt?: (noticia: Noticia) => { system: string; prompt: string };
}

export type ResultadoClassificacao =
  | { ok: true; decisao: Decisao }
  | { ok: false; motivo: "saida-invalida" | "inconsistente" };

export function montarPromptTipado(noticia: Noticia): { system: string; prompt: string } {
  const system = [
    "Você é editor de uma newsletter semanal sobre IA aplicada para desenvolvedores.",
    "Classifique a notícia:",
    "- relevante: true se ela ajuda um dev a construir, avaliar ou operar sistemas com IA. Fofoca, notícias sem relação com IA e anúncios sem conteúdo técnico ou prático são false.",
    `- categoria: se relevante, uma de: ${CATEGORIAS.join(", ")}. Use modelos para lançamentos e capacidades de modelos; ferramentas para bibliotecas, frameworks e práticas de engenharia; pesquisa para estudos e artigos científicos; regulacao para leis e regras; mercado para preços, negócios e casos de empresas. Se não for relevante, null.`,
    "- confianca: o quanto você tem certeza de que a classificação inteira (relevante e categoria) está correta, de 0 a 1. Use 0.5 quando estiver em dúvida entre duas opções e valores perto de 1 só quando não houver ambiguidade.",
  ].join("\n");
  const prompt = [`Título: ${noticia.titulo}`, `Resumo: ${noticia.resumo}`, `Fonte: ${noticia.fonte}`].join("\n");
  return { system, prompt };
}

export async function classificarTipado(
  noticia: Noticia,
  opcoes: OpcoesClassificarTipado = {},
): Promise<ResultadoClassificacao> {
  const { system, prompt } = (opcoes.montarPrompt ?? montarPromptTipado)(noticia);
  let objeto: z.infer<typeof SchemaClassificacao>;
  try {
    ({ objeto } = await gerarObjeto({
      schema: SchemaClassificacao,
      system,
      prompt,
      temperature: opcoes.temperature ?? 0,
      modelo: opcoes.modelo,
    }));
  } catch (erro) {
    if (NoObjectGeneratedError.isInstance(erro)) return { ok: false, motivo: "saida-invalida" };
    throw erro;
  }
  const categoria = objeto.relevante ? objeto.categoria : null;
  if (objeto.relevante && categoria === null) return { ok: false, motivo: "inconsistente" };
  return { ok: true, decisao: { relevante: objeto.relevante, categoria, confianca: objeto.confianca } };
}
