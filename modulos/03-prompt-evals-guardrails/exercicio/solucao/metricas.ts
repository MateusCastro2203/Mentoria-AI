// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export interface Par {
  esperado: string;
  previsto: string;
}

export function matrizDeConfusao(pares: Par[], classes: string[]): Record<string, Record<string, number>> {
  const todas = [...new Set([...classes, ...pares.flatMap((p) => [p.esperado, p.previsto])])];
  const matriz = Object.fromEntries(todas.map((e) => [e, Object.fromEntries(todas.map((p) => [p, 0]))]));
  for (const { esperado, previsto } of pares) matriz[esperado]![previsto]!++;
  return matriz;
}

export interface MetricasDaClasse {
  precisao: number;
  recall: number;
  f1: number;
  suporte: number;
}

const dividir = (a: number, b: number) => (b === 0 ? 0 : a / b);

export function metricasDaClasse(pares: Par[], classe: string): MetricasDaClasse {
  const vp = pares.filter((p) => p.previsto === classe && p.esperado === classe).length;
  const fp = pares.filter((p) => p.previsto === classe && p.esperado !== classe).length;
  const fn = pares.filter((p) => p.previsto !== classe && p.esperado === classe).length;
  const precisao = dividir(vp, vp + fp);
  const recall = dividir(vp, vp + fn);
  return { precisao, recall, f1: dividir(2 * precisao * recall, precisao + recall), suporte: vp + fn };
}

export function macroF1(pares: Par[], classes: string[]): number {
  return dividir(
    classes.reduce((soma, c) => soma + metricasDaClasse(pares, c).f1, 0),
    classes.length,
  );
}
