// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, type McpServer } from "@modelcontextprotocol/server";
import { jsonSchema, tool, type ToolSet } from "ai";

export async function conectarEmMemoria(servidor: McpServer, nome = "curador"): Promise<Client> {
  const [ladoCliente, ladoServidor] = InMemoryTransport.createLinkedPair();
  await servidor.connect(ladoServidor);
  const cliente = new Client({ name: nome, version: "1.0.0" });
  await cliente.connect(ladoCliente);
  return cliente;
}

type Conteudo = { type: string; text?: string };

export async function ferramentasDoMcp(cliente: Client, opcoes: { permitidas?: string[] } = {}): Promise<ToolSet> {
  const { tools } = await cliente.listTools();
  const ferramentas: ToolSet = {};
  for (const t of tools) {
    if (opcoes.permitidas && !opcoes.permitidas.includes(t.name)) continue;
    ferramentas[t.name] = tool({
      description: t.description ?? t.name,
      inputSchema: jsonSchema(t.inputSchema as Parameters<typeof jsonSchema>[0]),
      execute: async (entrada) => {
        const r = await cliente.callTool({ name: t.name, arguments: entrada as Record<string, unknown> });
        const texto = (r.content as Conteudo[] | undefined)?.find((c) => c.type === "text")?.text ?? "";
        if (r.isError) return { erro: texto };
        return r.structuredContent ?? texto;
      },
    });
  }
  return ferramentas;
}
