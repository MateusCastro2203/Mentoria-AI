// Provider do promptfoo que roda o curador de verdade (classificação + guardrails) para a notícia {{id}}.
// config.versao: "v1" (prompt da M2) ou "v2" (prompt da M3).
import { carregarNoticias } from "../src/noticia.js";
import { classificarTipado, decidirPublicacao, montarPromptV2 } from "./modulos.js";

const noticias = carregarNoticias();

export default class Curador {
  private versao: "v1" | "v2";

  constructor(opcoes: { config?: { versao?: "v1" | "v2" } } = {}) {
    this.versao = opcoes.config?.versao ?? "v1";
  }

  id = () => `curador-${this.versao}`;

  callApi = async (_prompt: string, contexto: { vars: Record<string, unknown> }) => {
    const noticia = noticias.find((n) => n.id === contexto.vars.id);
    if (!noticia) return { error: `notícia ${String(contexto.vars.id)} não encontrada` };
    const inicio = Date.now();
    const resultado = await classificarTipado(noticia, {
      montarPrompt: this.versao === "v2" ? (n) => montarPromptV2(n) : undefined,
    });
    const publicacao = decidirPublicacao(noticia, resultado);
    return { output: JSON.stringify({ resultado, publicacao }), metadata: { latenciaMs: Date.now() - inicio } };
  };
}
