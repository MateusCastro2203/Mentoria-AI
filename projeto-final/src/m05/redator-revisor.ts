// Fornecido: o REDATOR e o REVISOR do time (M5), como funções. Os papéis da M5 e a versão agendada
// da M8 (Cloudflare Workers) usam as mesmas, então o texto da newsletter não muda de um lugar para outro.
import { gerarObjeto, gerarTexto } from "@mentoria/llm";
import { z } from "zod";
import type { ItemRss } from "./rss.js";

const LIMITE = 280;
const contarFrases = (t: string) => (t.match(/[.!?…](\s|$)/g) ?? []).length;

export type Original = Pick<ItemRss, "titulo" | "resumo">;

/** REDATOR — texto curto, só com fatos do original; usa o motivo do revisor na 2ª tentativa. */
export async function redigirResumo(item: Original, feedback?: string): Promise<string> {
  const { texto } = await gerarTexto({
    system: [
      "Você escreve resumos para uma newsletter sobre IA aplicada para desenvolvedores.",
      "Português, no máximo 2 frases. Use SOMENTE informações do título e do resumo fornecidos.",
      "Responda só com o resumo.",
      ...(feedback ? [`A versão anterior foi reprovada pelo revisor: ${feedback}. Corrija isso.`] : []),
    ].join("\n"),
    prompt: `Título: ${item.titulo}\nResumo: ${item.resumo}`,
    temperature: 0,
  });
  const limpo = texto.trim().replace(/\s+/g, " ");
  return limpo.length > LIMITE ? `${limpo.slice(0, LIMITE - 1)}…` : limpo;
}

/** REVISOR — primeiro o que o código checa; depois um juiz LLM só para a fidelidade. */
export async function revisarResumo(item: Original, resumo: string): Promise<{ aprovado: boolean; motivo: string }> {
  if (resumo.length > LIMITE) return { aprovado: false, motivo: `passou de ${LIMITE} caracteres` };
  if (contarFrases(resumo) > 2) return { aprovado: false, motivo: "tem mais de duas frases" };
  const { objeto } = await gerarObjeto({
    schema: z.object({ motivo: z.string(), aprovado: z.boolean() }),
    temperature: 0,
    prompt: [
      `Notícia original. Título: "${item.titulo}". Resumo: "${item.resumo}"`,
      `Resumo a avaliar: "${resumo}"`,
      "Critério: o resumo só pode conter informações presentes na notícia original. Reprove se acrescentar números, nomes ou afirmações que não estejam lá. Omitir detalhes é permitido.",
    ].join("\n"),
  });
  return objeto;
}
