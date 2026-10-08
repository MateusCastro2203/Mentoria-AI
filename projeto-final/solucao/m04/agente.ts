// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { gerarComFerramentas, type ChamadaDeFerramenta } from "@mentoria/llm";
import type { LanguageModel } from "ai";
import { criarFerramentas, type Avaliacao, type Dependencias } from "./ferramentas.js";

export interface ResultadoDoAgente {
  selecao: string[];
  recusadas: { id: string; motivo: "nao-avaliada" | "nao-publicavel" }[];
  entregou: boolean;
  fontesLidas: string[];
  passos: number;
  chamadas: ChamadaDeFerramenta[];
}

export function validarSelecao(
  propostos: string[],
  avaliacoes: Map<string, Avaliacao>,
): { selecao: string[]; recusadas: ResultadoDoAgente["recusadas"] } {
  const selecao: string[] = [];
  const recusadas: ResultadoDoAgente["recusadas"] = [];
  for (const id of new Set(propostos)) {
    const avaliacao = avaliacoes.get(id);
    if (!avaliacao) recusadas.push({ id, motivo: "nao-avaliada" });
    else if (avaliacao.acao !== "publicar") recusadas.push({ id, motivo: "nao-publicavel" });
    else selecao.push(id);
  }
  return { selecao, recusadas };
}

export const INSTRUCOES_DO_AGENTE = [
  "Você monta a seleção semanal de uma newsletter sobre IA aplicada para desenvolvedores.",
  "1. Use listarFontes para ver as fontes e as descrições.",
  "2. Leia com lerFonte só as fontes que podem ter notícias úteis para devs que constroem com IA.",
  "3. Avalie as notícias promissoras com avaliarNoticias (pode mandar várias de uma vez).",
  "4. Entregue com entregarSelecao os ids cuja avaliação foi \"publicar\".",
  "Não invente ids: use só os que as ferramentas devolveram.",
].join("\n");

export async function curarComAgente(
  deps: Dependencias,
  opcoes: { modelo?: LanguageModel; maxPassos?: number } = {},
): Promise<ResultadoDoAgente> {
  const { ferramentas, registro } = criarFerramentas(deps);
  const r = await gerarComFerramentas({
    system: INSTRUCOES_DO_AGENTE,
    prompt: "Monte a seleção desta semana.",
    temperature: 0,
    ferramentas,
    maxPassos: opcoes.maxPassos ?? 12,
    pararAoChamar: "entregarSelecao",
    modelo: opcoes.modelo,
  });
  const { selecao, recusadas } = validarSelecao(registro.selecaoEntregue ?? [], registro.avaliacoes);
  return {
    selecao,
    recusadas,
    entregou: registro.selecaoEntregue !== null,
    fontesLidas: registro.fontesLidas,
    passos: r.passos,
    chamadas: r.chamadas,
  };
}
