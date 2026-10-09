import { END, MemorySaver, Send } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import type { ItemEdicao } from "../src/m05/servidor-edicao.js";
import type { ItemAvaliado, Papeis } from "../src/m05/time.js";
import { montarGrafo } from "../src/m06/grafo.js";
import { enviarParaClassificacao, rotearPorConfianca, selecionar } from "../src/m06/rotas.js";

const item = (id: string, acao: ItemAvaliado["acao"], categoria: string | null, confianca: number | null): ItemAvaliado => ({
  id,
  titulo: `T-${id}`,
  url: `https://example.com/${id}`,
  acao,
  categoria,
  confianca,
});
const estado = (parcial: Record<string, unknown>) =>
  ({ candidatos: [], avaliados: [], itens: [], reprovadas: [], paraRevisao: [], foraDaEdicao: [], arquivo: null, trajetoria: [], ...parcial }) as any;

describe("M6 · enviarParaClassificacao", () => {
  it("um Send por candidato; nenhum candidato → END", () => {
    const r = enviarParaClassificacao(estado({ candidatos: ["n01", "n02"] })) as Send[];
    expect(r.map((s) => [s.node, s.args])).toEqual([
      ["classificar", { id: "n01" }],
      ["classificar", { id: "n02" }],
    ]);
    expect(enviarParaClassificacao(estado({}))).toBe(END);
  });
});

describe("M6 · selecionar", () => {
  const avaliados = [
    item("a", "publicar", "ferramentas", 0.99),
    item("b", "publicar", "ferramentas", 0.98),
    item("c", "publicar", "ferramentas", 0.97),
    item("d", "publicar", "ferramentas", 0.96),
    item("e", "publicar", "regulacao", 0.95),
    item("f", "publicar", "modelos", 0.8),
    item("g", "revisar", "pesquisa", 0.99),
    item("h", "descartar", null, 0.99),
    item("i", "publicar", "mercado", null),
  ];

  it("separa por confiança e guardrails, e respeita a cota por categoria", () => {
    const r = selecionar(avaliados, { maxPorCategoria: 3, maxItens: 10, limiar: 0.9 });
    expect(r.publicar.map((x) => x.id)).toEqual(["a", "b", "c", "e"]);
    expect(r.fora).toEqual(["d"]);
    expect(r.revisar.map((x) => [x.item.id, x.motivo])).toEqual([
      ["f", "confianca-baixa"],
      ["g", "guardrails"],
      ["i", "confianca-baixa"],
    ]);
  });

  it("respeita maxItens e usa os padrões (limiar 0.9, 10 itens, 3 por categoria)", () => {
    expect(selecionar(avaliados, { maxItens: 2 }).publicar.map((x) => x.id)).toEqual(["a", "b"]);
    expect(selecionar(avaliados).publicar.map((x) => x.id)).toEqual(["a", "b", "c", "e"]);
  });

  it("empate de confiança mantém a ordem original", () => {
    const r = selecionar([item("x", "publicar", "modelos", 0.95), item("y", "publicar", "pesquisa", 0.95)]);
    expect(r.publicar.map((i) => i.id)).toEqual(["x", "y"]);
  });
});

describe("M6 · rotearPorConfianca", () => {
  it("manda publicáveis para redigir e o resto para a fila humana", () => {
    const r = rotearPorConfianca(estado({ avaliados: [item("a", "publicar", "modelos", 0.95), item("b", "publicar", "modelos", 0.5)] })) as Send[];
    expect(r.map((s) => s.node)).toEqual(["redigir", "fila_humana"]);
    expect(r[1]!.args).toEqual({ item: expect.objectContaining({ id: "b" }), motivo: "confianca-baixa" });
  });

  it("sem nada para fazer → publicar", () => {
    expect(rotearPorConfianca(estado({ avaliados: [item("h", "descartar", null, 0.9)] }))).toBe("publicar");
  });
});

// ── o grafo, com papéis falsos ────────────────────────────────────────────────────────────────────
const AVALIACOES: Record<string, ItemAvaliado> = {
  n01: item("n01", "publicar", "modelos", 0.97),
  n02: item("n02", "publicar", "ferramentas", 0.99),
  n03: item("n03", "publicar", "pesquisa", 0.7),
  n05: item("n05", "descartar", null, 0.95),
  n38: item("n38", "revisar", "ferramentas", 0.95),
};

