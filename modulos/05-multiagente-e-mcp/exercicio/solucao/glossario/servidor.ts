// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { z } from "zod";
import { normalizar } from "../../src/glossario/conectar.js";
import { TERMOS, type Termo } from "../../src/glossario/termos.js";

const texto = (t: string) => [{ type: "text" as const, text: t }];

export function criarServidorGlossario(termos: Termo[] = TERMOS): McpServer {
  const achar = (nome: string) => termos.find((t) => normalizar(t.termo) === normalizar(nome));
  const servidor = new McpServer({ name: "glossario-ia", version: "1.0.0" });

  servidor.registerTool(
    "buscar_termo",
    {
      description: "Busca a definição de um termo do glossário de IA da mentoria.",
      inputSchema: z.object({ termo: z.string() }),
      annotations: { readOnlyHint: true },
    },
    async ({ termo }) => {
      const t = achar(termo);
      if (!t) return { isError: true, content: texto(`termo não encontrado: ${termo}`) };
      const dados = { termo: t.termo, definicao: t.definicao, modulo: t.modulo };
      return { content: texto(JSON.stringify(dados)), structuredContent: dados };
    },
  );

  servidor.registerTool(
    "listar_termos",
    {
      description: "Lista os termos do glossário, opcionalmente filtrando por prefixo.",
      inputSchema: z.object({ prefixo: z.string().optional() }),
      annotations: { readOnlyHint: true },
    },
    async ({ prefixo }) => {
      const nomes = termos
        .map((t) => t.termo)
        .filter((n) => !prefixo || normalizar(n).startsWith(normalizar(prefixo)))
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
      const dados = { termos: nomes };
      return { content: texto(JSON.stringify(dados)), structuredContent: dados };
    },
  );

  servidor.registerResource(
    "termo",
    new ResourceTemplate("glossario://{termo}", { list: undefined }),
    { description: "Um termo do glossário em markdown.", mimeType: "text/markdown" },
    async (uri, { termo }) => {
      const t = achar(decodeURIComponent(String(termo)));
      if (!t) throw new Error(`termo não encontrado: ${String(termo)}`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: `# ${t.termo}\n\n${t.definicao}\n\nMódulo ${t.modulo}` }] };
    },
  );

  servidor.registerPrompt(
    "explicar_termo",
    {
      description: "Pede uma explicação de um termo para um público específico.",
      argsSchema: z.object({ termo: z.string(), publico: z.string() }),
    },
    ({ termo, publico }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Explique ${termo} para ${publico}, com uma analogia. Definição de referência: ${achar(termo)?.definicao ?? "não encontrada"}`,
          },
        },
      ],
    }),
  );

  return servidor;
}
