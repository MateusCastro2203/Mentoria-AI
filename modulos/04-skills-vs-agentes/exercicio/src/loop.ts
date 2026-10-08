// Um agente, sem biblioteca: um loop em que o "modelo" escolhe a próxima ação e o código executa.
// Entender este loop é entender o que o AI SDK (e qualquer framework de agentes) faz por baixo.

export type Acao =
  | { tipo: "ferramenta"; nome: string; entrada: unknown }
  | { tipo: "resposta"; texto: string };

export type Evento =
  | { tipo: "ferramenta"; nome: string; entrada: unknown; saida: unknown }
  | { tipo: "erro"; nome: string; entrada: unknown; mensagem: string };

/** O "modelo": olha o histórico e decide a próxima ação. Nos testes é um roteiro; na vida real, um LLM. */
export type Decisor = (historico: Evento[]) => Promise<Acao> | Acao;

export type Ferramentas = Record<string, (entrada: any) => Promise<unknown> | unknown>;

export interface ResultadoDoLoop {
  resposta: string | null;
  motivo: "respondeu" | "limite-de-passos";
  historico: Evento[];
  passos: number;
}

/**
 * O loop:
 * - a cada passo, chame `decidir(historico)` (passos começa em 0 e conta cada chamada a `decidir`);
 * - "resposta" → termine com { resposta, motivo: "respondeu" };
 * - "ferramenta" com nome existente → execute e acrescente { tipo: "ferramenta", nome, entrada, saida };
 * - "ferramenta" com nome desconhecido, ou que lance erro → acrescente
 *   { tipo: "erro", nome, entrada, mensagem } (mensagem: "ferramenta desconhecida: <nome>" ou a do erro)
 *   e continue: o modelo precisa ver o erro para se corrigir;
 * - ao chegar em `maxPassos` chamadas sem resposta → { resposta: null, motivo: "limite-de-passos" }.
 */
export async function executarAgente(opcoes: {
  decidir: Decisor;
  ferramentas: Ferramentas;
  maxPassos: number;
}): Promise<ResultadoDoLoop> {
  throw new Error("TODO: implemente executarAgente");
}
