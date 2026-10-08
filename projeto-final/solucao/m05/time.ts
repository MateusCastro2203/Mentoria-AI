// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import type { ItemEdicao } from "./servidor-edicao.js";

export interface ItemAvaliado {
  id: string;
  titulo: string;
  url: string;
  acao: "publicar" | "revisar" | "descartar";
  categoria: string | null;
  confianca: number | null;
}

export interface Papeis {
  coletar(): Promise<string[]>;
  classificar(id: string): Promise<ItemAvaliado>;
  redigir(id: string, feedback?: string): Promise<string>;
  revisar(id: string, resumo: string): Promise<{ aprovado: boolean; motivo: string }>;
}

export interface RelatorioDaEdicao {
  candidatos: string[];
  publicaveis: string[];
  aprovadas: string[];
  reprovadas: { id: string; motivo: string }[];
  arquivo: string | null;
  chamadas: { coletar: number; classificar: number; redigir: number; revisar: number };
}

export async function montarEdicao(
  papeis: Papeis,
  publicar: (itens: ItemEdicao[]) => Promise<{ arquivo: string }>,
  opcoes: { maxItens?: number; maxTentativas?: number } = {},
): Promise<RelatorioDaEdicao> {
  const { maxItens = 10, maxTentativas = 2 } = opcoes;
  const chamadas = { coletar: 0, classificar: 0, redigir: 0, revisar: 0 };

  chamadas.coletar++;
  const candidatos = [...new Set(await papeis.coletar())];

  const avaliados: ItemAvaliado[] = [];
  for (const id of candidatos) {
    chamadas.classificar++;
    avaliados.push(await papeis.classificar(id));
  }
  const publicaveis = avaliados
    .map((a, ordem) => ({ a, ordem }))
    .filter(({ a }) => a.acao === "publicar")
    .sort((x, y) => (y.a.confianca ?? 0) - (x.a.confianca ?? 0) || x.ordem - y.ordem)
    .slice(0, maxItens)
    .map(({ a }) => a);

  const itens: ItemEdicao[] = [];
  const reprovadas: RelatorioDaEdicao["reprovadas"] = [];
  for (const a of publicaveis) {
    let feedback: string | undefined;
    let aprovado = false;
    for (let tentativa = 1; tentativa <= maxTentativas && !aprovado; tentativa++) {
      chamadas.redigir++;
      const resumo = await papeis.redigir(a.id, feedback);
      chamadas.revisar++;
      const revisao = await papeis.revisar(a.id, resumo);
      if (revisao.aprovado) {
        aprovado = true;
        itens.push({ id: a.id, titulo: a.titulo, categoria: a.categoria ?? "outros", resumo, url: a.url });
      } else {
        feedback = revisao.motivo;
      }
    }
    if (!aprovado) reprovadas.push({ id: a.id, motivo: feedback ?? "" });
  }

  const arquivo = itens.length ? (await publicar(itens)).arquivo : null;
  return {
    candidatos,
    publicaveis: publicaveis.map((a) => a.id),
    aprovadas: itens.map((i) => i.id),
    reprovadas,
    arquivo,
    chamadas,
  };
}
