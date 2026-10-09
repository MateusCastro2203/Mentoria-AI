// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { END, Send } from "@langchain/langgraph";
import type { Estado, ItemAvaliado } from "../../src/m06/estado.js";

export interface OpcoesDeSelecao {
  limiar?: number;
  maxItens?: number;
  maxPorCategoria?: number;
}

export function enviarParaClassificacao(estado: Estado): Send[] | typeof END {
  if (estado.candidatos.length === 0) return END;
  return estado.candidatos.map((id) => new Send("classificar", { id }));
}

export function selecionar(
  avaliados: ItemAvaliado[],
  opcoes: OpcoesDeSelecao = {},
): { publicar: ItemAvaliado[]; revisar: { item: ItemAvaliado; motivo: string }[]; fora: string[] } {
  const { limiar = 0.9, maxItens = 10, maxPorCategoria = 3 } = opcoes;
  const revisar: { item: ItemAvaliado; motivo: string }[] = [];
  const candidatos: { item: ItemAvaliado; ordem: number }[] = [];
  avaliados.forEach((item, ordem) => {
    if (item.acao === "descartar") return;
    if (item.acao === "revisar") revisar.push({ item, motivo: "guardrails" });
    else if ((item.confianca ?? 0) < limiar) revisar.push({ item, motivo: "confianca-baixa" });
    else candidatos.push({ item, ordem });
  });
  candidatos.sort((a, b) => (b.item.confianca ?? 0) - (a.item.confianca ?? 0) || a.ordem - b.ordem);

  const publicar: ItemAvaliado[] = [];
  const fora: string[] = [];
  const porCategoria = new Map<string, number>();
  for (const { item } of candidatos) {
    const categoria = item.categoria ?? "outros";
    const usados = porCategoria.get(categoria) ?? 0;
    if (publicar.length < maxItens && usados < maxPorCategoria) {
      publicar.push(item);
      porCategoria.set(categoria, usados + 1);
    } else {
      fora.push(item.id);
    }
  }
  return { publicar, revisar, fora };
}

export function rotearPorConfianca(estado: Estado, opcoes: OpcoesDeSelecao = {}): Send[] | "publicar" {
  const { publicar, revisar } = selecionar(estado.avaliados, opcoes);
  const envios = [
    ...publicar.map((item) => new Send("redigir", { item })),
    ...revisar.map(({ item, motivo }) => new Send("fila_humana", { item, motivo })),
  ];
  return envios.length ? envios : "publicar";
}
