// Classificador de mentira: decide por palavra-chave e conta quantas vezes foi chamado.
import type { Categoria, Classificador } from "../src/estado.js";

export function classificadorFalso() {
  const chamados: string[] = [];
  const classificar: Classificador = async (texto) => {
    chamados.push(texto);
    const t = texto.toLowerCase();
    const categoria: Categoria = /boleto|cobran|fatura/.test(t) ? "cobranca" : /erro|trava|login/.test(t) ? "tecnico" : "duvida";
    return { categoria, confianca: /talvez|acho/.test(t) ? 0.4 : 0.9 };
  };
  return { classificar, chamados };
}

export const thread = (id: string) => ({ configurable: { thread_id: id } });
