// DESAFIO EXTRA — proteções que um agente de produção precisa além do limite de passos.
import type { Decisor, Evento, Ferramentas } from "../loop.js";

export interface ResultadoProtegido {
  resposta: string | null;
  motivo: "respondeu" | "limite-de-passos" | "repeticao" | "orcamento";
  historico: Evento[];
  passos: number;
  custo: number;
}

/**
 * Como executarAgente, com duas proteções a mais:
 * - repetição: se o modelo pedir a MESMA ferramenta com a MESMA entrada (compare com JSON.stringify)
 *   `maxRepeticoes` vezes seguidas, pare com motivo "repeticao" ANTES de executar a última;
 * - orçamento: cada ferramenta tem um custo (`custos[nome]`, padrão 1). Se executar a próxima
 *   ultrapassar `orcamento`, pare com motivo "orcamento" sem executá-la.
 * `custo` no resultado = soma dos custos das ferramentas executadas.
 */
export async function executarAgenteProtegido(opcoes: {
  decidir: Decisor;
  ferramentas: Ferramentas;
  maxPassos: number;
  maxRepeticoes: number;
  orcamento: number;
  custos?: Record<string, number>;
}): Promise<ResultadoProtegido> {
  throw new Error("TODO (desafio): implemente executarAgenteProtegido");
}
