// ETAPA M4 — as ferramentas do agente. O agente escolhe O QUE fazer; as ferramentas fazem, sempre do mesmo jeito.
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { Acao } from "../m03/guardrails.js";
import type { Fonte, Noticia } from "../noticia.js";

/** Resultado de avaliar uma notícia (classificação + guardrails da M3). */
export interface Avaliacao {
  id: string;
  acao: Acao;
  categoria: string | null;
  confianca: number | null;
  motivos: string[];
}

/** O que o agente fez: fica fora do modelo, no código. */
export interface Registro {
  fontesLidas: string[];
  avaliacoes: Map<string, Avaliacao>;
  /** Ids entregues pelo agente na ferramenta entregarSelecao (null se ele não entregou). */
  selecaoEntregue: string[] | null;
}

export interface Dependencias {
  fontes: Fonte[];
  noticias: Noticia[];
  /** Avalia uma notícia (no projeto: classificarComSkill + decidirPublicacao). Injetada para os testes. */
  avaliar: (noticia: Noticia) => Promise<Avaliacao>;
}

/**
 * Cria as quatro ferramentas e o registro. Cada uma com `description` clara e `inputSchema` Zod:
 *
 * - listarFontes({}) → [{ nome, descricao, quantidade }] de todas as fontes.
 * - lerFonte({ fonte }) → [{ id, titulo }] das notícias da fonte; registra a fonte em `fontesLidas`
 *   (sem repetir). Fonte inexistente → { erro: "fonte desconhecida: <nome>" } (não lance erro:
 *   o modelo precisa ler a mensagem e se corrigir).
 * - avaliarNoticias({ ids }) → uma Avaliacao por id (use `avaliar`); guarda cada uma em `avaliacoes`.
 *   Id inexistente → { id, erro: "notícia desconhecida" } no lugar da avaliação. Não avalie de novo
 *   um id que já está em `avaliacoes` (devolva a avaliação guardada).
 * - entregarSelecao({ ids }) → guarda os ids em `selecaoEntregue` e devolve { recebidos: n }.
 */
export function criarFerramentas(deps: Dependencias): { ferramentas: ToolSet; registro: Registro } {
  throw new Error("TODO (M4): implemente criarFerramentas");
}
