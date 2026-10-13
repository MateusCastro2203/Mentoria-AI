import { Command, MemorySaver } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import type { ItemEdicao } from "../src/m05/servidor-edicao.js";
import type { ItemAvaliado, Papeis } from "../src/m05/time.js";
import { aplicarDecisaoEdicao, aplicarDecisaoItem, metricasDeRevisao } from "../src/m07/decisoes.js";
import { pausasPendentes, type ResultadoHitl } from "../src/m07/estado.js";
import { montarGrafoHitl } from "../src/m07/grafo.js";

const item = (id: string, acao: ItemAvaliado["acao"], categoria: string | null, confianca: number | null): ItemAvaliado => ({
  id, titulo: `T-${id}`, url: `https://example.com/${id}`, acao, categoria, confianca,
});
const edicao = (...ids: string[]): ItemEdicao[] => ids.map((id) => ({ id, titulo: `T-${id}`, categoria: "modelos", resumo: `resumo ${id}`, url: `https://example.com/${id}` }));

describe("M7 · aplicarDecisaoItem", () => {
  const n03 = item("n03", "publicar", "pesquisa", 0.7);

  it("aprovar mantém o item; editar troca categoria e título; rejeitar tira", () => {
    expect(aplicarDecisaoItem(n03, { acao: "aprovar", tempoMs: 1200 })).toEqual({ item: n03, decisao: { alvo: "n03", acao: "aprovar", tempoMs: 1200 } });
    const editado = aplicarDecisaoItem(n03, { acao: "editar", categoria: "modelos", titulo: "Novo" });
    expect(editado.item).toEqual({ ...n03, categoria: "modelos", titulo: "Novo" });
    expect(editado.decisao).toEqual({ alvo: "n03", acao: "editar" });
    expect(aplicarDecisaoItem(n03, { acao: "editar", categoria: "mercado" }).item?.titulo).toBe("T-n03");
    expect(aplicarDecisaoItem(n03, { acao: "rejeitar", motivo: "fora do tema" })).toEqual({ item: null, decisao: { alvo: "n03", acao: "rejeitar", motivo: "fora do tema" } });
  });

  it("resposta fora do formato é erro (não vira aprovação silenciosa)", () => {
    expect(() => aplicarDecisaoItem(n03, "sim")).toThrow(ZodError);
    expect(() => aplicarDecisaoItem(n03, { acao: "editar", categoria: "esportes" })).toThrow(ZodError);
    expect(() => aplicarDecisaoItem(n03, { acao: "rejeitar" })).toThrow(ZodError);
  });
});

describe("M7 · aplicarDecisaoEdicao", () => {
  const itens = edicao("n01", "n02", "n03");

  it("aprovar, editar (remover e reescrever) e rejeitar", () => {
    expect(aplicarDecisaoEdicao(itens, { acao: "aprovar" }).itens).toEqual(itens);
    const r = aplicarDecisaoEdicao(itens, { acao: "editar", remover: ["n02"], resumos: { n03: "melhor" } });
    expect(r.itens).toEqual([itens[0], { ...itens[2], resumo: "melhor" }]);
    expect(r.decisao).toEqual({ alvo: "edicao", acao: "editar" });
    expect(aplicarDecisaoEdicao(itens, { acao: "rejeitar", motivo: "semana fraca" })).toEqual({
      itens: null,
      decisao: { alvo: "edicao", acao: "rejeitar", motivo: "semana fraca" },
    });
  });

  it("id desconhecido é erro", () => {
    expect(() => aplicarDecisaoEdicao(itens, { acao: "editar", remover: ["n99"] })).toThrow("item desconhecido: n99");
    expect(() => aplicarDecisaoEdicao(itens, { acao: "editar", resumos: { n77: "x" } })).toThrow("item desconhecido: n77");
  });
});

