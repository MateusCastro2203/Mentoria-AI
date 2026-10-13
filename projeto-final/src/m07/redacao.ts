// Fornecido: o ciclo redator ⇄ revisor da M5/M6 como função, para reaproveitar em mais de um nó.
import type { ItemEdicao } from "../m05/servidor-edicao.js";
import type { Papeis } from "../m05/time.js";
import type { ItemAvaliado } from "../m06/estado.js";

export async function redigirComRevisao(
  papeis: Papeis,
  item: ItemAvaliado,
  maxTentativas = 2,
): Promise<{ aprovado: ItemEdicao } | { reprovado: { id: string; motivo: string } }> {
  let feedback: string | undefined;
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const resumo = await papeis.redigir(item.id, feedback);
    const revisao = await papeis.revisar(item.id, resumo);
    if (revisao.aprovado) return { aprovado: { id: item.id, titulo: item.titulo, categoria: item.categoria ?? "outros", resumo, url: item.url } };
    feedback = revisao.motivo;
  }
  return { reprovado: { id: item.id, motivo: feedback ?? "" } };
}
