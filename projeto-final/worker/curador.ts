// O Worker do curador com o SEU código (src/). Rode com: pnpm -F @mentoria/curador m08:dev
import { classificarTipado } from "../src/m02/classificar-tipado.js";
import { decidirPublicacao } from "../src/m03/guardrails.js";
import { montarPromptDaSkill } from "../src/m04/skill.js";
import { montarMarkdown } from "../src/m05/servidor-edicao.js";
import { montarGrafoHitl } from "../src/m07/grafo.js";
import { criarWorker } from "../src/m08/nuvem.js";
import * as prompts from "../src/m08/prompts.js";
import * as rastreio from "../src/m08/rastreio.js";
import skill from "../skills/curar-noticia/SKILL.md";
import { FEEDS, FONTES } from "./recursos.js";

// Se a sua skill tiver arquivos em references/, importe-os aqui: { "references/x.md": x }.
const referencias: Record<string, string> = {};

export default criarWorker(
  { classificarTipado, decidirPublicacao, montarPromptDaSkill, montarMarkdown, montarGrafoHitl, rastreio, prompts },
  { feeds: FEEDS, fontes: FONTES, skill, referencias },
);
