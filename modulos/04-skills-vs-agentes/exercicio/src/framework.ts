// O framework de decisão da aula, em código: prompt, skill, agente ou decisão estruturada?

export type Abordagem = "prompt" | "skill" | "agente" | "decisao-estruturada";

/** As perguntas do framework, respondidas para um caso. */
export interface Caso {
  /** O resultado é texto para uma pessoa, ou um valor de um conjunto fechado que o código usa? */
  saida: "texto" | "decisao";
  /** Os passos são sempre os mesmos, ou dependem do que se descobre no caminho? */
  passos: "fixos" | "variaveis";
  /** Precisa buscar dados ou agir em sistemas externos (ferramentas)? */
  precisaDeFerramentas: boolean;
  /** Será usado de novo, por várias pessoas ou em vários lugares? */
  reuso: "pontual" | "recorrente";
  /** Depende de conhecimento específico extenso (checklists, guias, arquivos de referência)? */
  conhecimentoEspecifico: boolean;
  /** Alto volume ou baixa latência (muitas chamadas por dia, resposta em tempo real)? */
  volumeAlto: boolean;
}

/**
 * Aplica as regras NESTA ORDEM (a primeira que casar decide):
 * 1. passos "variaveis" E precisaDeFerramentas → "agente"
 * 2. saida "decisao" E passos "fixos" → "decisao-estruturada"
 * 3. reuso "recorrente" OU conhecimentoEspecifico → "skill"
 * 4. senão → "prompt"
 *
 * `motivos`: uma frase para a regra que decidiu e, se volumeAlto for true, também a frase
 * "alto volume: custo e latência por chamada pesam" (em qualquer abordagem).
 * As frases exatas da regra são livres, mas cada uma deve citar o critério (ex.: "passos variáveis").
 */
export function recomendarAbordagem(caso: Caso): { abordagem: Abordagem; motivos: string[] } {
  throw new Error("TODO: implemente recomendarAbordagem");
}
