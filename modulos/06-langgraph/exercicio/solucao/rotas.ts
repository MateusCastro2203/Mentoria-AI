// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
import type { Atendimento, Categoria, Estado } from "../src/estado.js";

const DESTINO: Record<Categoria, Atendimento> = { cobranca: "financeiro", tecnico: "suporte", duvida: "faq" };

export function rotaDeTriagem(estado: Pick<Estado, "categoria" | "confianca">, limiar = 0.7): Atendimento {
  if (estado.confianca === null || estado.confianca < limiar || !estado.categoria) return "humano";
  return DESTINO[estado.categoria];
}
