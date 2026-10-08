import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { conectarEmMemoria, ferramentasDoMcp } from "../src/m05/mcp-para-ai-sdk.js";
import { criarServidorEdicao, montarMarkdown, type ItemEdicao } from "../src/m05/servidor-edicao.js";
import { criarServidorFontes } from "../src/m05/servidor-fontes.js";
import { montarEdicao, type ItemAvaliado, type Papeis } from "../src/m05/time.js";
import { carregarNoticias } from "../src/noticia.js";

const noticias = carregarNoticias();
const titulo = (id: string) => noticias.find((n) => n.id === id)!.titulo;
const opcoesDeFerramenta = { toolCallId: "t", messages: [] } as any;
const texto = (r: any) => r.content.find((c: any) => c.type === "text")?.text;

describe("M5 · servidor MCP de fontes", () => {
  it("expõe as duas tools, só leitura", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["ler_fonte", "listar_fontes"]);
    for (const t of tools) expect(t.annotations?.readOnlyHint).toBe(true);
    expect(tools.find((t) => t.name === "ler_fonte")!.inputSchema.required).toEqual(["fonte"]);
  });

  it("listar_fontes devolve as 10 fontes com quantidade", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    const r: any = await c.callTool({ name: "listar_fontes", arguments: {} });
    expect(r.structuredContent.fontes).toHaveLength(10);
    expect(r.structuredContent.fontes[0]).toEqual(expect.objectContaining({ nome: "lab-aurora", quantidade: 2 }));
    expect(JSON.parse(texto(r))).toEqual(r.structuredContent);
  });

  it("ler_fonte lê o RSS; fonte desconhecida é erro da tool, sem ler arquivo", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    const r: any = await c.callTool({ name: "ler_fonte", arguments: { fonte: "lab-aurora" } });
    expect(r.structuredContent.itens).toEqual([
      { id: "n01", titulo: titulo("n01"), url: "https://example.com/aurora/aurora-7b", publicadaEm: "2026-09-22" },
      expect.objectContaining({ id: "n21" }),
    ]);
    const ruim: any = await c.callTool({ name: "ler_fonte", arguments: { fonte: "../../etc/passwd" } });
    expect(ruim.isError).toBe(true);
    expect(texto(ruim)).toBe("fonte desconhecida: ../../etc/passwd");
  });

  it("o resource noticia://{id} devolve a notícia completa em JSON", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    const r = await c.readResource({ uri: "noticia://n18" });
    const item = JSON.parse((r.contents[0] as any).text);
    expect(item).toEqual(expect.objectContaining({ id: "n18", titulo: titulo("n18"), fonte: "Blog da Fundação Ipê" }));
    expect(item.resumo.length).toBeGreaterThan(50);
    expect((r.contents[0] as any).mimeType).toBe("application/json");
    await expect(c.readResource({ uri: "noticia://n99" })).rejects.toThrow();
  });

  it("o prompt classificar_noticia traz a notícia", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    const p = await c.getPrompt({ name: "classificar_noticia", arguments: { id: "n02" } });
    expect(p.messages[0]!.role).toBe("user");
    expect((p.messages[0]!.content as any).text).toContain(titulo("n02"));
  });
});

describe("M5 · servidor MCP de edição", () => {
  const itens: ItemEdicao[] = [
    { id: "a", titulo: "Ferramenta A", categoria: "ferramentas", resumo: "Resumo A.", url: "https://example.com/a" },
    { id: "b", titulo: "Modelo B", categoria: "modelos", resumo: "Resumo B.", url: "https://example.com/b" },
    { id: "c", titulo: "Coisa C", categoria: "misterio", resumo: "Resumo C.", url: "https://example.com/c" },
  ];

  it("montarMarkdown agrupa na ordem das categorias, com 'outros' no fim", () => {
    expect(montarMarkdown("Edição 1", itens)).toBe(
      [
        "# Edição 1",
        "",
        "## modelos",
        "",
        "- **[Modelo B](https://example.com/b)**: Resumo B.",
        "",
        "## ferramentas",
        "",
        "- **[Ferramenta A](https://example.com/a)**: Resumo A.",
        "",
        "## outros",
        "",
        "- **[Coisa C](https://example.com/c)**: Resumo C.",
        "",
      ].join("\n"),
    );
  });

  it("publicar_edicao grava o arquivo; o resource devolve o conteúdo", async () => {
    const pasta = join(mkdtempSync(join(tmpdir(), "edicao-")), "sub");
    const c = await conectarEmMemoria(criarServidorEdicao({ pasta }));
    const antes = await c.readResource({ uri: "edicao://ultima" });
    expect((antes.contents[0] as any).text).toBe("nenhuma edição publicada");

    const r: any = await c.callTool({ name: "publicar_edicao", arguments: { titulo: "Edição 1", itens } });
    expect(r.structuredContent).toEqual({ arquivo: join(pasta, "edicao.md"), itens: 3 });
    expect(readFileSync(join(pasta, "edicao.md"), "utf8")).toBe(montarMarkdown("Edição 1", itens));
    const depois = await c.readResource({ uri: "edicao://ultima" });
    expect((depois.contents[0] as any).text).toBe(montarMarkdown("Edição 1", itens));

    const { tools } = await c.listTools();
    expect(tools[0]!.annotations).toEqual(expect.objectContaining({ readOnlyHint: false, destructiveHint: false, idempotentHint: true }));
  });

  it("recusa item sem fonte https e não grava nada", async () => {
    const pasta = mkdtempSync(join(tmpdir(), "edicao-"));
    const c = await conectarEmMemoria(criarServidorEdicao({ pasta }));
    const r: any = await c.callTool({
      name: "publicar_edicao",
      arguments: { titulo: "x", itens: [{ ...itens[0]!, id: "n40", url: "http://10.0.0.5/x" }] },
    });
    expect(r.isError).toBe(true);
    expect(texto(r)).toBe("item n40 sem fonte https");
    expect((await c.readResource({ uri: "edicao://ultima" })).contents[0]).toEqual(expect.objectContaining({ text: "nenhuma edição publicada" }));
  });
});

