// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { z } from "zod";
import { carregarFontes, type Fonte } from "../../src/noticia.js";
import { lerRss, type ItemRss } from "../../src/m05/rss.js";

export const PASTA_RSS = fileURLToPath(new URL("../../../dados/rss/", import.meta.url));

const resultado = (dados: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(dados) }],
  structuredContent: dados,
});

export function criarServidorFontes(opcoes: { pastaRss?: string; fontes?: Fonte[] } = {}): McpServer {
  const pasta = opcoes.pastaRss ?? PASTA_RSS;
  const fontes = opcoes.fontes ?? carregarFontes();
  const lerFeed = (nome: string): ItemRss[] => lerRss(readFileSync(join(pasta, `${nome}.xml`), "utf8"));
  const acharNoticia = (id: string) => {
    for (const f of fontes) {
      const item = lerFeed(f.nome).find((i) => i.id === id);
      if (item) return item;
    }
    return undefined;
  };

  const servidor = new McpServer({ name: "curador-fontes", version: "1.0.0" });

  servidor.registerTool(
    "listar_fontes",
    {
      description: "Lista as fontes de notícias disponíveis, com descrição e quantidade de itens.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => resultado({ fontes: fontes.map((f) => ({ nome: f.nome, descricao: f.descricao, quantidade: f.noticias.length })) }),
  );

  servidor.registerTool(
    "ler_fonte",
    {
      description: "Lê o feed RSS de uma fonte e devolve id, título, URL e data de cada notícia.",
      inputSchema: z.object({ fonte: z.string().describe("nome da fonte, como em listar_fontes") }),
      annotations: { readOnlyHint: true },
    },
    async ({ fonte }) => {
      if (!fontes.some((f) => f.nome === fonte)) {
        return { isError: true, content: [{ type: "text" as const, text: `fonte desconhecida: ${fonte}` }] };
      }
      const itens = lerFeed(fonte).map(({ id, titulo, url, publicadaEm }) => ({ id, titulo, url, publicadaEm }));
      return resultado({ itens });
    },
  );

  servidor.registerResource(
    "noticia",
    new ResourceTemplate("noticia://{id}", { list: undefined }),
    { description: "Uma notícia completa (com o resumo), em JSON.", mimeType: "application/json" },
    async (uri, { id }) => {
      const item = acharNoticia(String(id));
      if (!item) throw new Error(`notícia desconhecida: ${String(id)}`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(item) }] };
    },
  );

  servidor.registerPrompt(
    "classificar_noticia",
    { description: "Pede a classificação de uma notícia para a newsletter.", argsSchema: z.object({ id: z.string() }) },
    ({ id }) => {
      const item = acharNoticia(id);
      const texto = item
        ? `Classifique esta notícia para a newsletter de IA aplicada para devs.\nTítulo: ${item.titulo}\nResumo: ${item.resumo}\nFonte: ${item.fonte}`
        : `Notícia ${id} não encontrada.`;
      return { messages: [{ role: "user" as const, content: { type: "text" as const, text: texto } }] };
    },
  );

  return servidor;
}
