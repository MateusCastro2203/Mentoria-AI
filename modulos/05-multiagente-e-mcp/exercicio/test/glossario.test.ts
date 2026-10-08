import { describe, expect, it } from "vitest";
import { conectarEmMemoria } from "../src/glossario/conectar.js";
import { criarServidorGlossario } from "../src/glossario/servidor.js";

const texto = (r: any) => r.content.find((c: any) => c.type === "text")?.text;

describe("servidor MCP do glossário", () => {
  it("se apresenta e expõe as duas tools, só leitura", async () => {
    const c = await conectarEmMemoria(criarServidorGlossario());
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["buscar_termo", "listar_termos"]);
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint).toBe(true);
      expect(t.description?.length).toBeGreaterThan(10);
    }
    expect(c.getServerVersion()?.name).toBe("glossario-ia");
  });

  it("buscar_termo ignora acentos e maiúsculas", async () => {
    const c = await conectarEmMemoria(criarServidorGlossario());
    const r: any = await c.callTool({ name: "buscar_termo", arguments: { termo: "ALUCINACAO" } });
    expect(r.structuredContent).toEqual({ termo: "alucinação", definicao: expect.stringMatching(/falsa/), modulo: 1 });
    expect(JSON.parse(texto(r))).toEqual(r.structuredContent);
  });

  it("buscar_termo devolve erro da tool para termo desconhecido", async () => {
    const c = await conectarEmMemoria(criarServidorGlossario());
    const r: any = await c.callTool({ name: "buscar_termo", arguments: { termo: "Blockchain" } });
    expect(r.isError).toBe(true);
    expect(texto(r)).toBe("termo não encontrado: Blockchain");
  });

  it("listar_termos ordena e filtra por prefixo", async () => {
    const c = await conectarEmMemoria(criarServidorGlossario());
    const todos: any = await c.callTool({ name: "listar_termos", arguments: {} });
    expect(todos.structuredContent.termos).toHaveLength(12);
    expect(todos.structuredContent.termos[0]).toBe("agente");
    const g: any = await c.callTool({ name: "listar_termos", arguments: { prefixo: "Gu" } });
    expect(g.structuredContent.termos).toEqual(["guardrail"]);
  });

  it("o resource glossario://{termo} devolve markdown, mesmo com espaço codificado", async () => {
    const c = await conectarEmMemoria(criarServidorGlossario());
    const r = await c.readResource({ uri: "glossario://janela%20de%20contexto" });
    expect((r.contents[0] as any).text).toBe(
      "# janela de contexto\n\nMáximo de tokens que o modelo considera numa chamada, somando entrada e saída.\n\nMódulo 1",
    );
    await expect(c.readResource({ uri: "glossario://nada" })).rejects.toThrow();
  });

  it("o prompt explicar_termo monta o pedido com a definição", async () => {
    const c = await conectarEmMemoria(criarServidorGlossario());
    const p = await c.getPrompt({ name: "explicar_termo", arguments: { termo: "eval", publico: "gestores" } });
    expect((p.messages[0]!.content as any).text).toBe(
      "Explique eval para gestores, com uma analogia. Definição de referência: Teste automatizado de um sistema com IA: casos, execução e métricas.",
    );
  });
});
