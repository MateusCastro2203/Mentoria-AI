// ETAPA M5 — servidor MCP de EDIÇÃO: o destino. Grava a newsletter em markdown numa pasta local.
// Trocar o destino (Notion, Slack, e-mail) seria trocar este servidor, sem mexer no time de agentes.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CATEGORIAS } from "../noticia.js";

export interface ItemEdicao {
  id: string;
  titulo: string;
  categoria: string;
  resumo: string;
  url: string;
}

/**
 * Markdown da edição:
 *   # <titulo>
 *   (linha em branco)
 *   e, para cada categoria de CATEGORIAS que tiver itens, nesta ordem:
 *   ## <categoria>
 *   (linha em branco)
 *   - **[<titulo do item>](<url>)**: <resumo>      ← um por item, na ordem recebida
 *   (linha em branco)
 * Itens com categoria fora de CATEGORIAS vão numa seção final "## outros".
 */
export function montarMarkdown(titulo: string, itens: ItemEdicao[]): string {
  throw new Error("TODO (M5): implemente montarMarkdown");
}

/**
 * Cria o servidor "curador-edicao" (versão "1.0.0") com:
 *
 * TOOL publicar_edicao ({ titulo: string, itens: ItemEdicao[] }),
 * annotations { readOnlyHint: false, destructiveHint: false, idempotentHint: true }:
 * - se algum item não tiver url começando com "https://" → isError: true com o texto
 *   "item <id> sem fonte https" e NÃO grava nada (o guardrail também vale no destino);
 * - senão cria a pasta se preciso, grava `<pasta>/edicao.md` com montarMarkdown e devolve
 *   structuredContent { arquivo: <caminho completo>, itens: <quantidade> } (+ content em texto).
 *
 * RESOURCE "edicao://ultima" (nome "edicao", mimeType "text/markdown"):
 * - o conteúdo do edicao.md, ou o texto "nenhuma edição publicada" se ele ainda não existir.
 */
export function criarServidorEdicao(opcoes: { pasta: string }): McpServer {
  throw new Error("TODO (M5): implemente criarServidorEdicao");
}
