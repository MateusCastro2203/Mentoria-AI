import { readFileSync } from "node:fs";

export const CATEGORIAS = ["modelos", "ferramentas", "pesquisa", "regulacao", "mercado"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  fonte: string;
  url: string;
  publicadaEm: string;
}

/** Rótulo humano (gabarito), usado em calibração e evals a partir do Módulo 2. */
export interface Rotulo {
  relevante: boolean;
  categoria: Categoria | null;
}

export type NoticiaRotulada = Noticia & { rotulo: Rotulo };

export function carregarNoticias(
  caminho = new URL("../../dados/noticias.json", import.meta.url),
): NoticiaRotulada[] {
  return JSON.parse(readFileSync(caminho, "utf8"));
}

/** Exemplo rotulado para few-shot (Módulo 3). Fica fora do conjunto de avaliação. */
export interface Exemplo {
  id: string;
  titulo: string;
  resumo: string;
  rotulo: Rotulo;
}

export function carregarExemplos(
  caminho = new URL("../../dados/exemplos.json", import.meta.url),
): Exemplo[] {
  return JSON.parse(readFileSync(caminho, "utf8"));
}
