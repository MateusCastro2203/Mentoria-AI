// Servidor do glossário por stdio, para conectar um cliente MCP externo (ex.: MCP Inspector).
//   npx @modelcontextprotocol/inspector pnpm -F @mentoria/ex05-mcp glossario
// Usa o SEU servidor (src/); com SOLUCAO=1, a solução. Nada em stdout: é o canal do protocolo.
import { serveStdio } from "@modelcontextprotocol/server/stdio";

const { criarServidorGlossario }: typeof import("../src/glossario/servidor.js") = process.env.SOLUCAO
  ? await import("../solucao/glossario/servidor.js")
  : await import("../src/glossario/servidor.js");
// serveStdio atende as duas eras do protocolo (2025-11-25 com initialize e 2026-07-28 sem sessão).
serveStdio(() => criarServidorGlossario());
console.error("glossario-ia: servidor MCP no ar (stdio)");
