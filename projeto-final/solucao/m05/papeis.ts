// Cópia de src/m05/papeis.ts (fornecido) apontando para as soluções de referência, para os scripts *:solucao.
import type { Client } from "@modelcontextprotocol/client";
import { gerarComFerramentas, type ChamadaDeFerramenta } from "@mentoria/llm";
import { tool } from "ai";
import { z } from "zod";
import { decidirPublicacao } from "../m03/guardrails.js";
import { classificarComSkill } from "../m04/skill.js";
import type { Noticia } from "../../src/noticia.js";
import { ferramentasDoMcp } from "./mcp-para-ai-sdk.js";
import type { ItemRss } from "../../src/m05/rss.js";
import type { ItemAvaliado, Papeis } from "./time.js";
import { redigirResumo, revisarResumo } from "../../src/m05/redator-revisor.js";


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

    // REDATOR e REVISOR — as funções ficam fora para a versão agendada (M8) reaproveitar.
    redigir: async (id, feedback) => redigirResumo(await noticia(id), feedback),
    revisar: async (id, resumo) => revisarResumo(await noticia(id), resumo),
  };

  return { papeis, trajetoriaDoColetor };
}
