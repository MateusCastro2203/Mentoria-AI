// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
import { ATENDIMENTOS, type Categoria, type Estado, type GrafoTriagem } from "../../src/estado.js";

export async function corrigirCategoria(
  grafo: GrafoTriagem,
  config: { configurable: { thread_id: string } },
  categoria: Categoria,
): Promise<Estado> {
  for await (const checkpoint of grafo.getStateHistory(config)) {
    const [proximo, ...resto] = checkpoint.next;
    if (resto.length === 0 && (ATENDIMENTOS as readonly string[]).includes(proximo ?? "")) {
      const ramo = await grafo.updateState(checkpoint.config as typeof config, { categoria, confianca: 1 }, "classificar");
      return grafo.invoke(null, ramo);
    }
  }
  throw new Error("nada para corrigir: nenhum checkpoint depois da classificação");
}
