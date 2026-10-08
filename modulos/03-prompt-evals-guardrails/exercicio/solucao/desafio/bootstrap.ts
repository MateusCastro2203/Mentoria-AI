// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export function intervaloBootstrap(
  acertos: boolean[],
  opcoes: { reamostragens?: number; nivel?: number; aleatorio?: () => number } = {},
): { acuracia: number; inferior: number; superior: number } {
  const n = acertos.length;
  if (n === 0) throw new Error("Lista vazia: não há o que reamostrar.");
  const { reamostragens = 2000, nivel = 0.95, aleatorio = Math.random } = opcoes;
  const acuracia = acertos.filter(Boolean).length / n;
  const amostras: number[] = [];
  for (let r = 0; r < reamostragens; r++) {
    let soma = 0;
    for (let i = 0; i < n; i++) if (acertos[Math.floor(aleatorio() * n)]) soma++;
    amostras.push(soma / n);
  }
  amostras.sort((x, y) => x - y);
  const percentil = (p: number) => amostras[Math.floor(p * (reamostragens - 1))]!;
  return { acuracia, inferior: percentil((1 - nivel) / 2), superior: percentil(1 - (1 - nivel) / 2) };
}
