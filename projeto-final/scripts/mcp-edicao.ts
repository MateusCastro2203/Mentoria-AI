// Servidor MCP de edição por stdio, para clientes externos. Grava em projeto-final/saidas/.
//   pnpm -F @mentoria/curador mcp:edicao
import { fileURLToPath } from "node:url";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

const { criarServidorEdicao }: typeof import("../src/m05/servidor-edicao.js") = process.env.SOLUCAO
  ? await import("../solucao/m05/servidor-edicao.js")
  : await import("../src/m05/servidor-edicao.js");
const pasta = fileURLToPath(new URL("../saidas/", import.meta.url));
// serveStdio atende as duas eras do protocolo (2025-11-25 com initialize e 2026-07-28 sem sessão).
serveStdio(() => criarServidorEdicao({ pasta }));
console.error(`curador-edicao: servidor MCP no ar (stdio), gravando em ${pasta}`);
