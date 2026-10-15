// O Worker do curador com as soluções de referência. Rode com: pnpm -F @mentoria/curador m08:dev:solucao
import { classificarTipado } from "../solucao/m02/classificar-tipado.js";
import { decidirPublicacao } from "../solucao/m03/guardrails.js";
import { montarPromptDaSkill } from "../solucao/m04/skill.js";
import { montarMarkdown } from "../solucao/m05/servidor-edicao.js";
import { montarGrafoHitl } from "../solucao/m07/grafo.js";
import { criarWorker } from "../src/m08/nuvem.js";
import * as prompts from "../solucao/m08/prompts.js";
import * as rastreio from "../solucao/m08/rastreio.js";
import skill from "../solucao/skills/curar-noticia/SKILL.md";
import guia from "../solucao/skills/curar-noticia/references/guia-de-rotulagem.md";
import { FEEDS, FONTES } from "./recursos.js";

export default criarWorker(
  { classificarTipado, decidirPublicacao, montarPromptDaSkill, montarMarkdown, montarGrafoHitl, rastreio, prompts },
  { feeds: FEEDS, fontes: FONTES, skill, referencias: { "references/guia-de-rotulagem.md": guia } },
);
