// Provider do promptfoo que roda o curador de verdade (classificação + guardrails) para a notícia {{id}}.
// config.versao: "v1" (prompt da M2), "v2" (prompt da M3) ou "skill" (a skill da M4 na pasta SKILL_PASTA, M8).
import { carregarNoticias } from "../src/noticia.js";
import { classificarTipado, decidirPublicacao, lerSkill, montarPromptDaSkill, montarPromptV2 } from "./modulos.js";

const noticias = carregarNoticias();

export default class Curador {
  private versao: "v1" | "v2" | "skill";

  constructor(opcoes: { config?: { versao?: "v1" | "v2" | "skill" } } = {}) {
    this.versao = opcoes.config?.versao ?? "v1";
  }

  private montarPrompt() {
    if (this.versao === "v2") return (n: Parameters<typeof montarPromptV2>[0]) => montarPromptV2(n);
    if (this.versao !== "skill") return undefined;
    if (!process.env.SKILL_PASTA) throw new Error("defina SKILL_PASTA (a pasta da skill a avaliar)");
    const skill = lerSkill(process.env.SKILL_PASTA);
    return (n: Parameters<typeof montarPromptV2>[0]) => montarPromptDaSkill(skill, n);
  }

  id = () => `curador-${this.versao}`;

  callApi = async (_prompt: string, contexto: { vars: Record<string, unknown> }) => {
    const noticia = noticias.find((n) => n.id === contexto.vars.id);
    if (!noticia) return { error: `notícia ${String(contexto.vars.id)} não encontrada` };
    const inicio = Date.now();
    const resultado = await classificarTipado(noticia, { montarPrompt: this.montarPrompt() });
    const publicacao = decidirPublicacao(noticia, resultado);
    return { output: JSON.stringify({ resultado, publicacao }), metadata: { latenciaMs: Date.now() - inicio } };
  };
}
