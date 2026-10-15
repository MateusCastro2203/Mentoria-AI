// Fornecido: os formatos do exercício. Um job agendado (Cloudflare Worker com Cron Trigger) que, todo dia,
// resume os chamados de suporte abertos naquele dia com um LLM e guarda o resultado num KV.

export interface Chamado {
  id: string;
  /** Data de abertura, AAAA-MM-DD. */
  aberto: string;
  prioridade: "alta" | "media" | "baixa";
  titulo: string;
  texto: string;
}

export interface Uso {
  tokensEntrada?: number;
  tokensSaida?: number;
}

/** Preço por MILHÃO de tokens (valores do seu provedor; nos testes, números inventados). */
export interface Precos {
  entradaPorMilhao: number;
  saidaPorMilhao: number;
}

/** Falha que vale tentar de novo: limite de taxa (429), erro do servidor (5xx), rede, timeout. */
export class ErroTransitorio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroTransitorio";
  }
}

/** O mínimo que usamos de um KV. O Workers KV (`env.RESUMOS`) já tem esse formato. */
export interface Armazenamento {
  get(chave: string): Promise<string | null>;
  put(chave: string, valor: string): Promise<void>;
}

/** Tudo o que vem de fora entra por aqui: nos testes, versões falsas; no Worker, as de verdade. */
export interface Dependencias {
  armazenamento: Armazenamento;
  resumir(chamados: Chamado[]): Promise<{ texto: string; uso: Uso }>;
  esperar(ms: number): Promise<void>;
  agora(): Date;
}

export interface Politica {
  /** Total de tentativas, contando a primeira. */
  maxTentativas: number;
  /** Espera antes da 2ª tentativa; dobra a cada nova tentativa (1 s, 2 s, 4 s…). */
  esperaInicialMs: number;
  /** Teto de custo ESTIMADO por execução. Acima disso, nem chama o modelo. */
  orcamento: number;
  precos: Precos;
}

export const POLITICA_PADRAO: Politica = {
  maxTentativas: 3,
  esperaInicialMs: 1000,
  orcamento: 0.01,
  precos: { entradaPorMilhao: 0, saidaPorMilhao: 0 },
};

export type Status = "ok" | "falhou" | "orcamento" | "sem-chamados";

export interface Registro {
  data: string;
  status: Status;
  chamados: number;
  tentativas: number;
  tokensEntrada: number;
  tokensSaida: number;
  custo: number;
  resumo?: string;
  erro?: string;
  /** Quando foi gravado (deps.agora().toISOString()). */
  em: string;
}

export const chaveDoDia = (data: string) => `execucao:${data}`;

/** Um número de 0 a 99 que depende só da chave (hash FNV-1a). Usado no desafio. */
export function balde(chave: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}
