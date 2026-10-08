import { describe, expect, it } from "vitest";
import { comRevisao, comSupervisor, emPipeline, type Rodada } from "../src/padroes.js";

describe("emPipeline", () => {
  it("passa a saída de uma etapa para a próxima e registra o rastro", async () => {
    const p = emPipeline([
      { nome: "coletar", executar: async (n: number) => [n, n + 1] },
      { nome: "dobrar", executar: async (xs: number[]) => xs.map((x) => x * 2) },
      { nome: "somar", executar: async (xs: number[]) => xs.reduce((a, b) => a + b, 0) },
    ]);
    expect(await p(1)).toEqual({ saida: 6, rastro: ["coletar", "dobrar", "somar"] });
  });

  it("diz em que etapa quebrou", async () => {
    const p = emPipeline([
      { nome: "ok", executar: async (x: unknown) => x },
      { nome: "redigir", executar: async () => Promise.reject(new Error("modelo fora do ar")) },
    ]);
    await expect(p(1)).rejects.toThrow("etapa redigir: modelo fora do ar");
  });
});

describe("comSupervisor", () => {
  const trabalhadores = {
    pesquisar: async ({ tarefa }: { tarefa: string }) => `fatos sobre ${tarefa}`,
    escrever: async ({ rodadas }: { rodadas: Rodada[] }) => `texto com ${rodadas.length} rodada(s) antes`,
  };

  it("chama os trabalhadores que o supervisor escolhe até ele dizer fim", async () => {
    const roteiro = ["pesquisar", "escrever", "fim"];
    const r = await comSupervisor({ tarefa: "MCP", escolher: (_t, rodadas) => roteiro[rodadas.length]!, trabalhadores, maxRodadas: 5 });
    expect(r).toEqual({
      motivo: "fim",
      rodadas: [
        { trabalhador: "pesquisar", saida: "fatos sobre MCP" },
        { trabalhador: "escrever", saida: "texto com 1 rodada(s) antes" },
      ],
    });
  });

  it("para no limite de rodadas", async () => {
    const r = await comSupervisor({ tarefa: "x", escolher: () => "pesquisar", trabalhadores, maxRodadas: 3 });
    expect(r.motivo).toBe("limite");
    expect(r.rodadas).toHaveLength(3);
  });

  it("para se escolher um trabalhador que não existe", async () => {
    const r = await comSupervisor({ tarefa: "x", escolher: () => "traduzir", trabalhadores, maxRodadas: 3 });
    expect(r).toEqual({ rodadas: [], motivo: "trabalhador-desconhecido" });
  });
});

describe("comRevisao", () => {
  it("regera com o motivo da reprovação até aprovar", async () => {
    const feedbacks: (string | undefined)[] = [];
    const r = await comRevisao({
      gerar: async (feedback) => (feedbacks.push(feedback), `v${feedbacks.length}`),
      revisar: async (s) => (s === "v3" ? { aprovado: true, motivo: "ok" } : { aprovado: false, motivo: `${s} ruim` }),
      maxTentativas: 5,
    });
    expect(r).toEqual({ saida: "v3", aprovado: true, tentativas: 3, reprovacoes: ["v1 ruim", "v2 ruim"] });
    expect(feedbacks).toEqual([undefined, "v1 ruim", "v2 ruim"]);
  });

  it("desiste depois de maxTentativas e devolve a última versão", async () => {
    const r = await comRevisao({
      gerar: async () => "sempre igual",
      revisar: async () => ({ aprovado: false, motivo: "não" }),
      maxTentativas: 2,
    });
    expect(r).toEqual({ saida: "sempre igual", aprovado: false, tentativas: 2, reprovacoes: ["não", "não"] });
  });
});
