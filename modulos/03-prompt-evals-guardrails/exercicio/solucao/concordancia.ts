// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export function concordancia(a: string[], b: string[]): number {
  if (a.length === 0) return 0;
  return a.filter((x, i) => x === b[i]).length / a.length;
}

export function kappaDeCohen(a: string[], b: string[]): number {
  if (a.length !== b.length) throw new Error("As listas precisam ter o mesmo tamanho.");
  const po = concordancia(a, b);
  const fracao = (lista: string[], rotulo: string) => lista.filter((x) => x === rotulo).length / lista.length;
  const rotulos = [...new Set([...a, ...b])];
  const pe = rotulos.reduce((soma, r) => soma + fracao(a, r) * fracao(b, r), 0);
  if (pe === 1) return po === 1 ? 1 : 0;
  return (po - pe) / (1 - pe);
}