describe("M5 · ferramentasDoMcp", () => {
  it("converte as tools do servidor e respeita a lista de permitidas", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    expect(Object.keys(await ferramentasDoMcp(c)).sort()).toEqual(["ler_fonte", "listar_fontes"]);
    const so = await ferramentasDoMcp(c, { permitidas: ["listar_fontes"] });
    expect(Object.keys(so)).toEqual(["listar_fontes"]);
    expect(so.listar_fontes!.description).toMatch(/fontes/);
  });

  it("execute chama a tool e devolve structuredContent, ou { erro }", async () => {
    const c = await conectarEmMemoria(criarServidorFontes());
    const f = await ferramentasDoMcp(c);
    const ok: any = await f.ler_fonte!.execute!({ fonte: "lab-aurora" }, opcoesDeFerramenta);
    expect(ok.itens.map((i: any) => i.id)).toEqual(["n01", "n21"]);
    expect(await f.ler_fonte!.execute!({ fonte: "nada" }, opcoesDeFerramenta)).toEqual({ erro: "fonte desconhecida: nada" });
  });
});

describe("M5 · montarEdicao (o time)", () => {
  const avaliacoes: Record<string, Partial<ItemAvaliado>> = {
    n01: { acao: "publicar", categoria: "modelos", confianca: 0.9 },
    n02: { acao: "publicar", categoria: "ferramentas", confianca: 0.99 },
    n05: { acao: "descartar", categoria: null, confianca: 0.95 },
    n03: { acao: "publicar", categoria: "pesquisa", confianca: 0.95 },
    n04: { acao: "revisar", categoria: "regulacao", confianca: 0.6 },
  };

  function papeisFalsos(revisoes: Record<string, boolean[]> = {}) {
    const log: string[] = [];
    const tentativas: Record<string, number> = {};
    const papeis: Papeis = {
      coletar: async () => ["n01", "n02", "n05", "n02", "n03", "n04"],
      classificar: async (id) => ({ id, titulo: `T-${id}`, url: `https://example.com/${id}`, ...avaliacoes[id] }) as ItemAvaliado,
      redigir: async (id, feedback) => {
        log.push(`redigir ${id}${feedback ? ` (${feedback})` : ""}`);
        return `resumo de ${id}`;
      },
      revisar: async (id) => {
        const i = (tentativas[id] = (tentativas[id] ?? 0) + 1);
        const aprovado = revisoes[id]?.[i - 1] ?? true;
        return { aprovado, motivo: aprovado ? "ok" : `ruim ${id}#${i}` };
      },
    };
    return { papeis, log };
  }

  it("classifica os candidatos, ordena por confiança, redige, revisa e publica", async () => {
    const { papeis } = papeisFalsos();
    const publicados: ItemEdicao[][] = [];
    const r = await montarEdicao(papeis, async (itens) => (publicados.push(itens), { arquivo: "/tmp/edicao.md" }));
    expect(r.candidatos).toEqual(["n01", "n02", "n05", "n03", "n04"]);
    expect(r.publicaveis).toEqual(["n02", "n03", "n01"]);
    expect(r.aprovadas).toEqual(["n02", "n03", "n01"]);
    expect(r.arquivo).toBe("/tmp/edicao.md");
    expect(publicados[0]![0]).toEqual({ id: "n02", titulo: "T-n02", categoria: "ferramentas", resumo: "resumo de n02", url: "https://example.com/n02" });
    expect(r.chamadas).toEqual({ coletar: 1, classificar: 5, redigir: 3, revisar: 3 });
  });

  it("respeita maxItens", async () => {
    const { papeis } = papeisFalsos();
    const r = await montarEdicao(papeis, async () => ({ arquivo: "x" }), { maxItens: 2 });
    expect(r.publicaveis).toEqual(["n02", "n03"]);
  });

  it("reprovado volta para o redator com o motivo; depois do limite, fica de fora", async () => {
    const { papeis, log } = papeisFalsos({ n02: [false, true], n03: [false, false] });
    const r = await montarEdicao(papeis, async () => ({ arquivo: "x" }));
    expect(log).toEqual(["redigir n02", "redigir n02 (ruim n02#1)", "redigir n03", "redigir n03 (ruim n03#1)", "redigir n01"]);
    expect(r.aprovadas).toEqual(["n02", "n01"]);
    expect(r.reprovadas).toEqual([{ id: "n03", motivo: "ruim n03#2" }]);
    expect(r.chamadas.redigir).toBe(5);
  });

  it("sem nada aprovado, não publica", async () => {
    const { papeis } = papeisFalsos({ n01: [false, false], n02: [false, false], n03: [false, false] });
    let publicou = false;
    const r = await montarEdicao(papeis, async () => ((publicou = true), { arquivo: "x" }));
    expect(publicou).toBe(false);
    expect(r.arquivo).toBeNull();
  });
});
