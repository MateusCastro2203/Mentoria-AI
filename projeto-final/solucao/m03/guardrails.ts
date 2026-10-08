// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import type { ResultadoClassificacao } from "../../src/m02/classificar-tipado.js";
import type { Noticia } from "../../src/noticia.js";

export type MotivoFonte = "sem-url" | "url-invalida" | "protocolo-inseguro" | "host-nao-publico";

export function verificarFonte(url: string): { ok: true } | { ok: false; motivo: MotivoFonte } {
  if (!url.trim()) return { ok: false, motivo: "sem-url" };
  let endereco: URL;
  try {
    endereco = new URL(url);
  } catch {
    return { ok: false, motivo: "url-invalida" };
  }
  if (endereco.protocol !== "https:") return { ok: false, motivo: "protocolo-inseguro" };
  const host = endereco.hostname.toLowerCase();
  const ehIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (ehIp || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, motivo: "host-nao-publico" };
  }
  return { ok: true };
}

const SINAIS: [string, RegExp][] = [
  ["ignorar-instrucoes", /(ignore (as |todas as )?instrucoes|ignore (all )?previous instructions|desconsidere as instrucoes)/],
  ["troca-de-papel", /(voce agora e|a partir de agora voce e|you are now)/],
  ["prompt-do-sistema", /(prompt do sistema|system prompt)/],
  ["ordem-de-classificacao", /classifique (esta|essa) noticia como/],
  ["tag-do-prompt", /<\/?(noticia|system|regras)>/],
];

export function detectarInjecao(texto: string): { suspeito: boolean; sinais: string[] } {
  const normalizado = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const sinais = SINAIS.filter(([, padrao]) => padrao.test(normalizado)).map(([nome]) => nome);
  return { suspeito: sinais.length > 0, sinais };
}

export type Acao = "publicar" | "revisar" | "descartar";

export function decidirPublicacao(
  noticia: Noticia,
  resultado: ResultadoClassificacao,
  opcoes: { limiarConfianca?: number } = {},
): { acao: Acao; motivos: string[] } {
  const limiar = opcoes.limiarConfianca ?? 0.9;
  const motivos: string[] = [];
  const fonte = verificarFonte(noticia.url);
  if (!fonte.ok) motivos.push(`fonte:${fonte.motivo}`);
  const injecao = detectarInjecao(`${noticia.titulo}\n${noticia.resumo}`);
  motivos.push(...injecao.sinais.map((s) => `injecao:${s}`));
  if (!resultado.ok) motivos.push(`saida:${resultado.motivo}`);
  else if (resultado.decisao.confianca < limiar) motivos.push("confianca-baixa");

  if (motivos.length > 0) return { acao: "revisar", motivos };
  if (resultado.ok && !resultado.decisao.relevante) return { acao: "descartar", motivos: ["irrelevante"] };
  return { acao: "publicar", motivos: [] };
}
