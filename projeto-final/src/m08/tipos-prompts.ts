// Fornecido (M8): os formatos e as peças prontas do registro de versões do prompt (src/m08/prompts.ts).
import type { Armazenamento } from "./armazenamento.js";

/** Resultado da eval de UMA versão (gerado por `m08:avaliar`). */
export interface Avaliacao {
  /** hash do texto avaliado: tem que ser o mesmo da versão promovida. */
  hash: string;
  modelo: string;
  casos: number;
  macroF1: number;
  acuracia: number;
  /** Casos especiais (injeção, sem fonte, fonte insegura) que seriam publicados. Tem que ser 0. */
  especiaisPublicados: number;
}

export interface VersaoDePrompt {
  id: string;
  texto: string;
  hash: string;
  criadaEm: string;
  avaliacao?: Avaliacao;
}

export interface Portao {
  macroF1Minimo: number;
  /** Quanto o macro-F1 pode cair em relação à versão ativa (só compara se o modelo for o mesmo). */
  toleranciaContraAtiva: number;
}
export const PORTAO_PADRAO: Portao = { macroF1Minimo: 0.8, toleranciaContraAtiva: 0.02 };

/** Chaves no armazenamento. */
export const CHAVES = {
  versao: (id: string) => `prompt:versao:${id}`,
  ativo: "prompt:ativo",
  /** JSON com a lista dos ids que já estiveram ativos, o mais recente no fim. */
  historico: "prompt:historico",
} as const;

export class PortaoReprovado extends Error {
  constructor(readonly motivos: string[]) {
    super(`reprovada no portão: ${motivos.join("; ")}`);
    this.name = "PortaoReprovado";
  }
}

/** SHA-256 do texto, em hexadecimal, primeiros 12 caracteres. Funciona no Node e no Workers. */
export async function hashDoTexto(texto: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

export async function lerHistorico(arm: Armazenamento): Promise<string[]> {
  return JSON.parse((await arm.get(CHAVES.historico)) ?? "[]");
}

