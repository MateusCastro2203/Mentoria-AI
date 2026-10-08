// Um servidor MCP de verdade: o glossário da mentoria para qualquer cliente MCP.
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import { z } from "zod";
import { normalizar } from "./conectar.js";
import { TERMOS, type Termo } from "./termos.js";

/**
 * Crie o servidor "glossario-ia" (versão "1.0.0") com:
 *
 * TOOLS (ambas com annotations { readOnlyHint: true }):
 * - buscar_termo ({ termo: string }): compara com `normalizar` (sem acento, sem diferenciar maiúsculas).
 *   Achou → structuredContent { termo, definicao, modulo } + content em texto (JSON.stringify).
 *   Não achou → isError: true, texto "termo não encontrado: <termo como veio>".
 * - listar_termos ({ prefixo?: string }): structuredContent { termos: string[] } com os nomes,
 *   em ordem alfabética, só os que começam com o prefixo (normalizado), se houver.
 *
 * RESOURCE template "glossario://{termo}" (nome "termo", mimeType "text/markdown"):
 * - texto "# <termo>\n\n<definicao>\n\nMódulo <modulo>"; o {termo} da URI pode vir com %20 (use
 *   decodeURIComponent). Termo inexistente → lance um Error.
 *
 * PROMPT "explicar_termo" ({ termo: string, publico: string }):
 * - uma mensagem "user": "Explique <termo> para <publico>, com uma analogia. Definição de referência: <definicao>"
 *   (se o termo não existir, a definição de referência é "não encontrada").
 */
export function criarServidorGlossario(termos: Termo[] = TERMOS): McpServer {
  throw new Error("TODO: implemente criarServidorGlossario");
}
