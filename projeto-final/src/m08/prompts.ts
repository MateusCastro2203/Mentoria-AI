// ETAPA M8 — versões do prompt, com portão de avaliação e rollback.
// O prompt do classificador (a skill da M4) vira um artefato versionado, guardado no mesmo KV do Worker:
// trocar a versão ativa (ou voltar para a anterior) não exige novo deploy.
// Os formatos (VersaoDePrompt, Avaliacao, Portao), as CHAVES e hashDoTexto estão em tipos-prompts.ts.
import type { Armazenamento } from "./armazenamento.js";
import type { Avaliacao, Portao, VersaoDePrompt } from "./tipos-prompts.js";
import { PORTAO_PADRAO } from "./tipos-prompts.js";

export * from "./tipos-prompts.js";

/**
 * Guarda uma versão nova (sem ativar). Uma versão é imutável:
 * - id novo → grava { id, texto, hash, criadaEm: agora.toISOString() } em CHAVES.versao(id) e devolve;
 * - id que já existe com o MESMO hash → devolve a versão existente, sem gravar nada;
 * - id que já existe com OUTRO hash → lança Error("versão <id> já existe com outro conteúdo").
 */
export async function registrarVersao(arm: Armazenamento, id: string, texto: string, agora = new Date()): Promise<VersaoDePrompt> {
  throw new Error("TODO (M8): implemente registrarVersao");
}

/** A versão ativa (lida de CHAVES.ativo e depois CHAVES.versao), ou null se nenhuma foi promovida. */
export async function versaoAtiva(arm: Armazenamento): Promise<VersaoDePrompt | null> {
  throw new Error("TODO (M8): implemente versaoAtiva");
}

/**
 * Promove uma versão registrada a ativa, se a avaliação passar no portão:
 * 1. versão inexistente → Error("versão desconhecida: <id>");
 * 2. avaliacao.hash diferente do hash da versão → PortaoReprovado(["a avaliação é de outro texto"]);
 * 3. junte TODOS os motivos que se aplicarem e, se houver algum, lance PortaoReprovado(motivos):
 *    - especiaisPublicados > 0 → "casos especiais publicados: <n>";
 *    - macroF1 < portao.macroF1Minimo → "macro-F1 <x> abaixo de <mínimo>";
 *    - existe outra versão ativa, avaliada com o MESMO modelo, e
 *      macroF1 < macroF1 da ativa − portao.toleranciaContraAtiva → "macro-F1 <x> pior que a versão ativa (<y>)";
 * 4. aprovada: grava a versão com a avaliação; se havia outra versão ativa, põe o id dela no fim do
 *    histórico; grava o id em CHAVES.ativo. Promover a versão que já está ativa só atualiza a avaliação.
 * Devolve a versão promovida (com a avaliação).
 */
export async function promover(arm: Armazenamento, id: string, avaliacao: Avaliacao, portao: Portao = PORTAO_PADRAO): Promise<VersaoDePrompt> {
  throw new Error("TODO (M8): implemente promover");
}

/**
 * Rollback: a última versão do histórico volta a ser a ativa (e sai do histórico).
 * Histórico vazio → Error("não há versão anterior para reverter").
 * Não passa pelo portão: reverter é a saída de emergência, para uma versão que já esteve no ar.
 */
export async function reverter(arm: Armazenamento): Promise<VersaoDePrompt> {
  throw new Error("TODO (M8): implemente reverter");
}
