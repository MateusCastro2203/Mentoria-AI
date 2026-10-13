// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { ItemAvaliado } from "../../src/m06/estado.js";
import { RespostaEdicaoSchema, RespostaItemSchema, type Decisao } from "../../src/m07/estado.js";

const registro = (alvo: string, r: { acao: Decisao["acao"]; motivo?: string; tempoMs?: number }): Decisao => ({
  alvo,
  acao: r.acao,
  ...(r.motivo !== undefined && { motivo: r.motivo }),
  ...(r.tempoMs !== undefined && { tempoMs: r.tempoMs }),
});

export function aplicarDecisaoItem(item: ItemAvaliado, resposta: unknown): { item: ItemAvaliado | null; decisao: Decisao } {
  const r = RespostaItemSchema.parse(resposta);
  const decisao = registro(item.id, r);
  if (r.acao === "rejeitar") return { item: null, decisao };
  if (r.acao === "editar") return { item: { ...item, categoria: r.categoria, titulo: r.titulo ?? item.titulo }, decisao };
  return { item, decisao };
}

export function aplicarDecisaoEdicao(itens: ItemEdicao[], resposta: unknown): { itens: ItemEdicao[] | null; decisao: Decisao } {
  const r = RespostaEdicaoSchema.parse(resposta);
  const decisao = registro("edicao", r);
  if (r.acao === "rejeitar") return { itens: null, decisao };
  if (r.acao === "aprovar") return { itens, decisao };
  const ids = new Set(itens.map((i) => i.id));
  for (const id of [...r.remover, ...Object.keys(r.resumos)]) if (!ids.has(id)) throw new Error(`item desconhecido: ${id}`);
  const final = itens.filter((i) => !r.remover.includes(i.id)).map((i) => (r.resumos[i.id] ? { ...i, resumo: r.resumos[i.id]! } : i));
  return { itens: final, decisao };
}

export interface MetricasDeRevisao {
  pausas: number;
  taxaDeIntervencao: number;
  taxaDeOverride: number;
  tempoMedioMs: number | null;
}

export function metricasDeRevisao(totalAvaliados: number, decisoes: Decisao[]): MetricasDeRevisao {
  const deItens = decisoes.filter((d) => d.alvo !== "edicao").length;
  const discordou = decisoes.filter((d) => d.acao !== "aprovar").length;
  const tempos = decisoes.flatMap((d) => (d.tempoMs === undefined ? [] : [d.tempoMs]));
  return {
    pausas: decisoes.length,
    taxaDeIntervencao: totalAvaliados ? deItens / totalAvaliados : 0,
    taxaDeOverride: decisoes.length ? discordou / decisoes.length : 0,
    tempoMedioMs: tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : null,
  };
}
