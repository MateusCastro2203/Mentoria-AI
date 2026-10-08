// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { Acao } from "../m03/guardrails.js";
import type { Fonte, Noticia } from "../../src/noticia.js";

export interface Avaliacao {
  id: string;
  acao: Acao;
  categoria: string | null;
  confianca: number | null;
  motivos: string[];
}

export interface Registro {
  fontesLidas: string[];
  avaliacoes: Map<string, Avaliacao>;
  selecaoEntregue: string[] | null;
}

export interface Dependencias {
  fontes: Fonte[];
  noticias: Noticia[];
  avaliar: (noticia: Noticia) => Promise<Avaliacao>;
}

export function criarFerramentas(deps: Dependencias): { ferramentas: ToolSet; registro: Registro } {
  const registro: Registro = { fontesLidas: [], avaliacoes: new Map(), selecaoEntregue: null };
  const porId = new Map(deps.noticias.map((n) => [n.id, n]));

  const ferramentas = {
    listarFontes: tool({
      description: "Lista as fontes de notícias disponíveis, com descrição e quantidade de notícias.",
      inputSchema: z.object({}),
      execute: async () => deps.fontes.map((f) => ({ nome: f.nome, descricao: f.descricao, quantidade: f.noticias.length })),
    }),
    lerFonte: tool({
      description: "Lê uma fonte e devolve id e título de cada notícia publicada nela.",
      inputSchema: z.object({ fonte: z.string().describe("nome da fonte, como em listarFontes") }),
      execute: async ({ fonte }) => {
        const encontrada = deps.fontes.find((f) => f.nome === fonte);
        if (!encontrada) return { erro: `fonte desconhecida: ${fonte}` };
        if (!registro.fontesLidas.includes(fonte)) registro.fontesLidas.push(fonte);
        return encontrada.noticias.flatMap((id) => {
          const n = porId.get(id);
          return n ? [{ id, titulo: n.titulo }] : [];
        });
      },
    }),
    avaliarNoticias: tool({
      description: "Classifica as notícias e aplica as regras de publicação. Devolve, para cada id, a ação: publicar, revisar ou descartar.",
      inputSchema: z.object({ ids: z.array(z.string()).describe("ids devolvidos por lerFonte") }),
      execute: async ({ ids }) => {
        const resultado: (Avaliacao | { id: string; erro: string })[] = [];
        for (const id of ids) {
          const guardada = registro.avaliacoes.get(id);
          if (guardada) {
            resultado.push(guardada);
            continue;
          }
          const n = porId.get(id);
          if (!n) {
            resultado.push({ id, erro: "notícia desconhecida" });
            continue;
          }
          const avaliacao = await deps.avaliar(n);
          registro.avaliacoes.set(id, avaliacao);
          resultado.push(avaliacao);
        }
        return resultado;
      },
    }),
    entregarSelecao: tool({
      description: "Entrega a seleção final da semana: os ids das notícias que devem ser publicadas.",
      inputSchema: z.object({ ids: z.array(z.string()) }),
      execute: async ({ ids }) => {
        registro.selecaoEntregue = ids;
        return { recebidos: ids.length };
      },
    }),
  };
  return { ferramentas, registro };
}
