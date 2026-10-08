// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { gerarTexto } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import type { Noticia } from "../../src/noticia.js";

export const LIMITE_RESUMO = 280;

export async function resumir(
  noticia: Noticia,
  opcoes: { temperature?: number; modelo?: LanguageModel } = {},
): Promise<string> {
  const { texto } = await gerarTexto({
    system: [
      "Você escreve resumos para uma newsletter sobre IA aplicada para desenvolvedores.",
      "Escreva em português, em no máximo 2 frases.",
      "Use SOMENTE informações presentes no título e no resumo fornecidos: não acrescente números, nomes, datas, opiniões ou conclusões que não estejam lá.",
      "Responda só com o resumo.",
    ].join("\n"),
    prompt: `Título: ${noticia.titulo}\nResumo: ${noticia.resumo}`,
    temperature: opcoes.temperature ?? 0,
    modelo: opcoes.modelo,
  });
  const limpo = texto.trim().replace(/\s+/g, " ");
  return limpo.length > LIMITE_RESUMO ? `${limpo.slice(0, LIMITE_RESUMO - 1)}…` : limpo;
}
