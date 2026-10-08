// ETAPA M5 — servidor MCP de FONTES: expõe os feeds RSS para qualquer cliente MCP
// (o nosso time de agentes, um agente de código, o MCP Inspector…).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { z } from "zod";
import { carregarFontes, type Fonte } from "../noticia.js";
import { lerRss } from "./rss.js";

export const PASTA_RSS = fileURLToPath(new URL("../../../dados/rss/", import.meta.url));

/**
 * Cria o servidor "curador-fontes" (versão "1.0.0") com:
 *
 * TOOLS (as duas com annotations { readOnlyHint: true }):
 * - listar_fontes (sem entrada) → structuredContent { fontes: [{ nome, descricao, quantidade }] }
 * - ler_fonte ({ fonte: string }) → lê `<pastaRss>/<fonte>.xml` com lerRss e devolve
 *   structuredContent { itens: [{ id, titulo, url, publicadaEm }] }.
 *   Fonte que não está em `fontes` → { isError: true, content: [{ type: "text", text: "fonte desconhecida: <nome>" }] }
 *   (nunca leia um arquivo cujo nome veio do modelo sem antes checar se a fonte existe).
 * Em todo resultado de sucesso, mande também content: [{ type: "text", text: JSON.stringify(structuredContent) }].
 *
 * RESOURCE (template "noticia://{id}", nome "noticia"):
 * - devolve contents: [{ uri, mimeType: "application/json", text: JSON.stringify(item) }] com o ItemRss
 *   completo (inclui o resumo), procurando o id em todos os feeds. Id inexistente → lance um Error.
 *
 * PROMPT ("classificar_noticia", argumento { id: string }):
 * - uma mensagem de role "user" pedindo para classificar a notícia, com título, resumo e fonte no texto.
 */
export function criarServidorFontes(
  opcoes: { pastaRss?: string; fontes?: Fonte[] } = {},
): McpServer {
  throw new Error("TODO (M5): implemente criarServidorFontes");
}
