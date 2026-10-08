// ETAPA M5 — o time: quatro papéis numa linha de produção (pipeline), com um ciclo redator ⇄ revisor.
// A ORQUESTRAÇÃO é código (um workflow); só o coletor é um agente. Os papéis são injetados.
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
  /** Coletor: devolve os ids candidatos (no projeto, um agente lendo as fontes via MCP). */
  coletar(): Promise<string[]>;
  /** Classificador: skill + guardrails (M3/M4). */
  classificar(id: string): Promise<ItemAvaliado>;
  /** Redator: o resumo do item; na 2ª tentativa recebe o motivo da reprovação. */
  redigir(id: string, feedback?: string): Promise<string>;
  /** Revisor: aprova ou reprova o resumo, com motivo. */
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

/**
 * 1. candidatos = coletar() (sem repetir ids, na ordem);
 * 2. classifica cada candidato (um por vez); publicáveis = acao "publicar", ordenados por confiança
 *    (maior primeiro; empate: ordem dos candidatos); fica com os `maxItens` primeiros (padrão 10);
 * 3. para cada publicável: resumo = redigir(id); revisao = revisar(id, resumo); se reprovado, tenta de novo
 *    com redigir(id, revisao.motivo), até `maxTentativas` redações no total (padrão 2). Se nenhuma for
 *    aprovada → reprovadas.push({ id, motivo do último revisar }).
 * 4. se houver aprovadas, publicar(itens) na ordem das aprovadas, com { id, titulo, categoria, resumo, url };
 *    arquivo = o que publicar devolver. Sem aprovadas, não chama publicar (arquivo null).
 * Conte quantas vezes cada papel foi chamado em `chamadas`.
 */
export async function montarEdicao(
  papeis: Papeis,
  publicar: (itens: ItemEdicao[]) => Promise<{ arquivo: string }>,
  opcoes: { maxItens?: number; maxTentativas?: number } = {},
): Promise<RelatorioDaEdicao> {
  throw new Error("TODO (M5): implemente montarEdicao");
}
