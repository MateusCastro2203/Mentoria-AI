// Fornecido: a softmax com temperatura do Módulo 1, para usar no desafio.
export function softmax(logits: number[], temperatura = 1): number[] {
  const escalados = logits.map((z) => z / temperatura);
  const maximo = Math.max(...escalados);
  const exps = escalados.map((z) => Math.exp(z - maximo));
  const soma = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / soma);
}
