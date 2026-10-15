// Observabilidade (Módulo 8): toda chamada ao modelo passa por aqui, então é aqui que ela vira um evento.
// Quem quer rastrear assina com `observarChamadas`; quem quer dar contexto ao evento (qual papel, qual item,
// qual versão do prompt) envolve o trabalho em `comAtributos`. O contexto atravessa os `await` com
// AsyncLocalStorage, que existe no Node e no Cloudflare Workers (com `nodejs_compat`).
import { AsyncLocalStorage } from "node:async_hooks";

export type Atributos = Record<string, string | number | boolean | undefined>;

export interface EventoDeChamada {
  operacao: "texto" | "objeto" | "ferramentas";
  modelo: string;
  inicio: string;
  latenciaMs: number;
  tokensEntrada?: number;
  tokensSaida?: number;
  /** Mensagem do erro, se a chamada falhou (o erro continua sendo lançado para quem chamou). */
  erro?: string;
  /** O contexto de `comAtributos` no momento da chamada (ex.: { papel: "redigir", alvo: "n13" }). */
  atributos: Atributos;
}

export type Ouvinte = (evento: EventoDeChamada) => void;

const ouvintes = new Set<Ouvinte>();
const contexto = new AsyncLocalStorage<Atributos>();

/** Passa a receber um evento por chamada ao modelo. Devolve a função que cancela a assinatura. */
export function observarChamadas(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** Roda `fn` com estes atributos somados aos de fora; toda chamada ao modelo lá dentro os carrega. */
export function comAtributos<T>(atributos: Atributos, fn: () => T): T {
  return contexto.run({ ...contexto.getStore(), ...atributos }, fn);
}

export function atributosAtuais(): Atributos {
  return { ...contexto.getStore() };
}

/** Uso interno de gerar.ts. Um ouvinte com defeito não pode derrubar a chamada ao modelo. */
export function emitir(evento: Omit<EventoDeChamada, "atributos">): void {
  if (!ouvintes.size) return;
  const completo = { ...evento, atributos: atributosAtuais() };
  for (const ouvinte of ouvintes) {
    try {
      ouvinte(completo);
    } catch {
      // ignorado de propósito
    }
  }
}
