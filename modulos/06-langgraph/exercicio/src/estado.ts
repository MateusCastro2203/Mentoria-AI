// Fornecido: o estado do grafo de triagem. Cada campo é um "canal".
// - Campos simples (categoria, resposta…) são SUBSTITUÍDOS a cada atualização.
// - `historico` tem um reducer: cada atualização é CONCATENADA ao que já existe. Como o checkpointer
//   guarda o estado por thread, o histórico sobrevive entre uma chamada e outra da mesma conversa.
import { ReducedValue, StateSchema, type StateSnapshot } from "@langchain/langgraph";
import { z } from "zod";

export const CATEGORIAS = ["cobranca", "tecnico", "duvida"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Os nós de atendimento. O nome de um nó NÃO pode ser igual ao de um campo do estado. */
export const ATENDIMENTOS = ["financeiro", "suporte", "faq", "humano"] as const;
export type Atendimento = (typeof ATENDIMENTOS)[number];

export const RESPOSTAS: Record<Atendimento, string> = {
  financeiro: "Financeiro: vamos conferir a sua cobrança e respondemos em até 1 dia útil.",
  suporte: "Suporte: abrimos um chamado técnico com os detalhes que você mandou.",
  faq: "Talvez isto ajude: veja as perguntas frequentes na central de ajuda.",
  humano: "Uma pessoa do time vai ler o seu chamado e responder.",
};

const AtendimentoRegistrado = z.object({ chamado: z.string(), atendidoPor: z.enum(ATENDIMENTOS) });

export const EstadoTriagem = new StateSchema({
  chamado: z.string(),
  categoria: z.enum(CATEGORIAS).nullable().default(null),
  confianca: z.number().nullable().default(null),
  resposta: z.string().nullable().default(null),
  atendidoPor: z.enum(ATENDIMENTOS).nullable().default(null),
  historico: new ReducedValue(z.array(AtendimentoRegistrado).default(() => []), {
    inputSchema: z.array(AtendimentoRegistrado),
    reducer: (atual: z.infer<typeof AtendimentoRegistrado>[], novo: z.infer<typeof AtendimentoRegistrado>[]) => atual.concat(novo),
  }),
});

export type Estado = typeof EstadoTriagem.State;

/** Quem classifica o chamado: nos testes, uma função de mentira; na vida real, um LLM. */
export type Classificador = (chamado: string) => Promise<{ categoria: Categoria; confianca: number }>;

type Config = { configurable: { thread_id: string; checkpoint_id?: string } };

/** O que o grafo compilado oferece (o tipo completo do LangGraph é enorme; isto é o que usamos). */
export interface GrafoTriagem {
  invoke(entrada: { chamado: string } | null, config?: Config): Promise<Estado>;
  getState(config: Config): Promise<StateSnapshot>;
  getStateHistory(config: Config): AsyncIterable<StateSnapshot>;
  updateState(config: Config, valores: Partial<Estado>, comoNo?: string): Promise<Config>;
  getGraphAsync(): Promise<{ drawMermaid(): string }>;
}