function falsos(opcoes: { reprovarSempre?: string[] } = {}) {
  const chamadas = { coletar: 0, classificar: 0, redigir: 0, revisar: 0 };
  const papeis: Papeis = {
    coletar: async () => (chamadas.coletar++, Object.keys(AVALIACOES)),
    classificar: async (id) => (chamadas.classificar++, AVALIACOES[id]!),
    redigir: async (id, feedback) => (chamadas.redigir++, `resumo ${id}${feedback ? " v2" : ""}`),
    revisar: async (id) => {
      chamadas.revisar++;
      return opcoes.reprovarSempre?.includes(id) ? { aprovado: false, motivo: `ruim ${id}` } : { aprovado: true, motivo: "ok" };
    },
  };
  return { papeis, chamadas };
}

const config = (thread: string) => ({ configurable: { thread_id: thread } });

describe("M6 · montarGrafo", () => {
  it("roda o fluxo inteiro: classifica em paralelo, roteia por confiança e publica", async () => {
    const { papeis, chamadas } = falsos();
    const publicados: ItemEdicao[][] = [];
    const g = montarGrafo(papeis, async (itens) => (publicados.push(itens), { arquivo: "/tmp/e.md" }), { checkpointer: new MemorySaver() });
    const r = await g.invoke({}, config("ok"));

    expect(r.avaliados.map((a) => a.id).sort()).toEqual(["n01", "n02", "n03", "n05", "n38"]);
    expect(r.itens.map((i) => i.id).sort()).toEqual(["n01", "n02"]);
    expect(r.paraRevisao).toEqual(expect.arrayContaining([{ id: "n03", motivo: "confianca-baixa" }, { id: "n38", motivo: "guardrails" }]));
    expect(r.arquivo).toBe("/tmp/e.md");
    expect(publicados).toHaveLength(1);
    expect(chamadas).toEqual({ coletar: 1, classificar: 5, redigir: 2, revisar: 2 });
    expect(r.trajetoria[0]).toBe("coletar");
    expect(r.trajetoria.filter((t) => t === "selecionar")).toHaveLength(1);
    expect(r.trajetoria.at(-1)).toBe("publicar");
  });

  it("o ciclo redator ⇄ revisor: reprova até o limite e não publica o item", async () => {
    const { papeis, chamadas } = falsos({ reprovarSempre: ["n02"] });
    const g = montarGrafo(papeis, async () => ({ arquivo: "x" }), { checkpointer: new MemorySaver(), maxTentativas: 3 });
    const r = await g.invoke({}, config("ciclo"));
    expect(r.reprovadas).toEqual([{ id: "n02", motivo: "ruim n02" }]);
    expect(r.itens.map((i) => i.id)).toEqual(["n01"]);
    expect(chamadas.redigir).toBe(4);
  });

  it("sem nada aprovado, não chama publicar", async () => {
    const { papeis } = falsos({ reprovarSempre: ["n01", "n02"] });
    let publicou = false;
    const g = montarGrafo(papeis, async () => ((publicou = true), { arquivo: "x" }), { checkpointer: new MemorySaver() });
    const r = await g.invoke({}, config("vazio"));
    expect(publicou).toBe(false);
    expect(r.arquivo).toBeNull();
  });

  it("checkpoint: se publicar falhar, retoma de onde parou sem refazer as classificações", async () => {
    const { papeis, chamadas } = falsos();
    let tentativas = 0;
    const g = montarGrafo(
      papeis,
      async () => {
        if (++tentativas === 1) throw new Error("servidor de edição fora do ar");
        return { arquivo: "/tmp/e.md" };
      },
      { checkpointer: new MemorySaver() },
    );
    await expect(g.invoke({}, config("falha"))).rejects.toThrow("servidor de edição fora do ar");

    const parado = await g.getState(config("falha"));
    expect(parado.next).toEqual(["publicar"]);
    expect((parado.values as any).itens).toHaveLength(2);

    const r = await g.invoke(null, config("falha"));
    expect(r.arquivo).toBe("/tmp/e.md");
    expect(chamadas.classificar).toBe(5);
    expect(chamadas.redigir).toBe(2);

    let checkpoints = 0;
    for await (const _ of g.getStateHistory(config("falha"))) checkpoints++;
    expect(checkpoints).toBeGreaterThan(3);
  });

  it("o desenho do grafo tem os nós e o caminho condicional", async () => {
    const { papeis } = falsos();
    const mermaid = (await montarGrafo(papeis, async () => ({ arquivo: "x" })).getGraphAsync()).drawMermaid();
    for (const no of ["coletar", "classificar", "selecionar", "redigir", "fila_humana", "publicar"]) expect(mermaid).toContain(no);
    expect(mermaid).toContain("selecionar -.-> fila_humana");
  });
});
