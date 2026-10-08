// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LanguageModel } from "ai";
import { classificarTipado, type ResultadoClassificacao } from "../m02/classificar-tipado.js";
import { escaparXml } from "../m03/prompt-v2.js";
import type { Noticia } from "../../src/noticia.js";

export const PASTA_SKILL = fileURLToPath(new URL("../skills/curar-noticia/", import.meta.url));

export interface Skill {
  nome: string;
  descricao: string;
  instrucoes: string;
  referencias: Record<string, string>;
}

const NOME_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function lerSkill(pasta: string): Skill {
  const texto = readFileSync(join(pasta, "SKILL.md"), "utf8");
  const partes = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!partes) throw new Error("SKILL.md sem frontmatter: falta o bloco entre --- com name e description");
  const campos: Record<string, string> = {};
  for (const linha of partes[1]!.split(/\r?\n/)) {
    const m = linha.match(/^([A-Za-z-]+):\s*(.+)$/);
    if (m) campos[m[1]!] = m[2]!.trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  const nome = campos.name ?? "";
  const descricao = campos.description ?? "";
  if (nome.length < 1 || nome.length > 64 || !NOME_VALIDO.test(nome)) {
    throw new Error(`name inválido: "${nome}" (1–64 caracteres, a-z, 0-9 e hífens simples)`);
  }
  if (nome !== basename(pasta.replace(/\/+$/, ""))) throw new Error(`name "${nome}" diferente do nome da pasta`);
  if (descricao.length < 1 || descricao.length > 1024) throw new Error("description precisa ter de 1 a 1024 caracteres");

  const pastaRefs = join(pasta, "references");
  const referencias: Record<string, string> = {};
  if (existsSync(pastaRefs)) {
    for (const arquivo of readdirSync(pastaRefs).filter((a) => a.endsWith(".md")).sort()) {
      referencias[`references/${arquivo}`] = readFileSync(join(pastaRefs, arquivo), "utf8");
    }
  }
  return { nome, descricao, instrucoes: partes[2]!.trim(), referencias };
}

export function montarPromptDaSkill(skill: Skill, noticia: Noticia): { system: string; prompt: string } {
  const refs = Object.entries(skill.referencias).map(
    ([arquivo, conteudo]) => `<referencia arquivo="${arquivo}">\n${conteudo.trim()}\n</referencia>`,
  );
  const system = [skill.instrucoes, ...refs].join("\n\n");
  const prompt = [
    "<noticia>",
    `<titulo>${escaparXml(noticia.titulo)}</titulo>`,
    `<resumo>${escaparXml(noticia.resumo)}</resumo>`,
    `<fonte>${escaparXml(noticia.fonte)}</fonte>`,
    "</noticia>",
  ].join("\n");
  return { system, prompt };
}

export async function classificarComSkill(
  noticia: Noticia,
  opcoes: { temperature?: number; modelo?: LanguageModel } = {},
): Promise<ResultadoClassificacao> {
  const skill = lerSkill(PASTA_SKILL);
  return classificarTipado(noticia, { ...opcoes, montarPrompt: (n) => montarPromptDaSkill(skill, n) });
}
