// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import type { Armazenamento } from "../../src/m08/armazenamento.js";
import {
  CHAVES,
  hashDoTexto,
  lerHistorico,
  PORTAO_PADRAO,
  PortaoReprovado,
  type Avaliacao,
  type Portao,
  type VersaoDePrompt,
} from "../../src/m08/tipos-prompts.js";

export { CHAVES, hashDoTexto, lerHistorico, PORTAO_PADRAO, PortaoReprovado, type Avaliacao, type Portao, type VersaoDePrompt };

async function lerVersao(arm: Armazenamento, id: string): Promise<VersaoDePrompt | null> {
  const texto = await arm.get(CHAVES.versao(id));
  return texto ? (JSON.parse(texto) as VersaoDePrompt) : null;
}

export async function registrarVersao(arm: Armazenamento, id: string, texto: string, agora = new Date()): Promise<VersaoDePrompt> {
  const hash = await hashDoTexto(texto);
  const existente = await lerVersao(arm, id);
  if (existente) {
    if (existente.hash !== hash) throw new Error(`versão ${id} já existe com outro conteúdo`);
    return existente;
  }
  const versao: VersaoDePrompt = { id, texto, hash, criadaEm: agora.toISOString() };
  await arm.put(CHAVES.versao(id), JSON.stringify(versao));
  return versao;
}

export async function versaoAtiva(arm: Armazenamento): Promise<VersaoDePrompt | null> {
  const id = await arm.get(CHAVES.ativo);
  return id ? lerVersao(arm, id) : null;
}

export async function promover(arm: Armazenamento, id: string, avaliacao: Avaliacao, portao: Portao = PORTAO_PADRAO): Promise<VersaoDePrompt> {
  const versao = await lerVersao(arm, id);
  if (!versao) throw new Error(`versão desconhecida: ${id}`);
  if (avaliacao.hash !== versao.hash) throw new PortaoReprovado(["a avaliação é de outro texto"]);

  const ativa = await versaoAtiva(arm);
  const motivos: string[] = [];
  if (avaliacao.especiaisPublicados > 0) motivos.push(`casos especiais publicados: ${avaliacao.especiaisPublicados}`);
  if (avaliacao.macroF1 < portao.macroF1Minimo) motivos.push(`macro-F1 ${avaliacao.macroF1} abaixo de ${portao.macroF1Minimo}`);
  const base = ativa && ativa.id !== id ? ativa.avaliacao : undefined;
  if (base && base.modelo === avaliacao.modelo && avaliacao.macroF1 < base.macroF1 - portao.toleranciaContraAtiva) {
    motivos.push(`macro-F1 ${avaliacao.macroF1} pior que a versão ativa (${base.macroF1})`);
  }
  if (motivos.length) throw new PortaoReprovado(motivos);

  const promovida = { ...versao, avaliacao };
  await arm.put(CHAVES.versao(id), JSON.stringify(promovida));
  if (ativa && ativa.id !== id) await arm.put(CHAVES.historico, JSON.stringify([...(await lerHistorico(arm)), ativa.id]));
  await arm.put(CHAVES.ativo, id);
  return promovida;
}

export async function reverter(arm: Armazenamento): Promise<VersaoDePrompt> {
  const historico = await lerHistorico(arm);
  const anterior = historico.pop();
  if (!anterior) throw new Error("não há versão anterior para reverter");
  const versao = await lerVersao(arm, anterior);
  if (!versao) throw new Error(`versão desconhecida: ${anterior}`);
  await arm.put(CHAVES.historico, JSON.stringify(historico));
  await arm.put(CHAVES.ativo, anterior);
  return versao;
}
