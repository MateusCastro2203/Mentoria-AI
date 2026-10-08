// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export type Agente<E = unknown, S = unknown> = (entrada: E) => Promise<S>;

export function emPipeline(etapas: { nome: string; executar: Agente<any, any> }[]): Agente<unknown, { saida: unknown; rastro: string[] }> {
  return async (entrada) => {
    const rastro: string[] = [];
    let atual = entrada;
    for (const etapa of etapas) {
      try {
        atual = await etapa.executar(atual);
      } catch (erro) {
        throw new Error(`etapa ${etapa.nome}: ${(erro as Error).message}`);
      }
      rastro.push(etapa.nome);
    }
    return { saida: atual, rastro };
  };
}

export interface Rodada {
  trabalhador: string;
  saida: unknown;
}

export async function comSupervisor(opcoes: {
  tarefa: string;
  escolher: (tarefa: string, rodadas: Rodada[]) => Promise<string> | string;
  trabalhadores: Record<string, Agente<{ tarefa: string; rodadas: Rodada[] }, unknown>>;
  maxRodadas: number;
}): Promise<{ rodadas: Rodada[]; motivo: "fim" | "limite" | "trabalhador-desconhecido" }> {
  const rodadas: Rodada[] = [];
  while (rodadas.length < opcoes.maxRodadas) {
    const nome = await opcoes.escolher(opcoes.tarefa, rodadas);
    if (nome === "fim") return { rodadas, motivo: "fim" };
    const trabalhador = opcoes.trabalhadores[nome];
    if (!trabalhador) return { rodadas, motivo: "trabalhador-desconhecido" };
    rodadas.push({ trabalhador: nome, saida: await trabalhador({ tarefa: opcoes.tarefa, rodadas: [...rodadas] }) });
  }
  return { rodadas, motivo: "limite" };
}

export async function comRevisao<S>(opcoes: {
  gerar: (feedback?: string) => Promise<S>;
  revisar: (saida: S) => Promise<{ aprovado: boolean; motivo: string }>;
  maxTentativas: number;
}): Promise<{ saida: S; aprovado: boolean; tentativas: number; reprovacoes: string[] }> {
  const reprovacoes: string[] = [];
  let saida!: S;
  for (let tentativas = 1; tentativas <= opcoes.maxTentativas; tentativas++) {
    saida = await opcoes.gerar(reprovacoes.at(-1));
    const r = await opcoes.revisar(saida);
    if (r.aprovado) return { saida, aprovado: true, tentativas, reprovacoes };
    reprovacoes.push(r.motivo);
  }
  return { saida, aprovado: false, tentativas: opcoes.maxTentativas, reprovacoes };
}
