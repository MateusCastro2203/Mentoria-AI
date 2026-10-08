// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export type Execucao = Record<string, boolean>;

export interface Comparacao {
  regressoes: string[];
  melhorias: string[];
  delta: number;
}

export function compararExecucoes(base: Execucao, candidato: Execucao): Comparacao {
  const comuns = Object.keys(base).filter((id) => id in candidato).sort();
  const regressoes = comuns.filter((id) => base[id] && !candidato[id]);
  const melhorias = comuns.filter((id) => !base[id] && candidato[id]);
  const acertos = (e: Execucao) => comuns.filter((id) => e[id]).length;
  const delta = comuns.length ? (acertos(candidato) - acertos(base)) / comuns.length : 0;
  return { regressoes, melhorias, delta };
}

export function aprovarMudanca(
  comparacao: Comparacao,
  regra: { minDelta: number; maxRegressoes: number },
): { aprovado: boolean; motivos: string[] } {
  const motivos: string[] = [];
  if (comparacao.delta < regra.minDelta) {
    motivos.push(`delta de acurácia ${comparacao.delta.toFixed(3)} abaixo do mínimo ${regra.minDelta}`);
  }
  if (comparacao.regressoes.length > regra.maxRegressoes) {
    motivos.push(`${comparacao.regressoes.length} regressões (máximo ${regra.maxRegressoes}): ${comparacao.regressoes.join(", ")}`);
  }
  return { aprovado: motivos.length === 0, motivos };
}
