// ETAPA M4 — o curador empacotado como skill (formato Agent Skills: https://agentskills.io/specification).
// A mesma pasta serve para o nosso código e para qualquer agente compatível (Claude Code, Codex, Cursor…).
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LanguageModel } from "ai";
import { classificarTipado, type ResultadoClassificacao } from "../m02/classificar-tipado.js";
import { escaparXml } from "../m03/prompt-v2.js";
import type { Noticia } from "../noticia.js";

/** Pasta da skill do projeto. */
export const PASTA_SKILL = fileURLToPath(new URL("../../skills/curar-noticia/", import.meta.url));

export interface Skill {
  nome: string;
  descricao: string;
  /** Corpo do SKILL.md (tudo depois do frontmatter), sem espaços nas pontas. */
  instrucoes: string;
  /** Conteúdo de cada arquivo .md em references/, pelo caminho relativo (ex.: "references/guia.md"). */
  referencias: Record<string, string>;
}

/**
 * Lê e valida uma skill:
 * - o SKILL.md começa com um frontmatter entre linhas "---"; leia as chaves de UMA linha no formato
 *   `chave: valor` (tire aspas simples ou duplas das pontas do valor) e ignore as demais linhas;
 * - `name` obrigatório: 1 a 64 caracteres, só a-z, 0-9 e hífen, sem começar/terminar com hífen, sem "--",
 *   e IGUAL ao nome da pasta;
 * - `description` obrigatória: 1 a 1024 caracteres;
 * - qualquer violação → lance um Error cuja mensagem cite o campo ("name" ou "description");
 * - `referencias`: todos os .md da subpasta references/ (se ela existir).
 */
export function lerSkill(pasta: string): Skill {
  throw new Error("TODO (M4): implemente lerSkill");
}

/**
 * Prompt para classificar uma notícia com a skill:
 * - `system` = instruções da skill e, depois, cada referência dentro de
 *   <referencia arquivo="references/…">conteúdo</referencia>;
 * - `prompt` = a notícia em <noticia><titulo/><resumo/><fonte/></noticia>, escapada com escaparXml.
 */
export function montarPromptDaSkill(skill: Skill, noticia: Noticia): { system: string; prompt: string } {
  throw new Error("TODO (M4): implemente montarPromptDaSkill");
}

/** Classifica com a skill do projeto: classificarTipado usando montarPromptDaSkill(lerSkill(PASTA_SKILL), …). */
export async function classificarComSkill(
  noticia: Noticia,
  opcoes: { temperature?: number; modelo?: LanguageModel } = {},
): Promise<ResultadoClassificacao> {
  throw new Error("TODO (M4): implemente classificarComSkill");
}
