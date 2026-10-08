// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CATEGORIAS } from "../../src/noticia.js";

export interface ItemEdicao {
  id: string;
  titulo: string;
  categoria: string;
  resumo: string;
  url: string;
}

export function montarMarkdown(titulo: string, itens: ItemEdicao[]): string {
  const linhas = [`# ${titulo}`, ""];
  const secoes: [string, ItemEdicao[]][] = CATEGORIAS.map((c) => [c, itens.filter((i) => i.categoria === c)]);
  secoes.push(["outros", itens.filter((i) => !(CATEGORIAS as readonly string[]).includes(i.categoria))]);
  for (const [categoria, doGrupo] of secoes) {
    if (doGrupo.length === 0) continue;
    linhas.push(`## ${categoria}`, "", ...doGrupo.map((i) => `- **[${i.titulo}](${i.url})**: ${i.resumo}`), "");
  }
  return linhas.join("\n");
}

const ItemSchema = z.object({ id: z.string(), titulo: z.string(), categoria: z.string(), resumo: z.string(), url: z.string() });

export function criarServidorEdicao(opcoes: { pasta: string }): McpServer {
  const arquivo = join(opcoes.pasta, "edicao.md");
  const servidor = new McpServer({ name: "curador-edicao", version: "1.0.0" });

  servidor.registerTool(
    "publicar_edicao",
    {
      description: "Grava a edição da newsletter em markdown. Só aceita itens com fonte https.",
      inputSchema: z.object({ titulo: z.string(), itens: z.array(ItemSchema) }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ titulo, itens }) => {
      const semFonte = itens.find((i) => !i.url.startsWith("https://"));
      if (semFonte) return { isError: true, content: [{ type: "text" as const, text: `item ${semFonte.id} sem fonte https` }] };
      mkdirSync(opcoes.pasta, { recursive: true });
      writeFileSync(arquivo, montarMarkdown(titulo, itens));
      const dados = { arquivo, itens: itens.length };
      return { content: [{ type: "text" as const, text: JSON.stringify(dados) }], structuredContent: dados };
    },
  );

  servidor.registerResource(
    "edicao",
    "edicao://ultima",
    { description: "A última edição publicada, em markdown.", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "nenhuma edição publicada" },
      ],
    }),
  );

  return servidor;
}
