// Servidor MCP de fontes por stdio, para clientes externos (MCP Inspector, agentes de código…).
//   pnpm -F @mentoria/curador mcp:fontes            (seu servidor)
//   SOLUCAO=1 pnpm -F @mentoria/curador mcp:fontes  (solução de referência)
// Não escreva nada em stdout aqui: no transporte stdio, stdout é o canal do protocolo.
import { serveStdio } from "@modelcontextprotocol/server/stdio";

const { criarServidorFontes }: typeof import("../src/m05/servidor-fontes.js") = process.env.SOLUCAO
  ? await import("../solucao/m05/servidor-fontes.js")
  : await import("../src/m05/servidor-fontes.js");
// serveStdio atende as duas eras do protocolo (2025-11-25 com initialize e 2026-07-28 sem sessão).
serveStdio(() => criarServidorFontes());
console.error("curador-fontes: servidor MCP no ar (stdio)");
