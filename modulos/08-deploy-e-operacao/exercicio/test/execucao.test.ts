import { describe, expect, it } from "vitest";
import { chaveDoDia, ErroTransitorio, POLITICA_PADRAO, type Politica } from "../src/estado.js";
import { executarDia } from "../src/execucao.js";
import { chamado, falsas } from "./apoio.js";

const chamados = [chamado("c1", "2026-10-13"), chamado("c2", "2026-10-13"), chamado("c3", "2026-10-14")];
const politica: Politica = { ...POLITICA_PADRAO, precos: { entradaPorMilhao: 1, saidaPorMilhao: 4 }, orcamento: 0.01 };
const resposta = { texto: "Dois chamados sobre SMS.", uso: { tokensEntrada: 300, tokensSaida: 50 } };

describe("executarDia", () => {
  it("caminho feliz: resume só os chamados do dia, mede tokens e custo e grava", async () => {
    const { deps, dados, pedidos } = falsas([resposta]);
    const r = await executarDia(deps, "2026-10-13", chamados, politica);
    expect(r).toEqual({
      data: "2026-10-13",
      status: "ok",
      chamados: 2,
      tentativas: 1,
      tokensEntrada: 300,
      tokensSaida: 50,
      custo: (300 * 1 + 50 * 4) / 1_000_000,
      resumo: "Dois chamados sobre SMS.",
      em: "2026-10-13T09:00:00.000Z",
    });
    expect(pedidos[0]!.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(JSON.parse(dados.get(chaveDoDia("2026-10-13"))!)).toEqual(r);
  });

  it("idempotente: o cron disparou de novo no mesmo dia → não chama o modelo nem regrava", async () => {
    const { deps, dados, pedidos } = falsas([resposta, resposta]);
    const primeiro = await executarDia(deps, "2026-10-13", chamados, politica);
    dados.set("marcador", "x");
    const antes = dados.get(chaveDoDia("2026-10-13"));
    const segundo = await executarDia({ ...deps, agora: () => new Date("2026-10-13T09:05:00Z") }, "2026-10-13", chamados, politica);
    expect(segundo).toEqual(primeiro);
    expect(pedidos).toHaveLength(1);
    expect(dados.get(chaveDoDia("2026-10-13"))).toBe(antes);
  });

  it("um dia que falhou roda de novo na próxima vez", async () => {
    const { deps, pedidos } = falsas([new Error("schema inválido"), resposta]);
    expect((await executarDia(deps, "2026-10-13", chamados, politica)).status).toBe("falhou");
    expect((await executarDia(deps, "2026-10-13", chamados, politica)).status).toBe("ok");
    expect(pedidos).toHaveLength(2);
  });

  it("erro transitório: tenta de novo com espera exponencial (1 s, 2 s) e conta as tentativas", async () => {
    const { deps, esperas } = falsas([new ErroTransitorio("429"), new ErroTransitorio("503"), resposta]);
    const r = await executarDia(deps, "2026-10-13", chamados, politica);
    expect(r).toMatchObject({ status: "ok", tentativas: 3, tokensEntrada: 300 });
    expect(esperas).toEqual([1000, 2000]);
  });

  it("desiste depois de maxTentativas e registra o último erro", async () => {
    const { deps, esperas, dados } = falsas([new ErroTransitorio("429"), new ErroTransitorio("503"), new ErroTransitorio("timeout")]);
    const r = await executarDia(deps, "2026-10-13", chamados, politica);
    expect(r).toMatchObject({ status: "falhou", tentativas: 3, erro: "timeout", tokensEntrada: 0, custo: 0 });
    expect(esperas).toEqual([1000, 2000]);
    expect(JSON.parse(dados.get(chaveDoDia("2026-10-13"))!).status).toBe("falhou");
  });

  it("erro que não é transitório: não tenta de novo", async () => {
    const { deps, esperas } = falsas([new Error("resposta fora do schema"), resposta]);
    const r = await executarDia(deps, "2026-10-13", chamados, politica);
    expect(r).toMatchObject({ status: "falhou", tentativas: 1, erro: "resposta fora do schema" });
    expect(esperas).toEqual([]);
  });

  it("sem chamados no dia: não chama o modelo", async () => {
    const { deps, pedidos } = falsas([resposta]);
    const r = await executarDia(deps, "2026-10-20", chamados, politica);
    expect(r).toMatchObject({ status: "sem-chamados", chamados: 0, tentativas: 0, custo: 0 });
    expect(pedidos).toHaveLength(0);
  });

  it("orçamento: custo estimado acima do teto → não chama o modelo", async () => {
    const { deps, pedidos } = falsas([resposta]);
    // 2 chamados de ~430 caracteres ≈ 220 tokens estimados; a 100 por milhão ≈ 0,022 > 0,01.
    const caro = { ...politica, precos: { entradaPorMilhao: 100, saidaPorMilhao: 100 } };
    const r = await executarDia(deps, "2026-10-13", chamados, caro);
    expect(r).toMatchObject({ status: "orcamento", tentativas: 0 });
    expect(pedidos).toHaveLength(0);
    expect((await executarDia(deps, "2026-10-13", chamados, politica)).status).toBe("ok");
  });
});
