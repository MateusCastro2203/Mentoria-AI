// Fornecido: conecta um cliente MCP a um servidor no mesmo processo (usado nos testes e nas demos).
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, type McpServer } from "@modelcontextprotocol/server";

export async function conectarEmMemoria(servidor: McpServer): Promise<Client> {
  const [ladoCliente, ladoServidor] = InMemoryTransport.createLinkedPair();
  await servidor.connect(ladoServidor);
  const cliente = new Client({ name: "exercicio", version: "1.0.0" });
  await cliente.connect(ladoCliente);
  return cliente;
}

/** Fornecido: minúsculas e sem acentos, para comparar termos ("Alucinação" === "alucinacao"). */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}