describe("M7 · metricasDeRevisao", () => {
  it("pausas, intervenção, override e tempo médio", () => {
    const m = metricasDeRevisao(20, [
      { alvo: "n03", acao: "aprovar", tempoMs: 1000 },
      { alvo: "n38", acao: "rejeitar", motivo: "injeção", tempoMs: 3000 },
      { alvo: "edicao", acao: "editar" },
    ]);
    expect(m).toEqual({ pausas: 3, taxaDeIntervencao: 2 / 20, taxaDeOverride: 2 / 3, tempoMedioMs: 2000 });
  });

  it("sem decisões nem avaliados, nada de divisão por zero", () => {
    expect(metricasDeRevisao(0, [])).toEqual({ pausas: 0, taxaDeIntervencao: 0, taxaDeOverride: 0, tempoMedioMs: null });
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

function falsos() {
  const chamadas = { coletar: 0, classificar: 0, redigir: [] as string[], revisar: 0 };
  const papeis: Papeis = {
    coletar: async () => (chamadas.coletar++, Object.keys(AVALIACOES)),
    classificar: async (id) => (chamadas.classificar++, AVALIACOES[id]!),
    redigir: async (id) => (chamadas.redigir.push(id), `resumo ${id}`),
    revisar: async () => (chamadas.revisar++, { aprovado: true, motivo: "ok" }),
  };
  const publicados: ItemEdicao[][] = [];
  const publicar = async (itens: ItemEdicao[]) => (publicados.push(itens), { arquivo: "/tmp/edicao.md" });
  return { papeis, chamadas, publicados, publicar };
}
const config = (t: string) => ({ configurable: { thread_id: t } });
const porId = (r: ResultadoHitl) => Object.fromEntries((r.__interrupt__ ?? []).map((i) => [(i.value as { id?: string }).id ?? "edicao", i.id]));

describe("M7 · montarGrafoHitl", () => {
  it("pausa nos itens incertos, sem redigir nem publicar antes da resposta", async () => {
    const f = falsos();
    const g = montarGrafoHitl(f.papeis, f.publicar, { checkpointer: new MemorySaver() });
    const r = await g.invoke({}, config("a"));
    const pedidos = (r.__interrupt__ ?? []).map((i) => i.value);
    expect(pedidos).toEqual(
      expect.arrayContaining([
        { tipo: "item", id: "n03", titulo: "T-n03", url: "https://example.com/n03", categoria: "pesquisa", confianca: 0.7, motivo: "confianca-baixa" },
        expect.objectContaining({ tipo: "item", id: "n38", motivo: "guardrails" }),
      ]),
    );
    expect(pedidos).toHaveLength(2);
    expect(f.chamadas.redigir.sort()).toEqual(["n01", "n02"]);
    expect(f.publicados).toHaveLength(0);
    expect((await pausasPendentes(g, config("a"))).length).toBe(2);
  });

  it("fluxo completo: decide os itens, depois aprova a edição editada, e só então publica", async () => {
    const f = falsos();
    const g = montarGrafoHitl(f.papeis, f.publicar, { checkpointer: new MemorySaver() });
    const r1 = await g.invoke({}, config("b"));
    const ids = porId(r1);
    const r2 = await g.invoke(
      new Command({ resume: { [ids.n03!]: { acao: "editar", categoria: "modelos" }, [ids.n38!]: { acao: "rejeitar", motivo: "injeção" } } }),
      config("b"),
    );
    // 2ª pausa: a edição inteira.
    expect(r2.__interrupt__).toHaveLength(1);
    const pedido = r2.__interrupt__![0]!.value as { tipo: string; itens: ItemEdicao[] };
    expect(pedido.tipo).toBe("edicao");
    expect(pedido.itens.map((i) => i.id).sort()).toEqual(["n01", "n02", "n03"]);
    expect(pedido.itens.find((i) => i.id === "n03")!.categoria).toBe("modelos");
    expect(f.chamadas.redigir.sort()).toEqual(["n01", "n02", "n03"]);
    expect(f.publicados).toHaveLength(0);

    const r3 = await g.invoke(new Command({ resume: { acao: "editar", remover: ["n02"] } }), config("b"));
    expect(r3.__interrupt__).toBeUndefined();
    expect(f.publicados).toHaveLength(1);
    expect(f.publicados[0]!.map((i) => i.id).sort()).toEqual(["n01", "n03"]);
    expect(r3.arquivo).toBe("/tmp/edicao.md");
    expect(r3.decisoes).toEqual(
      expect.arrayContaining([
        { alvo: "n03", acao: "editar" },
        { alvo: "n38", acao: "rejeitar", motivo: "injeção" },
        { alvo: "edicao", acao: "editar" },
      ]),
    );
    expect(r3.decisoes).toHaveLength(3);
    expect(f.chamadas.classificar).toBe(5);
  });

  it("responder um item de cada vez: o outro continua pausado, e ninguém reclassifica", async () => {
    const f = falsos();
    const g = montarGrafoHitl(f.papeis, f.publicar, { checkpointer: new MemorySaver() });
    const ids = porId(await g.invoke({}, config("c")));
    const r = await g.invoke(new Command({ resume: { [ids.n03!]: { acao: "aprovar" } } }), config("c"));
    expect((r.__interrupt__ ?? []).map((i) => (i.value as { id: string }).id)).toEqual(["n38"]);
    expect(f.chamadas.redigir.filter((id) => id === "n03")).toHaveLength(1);
    expect(f.chamadas.classificar).toBe(5);
    expect(f.chamadas.coletar).toBe(1);
  });

  it("a pausa sobrevive ao processo: outro grafo com o mesmo checkpointer continua", async () => {
    const checkpointer = new MemorySaver();
    const f = falsos();
    const ids = porId(await montarGrafoHitl(f.papeis, f.publicar, { checkpointer }).invoke({}, config("d")));
    const outro = montarGrafoHitl(f.papeis, f.publicar, { checkpointer });
    const r = await outro.invoke(new Command({ resume: { [ids.n03!]: { acao: "rejeitar", motivo: "x" }, [ids.n38!]: { acao: "rejeitar", motivo: "y" } } }), config("d"));
    expect((r.__interrupt__![0]!.value as { tipo: string }).tipo).toBe("edicao");
  });

  it("edição rejeitada: nada é publicado", async () => {
    const f = falsos();
    const g = montarGrafoHitl(f.papeis, f.publicar, { checkpointer: new MemorySaver() });
    const ids = porId(await g.invoke({}, config("e")));
    await g.invoke(new Command({ resume: { [ids.n03!]: { acao: "aprovar" }, [ids.n38!]: { acao: "aprovar" } } }), config("e"));
    const r = await g.invoke(new Command({ resume: { acao: "rejeitar", motivo: "semana fraca" } }), config("e"));
    expect(f.publicados).toHaveLength(0);
    expect(r.arquivo).toBeNull();
    expect(r.edicaoRejeitada).toBe("semana fraca");
  });

  it("revisarEdicao: false publica sem a segunda pausa", async () => {
    const f = falsos();
    const g = montarGrafoHitl(f.papeis, f.publicar, { checkpointer: new MemorySaver(), revisarEdicao: false });
    const ids = porId(await g.invoke({}, config("f")));
    const r = await g.invoke(new Command({ resume: { [ids.n03!]: { acao: "rejeitar", motivo: "x" }, [ids.n38!]: { acao: "rejeitar", motivo: "y" } } }), config("f"));
    expect(r.__interrupt__).toBeUndefined();
    expect(f.publicados[0]!.map((i) => i.id).sort()).toEqual(["n01", "n02"]);
  });

  it("o desenho tem os nós humanos", async () => {
    const f = falsos();
    const mermaid = (await montarGrafoHitl(f.papeis, f.publicar).getGraphAsync()).drawMermaid();
    for (const no of ["revisao_humana", "aprovar_edicao", "publicar"]) expect(mermaid).toContain(no);
  });
});
