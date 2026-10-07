// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export interface Previsao {
  confianca: number;
  acertou: boolean;
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function acuracia(previsoes: Previsao[]): number {
  return media(previsoes.map((p) => (p.acertou ? 1 : 0)));
}

export function brier(previsoes: Previsao[]): number {
  return media(previsoes.map((p) => (p.confianca - (p.acertou ? 1 : 0)) ** 2));
}

export interface Faixa {
  de: number;
  ate: number;
  quantidade: number;
  confiancaMedia: number | null;
  acuracia: number | null;
}

export function tabelaDeCalibracao(previsoes: Previsao[], nFaixas = 5): Faixa[] {
  const grupos: Previsao[][] = Array.from({ length: nFaixas }, () => []);
  for (const p of previsoes) grupos[Math.min(Math.floor(p.confianca * nFaixas), nFaixas - 1)]!.push(p);
  return grupos.map((grupo, i) => ({
    de: i / nFaixas,
    ate: (i + 1) / nFaixas,
    quantidade: grupo.length,
    confiancaMedia: grupo.length ? media(grupo.map((p) => p.confianca)) : null,
    acuracia: grupo.length ? acuracia(grupo) : null,
  }));
}

export function ece(previsoes: Previsao[], nFaixas = 5): number {
  if (previsoes.length === 0) return 0;
  return tabelaDeCalibracao(previsoes, nFaixas)
    .filter((f) => f.quantidade > 0)
    .reduce((total, f) => total + (f.quantidade / previsoes.length) * Math.abs(f.acuracia! - f.confiancaMedia!), 0);
}

export function coberturaVsAcuracia(
  previsoes: Previsao[],
  limiar: number,
): { cobertura: number; acuracia: number | null } {
  const aceitas = previsoes.filter((p) => p.confianca >= limiar);
  return {
    cobertura: previsoes.length ? aceitas.length / previsoes.length : 0,
    acuracia: aceitas.length ? acuracia(aceitas) : null,
  };
}
