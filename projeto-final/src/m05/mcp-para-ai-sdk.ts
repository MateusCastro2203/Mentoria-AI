// ETAPA M5 — a ponte: um cliente MCP e as ferramentas dele no formato do AI SDK,
// para um agente (gerarComFerramentas) usar as ferramentas de qualquer servidor MCP.
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, type McpServer } from "@modelcontextprotocol/server";
import { jsonSchema, tool, type ToolSet } from "ai";

/** Fornecido: conecta um cliente a um servidor no mesmo processo (testes e scripts). */
export async function conectarEmMemoria(servidor: McpServer, nome = "curador"): Promise<Client> {
  const [ladoCliente, ladoServidor] = InMemoryTransport.createLinkedPair();
  await servidor.connect(ladoServidor);
  const cliente = new Client({ name: nome, version: "1.0.0" });
  await cliente.connect(ladoCliente);
  return cliente;
}

/**
 * Lista as tools do servidor (cliente.listTools()) e devolve um ToolSet do AI SDK:
 * - só as tools cujo nome está em `permitidas` (se informado): menor privilégio;
 * - description = a do servidor; inputSchema = jsonSchema(t.inputSchema);
 * - execute(entrada) chama cliente.callTool({ name, arguments: entrada }) e devolve:
 *   - { erro: <texto> } se o resultado vier com isError (o texto é o do primeiro content de tipo text);
 *   - structuredContent, se houver;
 *   - senão, o texto do primeiro content de tipo text.
 */
export async function ferramentasDoMcp(cliente: Client, opcoes: { permitidas?: string[] } = {}): Promise<ToolSet> {
  throw new Error("TODO (M5): implemente ferramentasDoMcp");
}
