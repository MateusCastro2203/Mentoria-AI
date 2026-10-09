import type { Categoria, Estado, GrafoTriagem } from "../estado.js";

/**
 * VIAGEM NO TEMPO: o classificador errou a categoria do ÚLTIMO chamado da thread. Corrija e refaça
 * só o que vem depois da classificação, sem chamar o classificador de novo.
 *
 * 1. Percorra `grafo.getStateHistory(config)` (do mais novo para o mais antigo) e ache o checkpoint
 *    logo depois de "classificar": aquele cujo `next` é um único nó de atendimento (ATENDIMENTOS).
 * 2. `grafo.updateState(checkpoint.config, { categoria, confianca: 1 }, "classificar")` cria um NOVO
 *    checkpoint (um ramo), como se "classificar" tivesse devolvido a correção. A aresta condicional
 *    é reavaliada a partir dele.
 * 3. `grafo.invoke(null, novoConfig)` continua desse ramo e devolve o estado final.
 *
 * Se não houver um checkpoint assim, lance um erro com "nada para corrigir".
 */
export async function corrigirCategoria(
  grafo: GrafoTriagem,
  config: { configurable: { thread_id: string } },
  categoria: Categoria,
): Promise<Estado> {
  throw new Error("TODO: implemente corrigirCategoria");
}
