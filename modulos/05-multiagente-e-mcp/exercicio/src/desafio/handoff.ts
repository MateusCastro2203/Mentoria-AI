// DESAFIO EXTRA — HANDOFF: cada agente responde ou passa a conversa para outro (como uma central de atendimento).

export type RespostaDoAgente = { resposta: string } | { transferirPara: string; mensagem: string };

/**
 * Começa no agente `inicial` com `mensagem`. Cada agente devolve uma resposta (fim) ou uma transferência
 * para outro agente, com a mensagem que ele deve receber.
 * - `caminho`: os agentes que atenderam, na ordem (o inicial incluso);
 * - motivo "respondeu"; "desconhecido" se transferir para um agente que não existe;
 *   "ciclo" se transferir para um agente que JÁ está no caminho (ping-pong);
 *   "limite" se fizer mais de `maxTransferencias` transferências.
 * Nos casos de parada sem resposta, `resposta` é null.
 */
export async function executarHandoffs(opcoes: {
  agentes: Record<string, (mensagem: string) => Promise<RespostaDoAgente>>;
  inicial: string;
  mensagem: string;
  maxTransferencias: number;
}): Promise<{ resposta: string | null; caminho: string[]; motivo: "respondeu" | "desconhecido" | "ciclo" | "limite" }> {
  throw new Error("TODO (desafio): implemente executarHandoffs");
}
