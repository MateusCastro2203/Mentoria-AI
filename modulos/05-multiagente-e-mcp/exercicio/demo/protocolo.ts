// Demo (aula, 17–30 min): o que trafega entre cliente e servidor MCP. Offline.
// Mostra as mensagens JSON-RPC de verdade enquanto o cliente usa o servidor do glossário.
// Parte 1: era 2025-11-25 (padrão do cliente), em memória. Parte 2: era 2026-07-28, por stdio.
// pnpm -F @mentoria/ex05-mcp demo:protocolo
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { criarServidorGlossario } from "../solucao/glossario/servidor.js";

const [ladoCliente, ladoServidor] = InMemoryTransport.createLinkedPair();
const resumir = (m: unknown) => {
  const s = JSON.stringify(m, (k, v) => (k === "_meta" ? "…" : v));
  return s.length > 260 ? `${s.slice(0, 260)}…` : s;
};
// Intercepta o que sai de cada lado.
const enviarCliente = ladoCliente.send.bind(ladoCliente);
ladoCliente.send = async (m, o) => (console.log(`\n→ cliente: ${resumir(m)}`), enviarCliente(m, o));
const enviarServidor = ladoServidor.send.bind(ladoServidor);
ladoServidor.send = async (m, o) => (console.log(`← servidor: ${resumir(m)}`), enviarServidor(m, o));

await criarServidorGlossario().connect(ladoServidor);
const cliente = new Client({ name: "demo", version: "1.0.0" });
await cliente.connect(ladoCliente);

console.log("\n===== 1. Que ferramentas você tem? (tools/list)");
await cliente.listTools();
console.log("\n===== 2. Use uma (tools/call)");
await cliente.callTool({ name: "buscar_termo", arguments: { termo: "MCP" } });
console.log("\n===== 3. Erro de ferramenta: vira resposta, não exceção");
await cliente.callTool({ name: "buscar_termo", arguments: { termo: "blockchain" } });
console.log("\n===== 4. Leia um recurso (resources/read)");
await cliente.readResource({ uri: "glossario://agente" });
console.log("\n===== 5. Pegue um prompt pronto (prompts/get)");
await cliente.getPrompt({ name: "explicar_termo", arguments: { termo: "skill", publico: "o time de produto" } });
await cliente.close();

// ── Parte 2: a era nova (2026-07-28), por stdio, num processo separado ─────────────────────────────
// O cliente em modo "auto" sonda a revisão nova; o servidor (serveStdio) atende sem initialize e sem sessão:
// cada requisição leva a versão do protocolo no próprio corpo (_meta).

console.log("\n\n===== Era nova (2026-07-28) por stdio: repare que não há initialize");
const stdio = new StdioClientTransport({
  command: "node_modules/.bin/tsx",
  args: ["demo/glossario-stdio.ts"],
  env: { ...process.env, SOLUCAO: "1" } as Record<string, string>,
  stderr: "ignore",
});
const enviarStdio = stdio.send.bind(stdio);
stdio.send = async (m) => {
  const versao = (m as { params?: { _meta?: Record<string, unknown> } }).params?._meta?.["io.modelcontextprotocol/protocolVersion"];
  console.log(`→ cliente: ${(m as { method?: string }).method ?? "(resposta)"}${versao ? `  [protocolVersion ${versao} no _meta]` : ""}`);
  return enviarStdio(m);
};
const moderno = new Client({ name: "demo", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
await moderno.connect(stdio);
const r = await moderno.callTool({ name: "buscar_termo", arguments: { termo: "agente" } });
console.log(`← servidor: ${JSON.stringify(r.structuredContent)}`);
await moderno.close();
