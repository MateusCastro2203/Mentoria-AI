// Fornecido: os papéis do time com LLM de verdade. Usa o SEU código das etapas anteriores
// (skill, guardrails) e o SEU adaptador MCP. Leia: cada papel é pequeno e tem um trabalho só.
import type { Client } from "@modelcontextprotocol/client";
import { gerarComFerramentas, gerarObjeto, gerarTexto, type ChamadaDeFerramenta } from "@mentoria/llm";
import { tool } from "ai";
import { z } from "zod";
import { decidirPublicacao } from "../m03/guardrails.js";
import { classificarComSkill } from "../m04/skill.js";
import type { Noticia } from "../noticia.js";
import { ferramentasDoMcp } from "./mcp-para-ai-sdk.js";
import type { ItemRss } from "./rss.js";
import type { ItemAvaliado, Papeis } from "./time.js";

const LIMITE = 280;
const contarFrases = (t: string) => (t.match(/[.!?…](\s|$)/g) ?? []).length;

export async function criarPapeis(opcoes: { clienteFontes: Client; maxPassosColetor?: number }) {
  const { clienteFontes } = opcoes;
  const trajetoriaDoColetor: ChamadaDeFerramenta[] = [];
  const cache = new Map<string, ItemRss>();

  async function noticia(id: string): Promise<ItemRss> {
    if (!cache.has(id)) {
      const r = await clienteFontes.readResource({ uri: `noticia://${id}` });
      cache.set(id, JSON.parse((r.contents[0] as { text: string }).text));
    }
    return cache.get(id)!;
  }

  const papeis: Papeis = {
    // COLETOR — um agente: decide quais fontes ler (ferramentas do servidor MCP de fontes).
    async coletar() {
      let entregues: string[] = [];
      const vistos = new Set<string>();
      const doMcp = await ferramentasDoMcp(clienteFontes, { permitidas: ["listar_fontes", "ler_fonte"] });
      const r = await gerarComFerramentas({
        system: [
          "Você é o COLETOR de uma newsletter sobre IA aplicada para desenvolvedores. Outro agente classifica depois.",
          "1. Use listar_fontes. 2. Leia com ler_fonte as fontes que podem ter notícias sobre IA para devs.",
          "3. Chame entregar_candidatos UMA vez com os ids de todas as notícias das fontes que você leu.",
          "Use só ids devolvidos por ler_fonte.",
        ].join("\n"),
        prompt: "Colete as candidatas desta semana.",
        temperature: 0,
        maxPassos: opcoes.maxPassosColetor ?? 14,
        pararAoChamar: "entregar_candidatos",
        ferramentas: {
          ...doMcp,
          entregar_candidatos: tool({
            description: "Entrega os ids candidatos para o classificador.",
            inputSchema: z.object({ ids: z.array(z.string()) }),
            execute: async ({ ids }) => {
              entregues = ids;
              return { recebidos: ids.length };
            },
          }),
        },
      });
      trajetoriaDoColetor.push(...r.chamadas);
      for (const c of r.chamadas.filter((c) => c.ferramenta === "ler_fonte")) {
        for (const i of (c.saida as { itens?: { id: string }[] }).itens ?? []) vistos.add(i.id);
      }
      // O agente propõe; o código decide: só ids que vieram de ler_fonte.
      return entregues.filter((id) => vistos.has(id));
    },

    // CLASSIFICADOR — decisão estruturada com a skill + guardrails.
    async classificar(id) {
      const item = await noticia(id);
      const n: Noticia = { id: item.id, titulo: item.titulo, resumo: item.resumo, fonte: item.fonte, url: item.url, publicadaEm: item.publicadaEm };
      const resultado = await classificarComSkill(n);
      const { acao } = decidirPublicacao(n, resultado);
      const avaliado: ItemAvaliado = {
        id,
        titulo: item.titulo,
        url: item.url,
        acao,
        categoria: resultado.ok ? resultado.decisao.categoria : null,
        confianca: resultado.ok ? resultado.decisao.confianca : null,
      };
      return avaliado;
    },

    // REDATOR — texto curto, só com fatos do original; usa o motivo do revisor na 2ª tentativa.
    async redigir(id, feedback) {
      const item = await noticia(id);
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
    },

    // REVISOR — primeiro o que o código checa; depois um juiz LLM só para a fidelidade.
    async revisar(id, resumo) {
      if (resumo.length > LIMITE) return { aprovado: false, motivo: `passou de ${LIMITE} caracteres` };
      if (contarFrases(resumo) > 2) return { aprovado: false, motivo: "tem mais de duas frases" };
      const item = await noticia(id);
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
    },
  };

  return { papeis, trajetoriaDoColetor };
}
