// ETAPA M8 — rastreio, custo e latência por edição.
// O @mentoria/llm emite um evento por chamada ao modelo (observarChamadas), com tokens, latência e
// os atributos do contexto (comAtributos). Aqui você dá o contexto (qual papel, qual item) e agrega.
import { comAtributos, type EventoDeChamada } from "@mentoria/llm";
import type { Papeis } from "../m05/time.js";
import type { Precos, ResumoDoRastro } from "./tipos-rastreio.js";
import { SEM_CUSTO } from "./tipos-rastreio.js";

export * from "./tipos-rastreio.js";

/**
 * Percentil pelo método da posição mais próxima (nearest-rank): ordene os valores e pegue o da
 * posição ceil(q × n), contando a partir de 1. Ex.: [10, 20, 30, 40], q = 0.5 → posição 2 → 20.
 * Lista vazia → 0. Não altere a lista recebida.
 */
export function percentil(valores: number[], q: number): number {
  throw new Error("TODO (M8): implemente percentil");
}

/**
 * custo = tokensEntrada × entradaPorMilhao / 1.000.000 + tokensSaida × saidaPorMilhao / 1.000.000.
 * Tokens ausentes (o provedor não informou) contam como 0.
 */
export function custoDaChamada(evento: Pick<EventoDeChamada, "tokensEntrada" | "tokensSaida">, precos: Precos): number {
  throw new Error("TODO (M8): implemente custoDaChamada");
}

/**
 * Agrega os eventos no total e por papel (atributos.papel, ou "sem-papel"):
 * - chamadas: quantos eventos; erros: quantos têm `erro`;
 * - tokensEntrada, tokensSaida, custo e latenciaTotalMs: somas (tokens ausentes = 0);
 * - p50Ms e p95Ms: percentil(latências, 0.5) e percentil(latências, 0.95).
 * Chamadas com erro contam em tudo (elas também custaram tempo e, às vezes, tokens).
 */
export function resumirRastro(eventos: EventoDeChamada[], precos: Precos = SEM_CUSTO): ResumoDoRastro {
  throw new Error("TODO (M8): implemente resumirRastro");
}

/**
 * Devolve papéis que fazem o mesmo trabalho, mas cada chamada roda dentro de
 * comAtributos({ papel: "<nome do método>", alvo: <id do item> }, …). `coletar` não tem alvo: { papel: "coletar" }.
 * Assim, toda chamada ao modelo lá dentro sai no rastro com o papel e o item.
 * Não mude entradas nem saídas; erros continuam sendo lançados.
 */
export function rastrearPapeis(papeis: Papeis): Papeis {
  throw new Error("TODO (M8): implemente rastrearPapeis");
}
