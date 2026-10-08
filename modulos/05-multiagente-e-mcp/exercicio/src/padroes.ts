// Padrões multiagente como funções. Um "agente" aqui é qualquer função assíncrona: nos testes, funções
// de mentira; na vida real, um LLM com ferramentas. O padrão é a forma de ligar os agentes.

export type Agente<E = unknown, S = unknown> = (entrada: E) => Promise<S>;

/**
 * PIPELINE: cada etapa recebe a saída da anterior (a primeira recebe `entrada`).
 * Devolve a saída final e `rastro` com o nome de cada etapa, na ordem em que rodou.
 * Se uma etapa lançar erro, relance com a mensagem "etapa <nome>: <mensagem original>".
 */
export function emPipeline(etapas: { nome: string; executar: Agente<any, any> }[]): Agente<unknown, { saida: unknown; rastro: string[] }> {
  throw new Error("TODO: implemente emPipeline");
}

export interface Rodada {
  trabalhador: string;
  saida: unknown;
}

/**
 * SUPERVISOR: um agente escolhe, a cada rodada, qual trabalhador chamar (ou "fim").
 * - `escolher(tarefa, rodadas)` devolve o nome do trabalhador ou "fim";
 * - o trabalhador escolhido recebe { tarefa, rodadas } (o que já foi feito) e a saída vai para `rodadas`;
 * - motivo "fim" quando o supervisor encerra; "limite" ao completar `maxRodadas` rodadas sem "fim";
 *   "trabalhador-desconhecido" se ele escolher um nome que não existe (pare na hora, sem executar).
 */
export async function comSupervisor(opcoes: {
  tarefa: string;
  escolher: (tarefa: string, rodadas: Rodada[]) => Promise<string> | string;
  trabalhadores: Record<string, Agente<{ tarefa: string; rodadas: Rodada[] }, unknown>>;
  maxRodadas: number;
}): Promise<{ rodadas: Rodada[]; motivo: "fim" | "limite" | "trabalhador-desconhecido" }> {
  throw new Error("TODO: implemente comSupervisor");
}

/**
 * GERADOR + REVISOR (avaliador-otimizador): gera, revisa; se reprovado, gera de novo com o motivo
 * como feedback, até `maxTentativas` gerações. Devolve a última saída gerada, se foi aprovada,
 * quantas tentativas usou e a lista de motivos das reprovações.
 */
export async function comRevisao<S>(opcoes: {
  gerar: (feedback?: string) => Promise<S>;
  revisar: (saida: S) => Promise<{ aprovado: boolean; motivo: string }>;
  maxTentativas: number;
}): Promise<{ saida: S; aprovado: boolean; tentativas: number; reprovacoes: string[] }> {
  throw new Error("TODO: implemente comRevisao");
}
