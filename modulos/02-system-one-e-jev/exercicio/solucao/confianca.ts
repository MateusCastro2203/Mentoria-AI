// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export interface Alternativa {
  token: string;
  logprob: number;
}

export function probabilidadesDasOpcoes(
  alternativas: Alternativa[],
  opcoes: string[],
): Record<string, number> | null {
  const massa: Record<string, number> = Object.fromEntries(opcoes.map((o) => [o, 0]));
  let casou = false;
  for (const { token, logprob } of alternativas) {
    const prefixo = token.trim().replaceAll('"', "").toLowerCase();
    if (!prefixo) continue;
    const candidatas = opcoes.filter((o) => o.toLowerCase().startsWith(prefixo));
    if (candidatas.length !== 1) continue;
    massa[candidatas[0]!]! += Math.exp(logprob);
    casou = true;
  }
  if (!casou) return null;
  const total = Object.values(massa).reduce((a, b) => a + b, 0);
  return Object.fromEntries(opcoes.map((o) => [o, massa[o]! / total]));
}

export function confiancaDaEscolha(probabilidades: number[]): number {
  const n = probabilidades.length;
  if (n <= 1) return 1;
  const pMax = Math.max(...probabilidades);
  return Math.min(1, Math.max(0, (n * pMax - 1) / (n - 1)));
}

export interface ResultadoVotacao {
  vencedora: string;
  confianca: number;
  distribuicao: Record<string, number>;
}

export function votacao(respostas: string[]): ResultadoVotacao {
  if (respostas.length === 0) throw new Error("Lista vazia: a votação precisa de pelo menos uma resposta.");
  const contagem = new Map<string, number>();
  for (const r of respostas) contagem.set(r, (contagem.get(r) ?? 0) + 1);
  let vencedora = respostas[0]!;
  for (const [resposta, votos] of contagem) if (votos > contagem.get(vencedora)!) vencedora = resposta;
  const distribuicao = Object.fromEntries([...contagem].map(([r, v]) => [r, v / respostas.length]));
  return { vencedora, confianca: distribuicao[vencedora]!, distribuicao };
}
