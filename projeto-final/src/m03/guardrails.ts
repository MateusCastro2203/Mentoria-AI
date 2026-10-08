// ETAPA M3 — guardrails: regras no código que decidem o que pode ser publicado sozinho.
// O modelo classifica; o código decide se confia.
import type { ResultadoClassificacao } from "../m02/classificar-tipado.js";
import type { Noticia } from "../noticia.js";

export type MotivoFonte = "sem-url" | "url-invalida" | "protocolo-inseguro" | "host-nao-publico";

/**
 * A fonte é verificável?
 * - vazia (ou só espaços) → "sem-url"
 * - não é uma URL válida (new URL lança erro) → "url-invalida"
 * - protocolo diferente de https → "protocolo-inseguro"
 * - host que não é público: "localhost", terminado em ".local" ou ".internal", ou um endereço IP
 *   (IPv4 como 10.0.0.5, ou IPv6 entre colchetes) → "host-nao-publico"
 */
export function verificarFonte(url: string): { ok: true } | { ok: false; motivo: MotivoFonte } {
  throw new Error("TODO (M3): implemente verificarFonte");
}

/**
 * Procura sinais de prompt injection num texto que vai entrar no prompt (título, resumo).
 * Compare sem diferenciar maiúsculas e sem acentos. Sinais mínimos (o nome é o que vai em `sinais`):
 * - "ignorar-instrucoes": "ignore as instruções", "ignore todas as instruções",
 *   "ignore previous instructions", "ignore all previous instructions", "desconsidere as instruções"
 * - "troca-de-papel": "você agora é", "a partir de agora você é", "you are now"
 * - "prompt-do-sistema": "prompt do sistema", "system prompt"
 * - "ordem-de-classificacao": "classifique esta notícia como", "classifique essa notícia como"
 * - "tag-do-prompt": qualquer tag <noticia>, </noticia>, <system>, </system>, <regras> ou </regras>
 * Sem sinais → { suspeito: false, sinais: [] }.
 */
export function detectarInjecao(texto: string): { suspeito: boolean; sinais: string[] } {
  throw new Error("TODO (M3): implemente detectarInjecao");
}

export type Acao = "publicar" | "revisar" | "descartar";

/**
 * Decide o que fazer com a notícia classificada:
 * 1. junte os motivos para REVISÃO HUMANA, nesta ordem:
 *    - fonte não verificável → `fonte:<motivo>` (ex.: "fonte:sem-url")
 *    - injeção no título ou no resumo → `injecao:<sinal>` para cada sinal encontrado
 *    - classificação sem sucesso → `saida:<motivo>` (ex.: "saida:inconsistente")
 *    - confiança abaixo de `limiarConfianca` (padrão 0.9) → "confianca-baixa"
 * 2. se houver algum motivo → { acao: "revisar", motivos }
 * 3. senão, se não é relevante → { acao: "descartar", motivos: ["irrelevante"] }
 * 4. senão → { acao: "publicar", motivos: [] }
 */
export function decidirPublicacao(
  noticia: Noticia,
  resultado: ResultadoClassificacao,
  opcoes: { limiarConfianca?: number } = {},
): { acao: Acao; motivos: string[] } {
  throw new Error("TODO (M3): implemente decidirPublicacao");
}
