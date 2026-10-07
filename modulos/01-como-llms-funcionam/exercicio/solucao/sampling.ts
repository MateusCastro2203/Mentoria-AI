// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

/**
 * Transforma logits (pontuações brutas que o modelo dá a cada token candidato) em probabilidades.
 *
 * - Divida cada logit pela `temperature` antes de aplicar a softmax.
 * - `temperature <= 0` significa decodificação gulosa (greedy): probabilidade 1 para o maior logit
 *   (em empate, o de menor índice) e 0 para o resto.
 * - Cuidado com overflow: Math.exp(1000) é Infinity. Subtraia o maior valor antes de exponenciar.
 */
export function softmax(logits: number[], temperature = 1): number[] {
  if (temperature <= 0) {
    const maior = logits.indexOf(Math.max(...logits));
    return logits.map((_, i) => (i === maior ? 1 : 0));
  }
  const escalados = logits.map((z) => z / temperature);
  const maximo = Math.max(...escalados);
  const exps = escalados.map((z) => Math.exp(z - maximo));
  const soma = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / soma);
}

/**
 * Nucleus sampling (top-p): mantém o MENOR conjunto de tokens mais prováveis cuja soma de
 * probabilidades seja >= topP, zera o resto e renormaliza para somar 1.
 * As posições do array não mudam (o índice continua sendo o id do token).
 * `topP >= 1` devolve as probabilidades sem alteração.
 */
export function filtrarTopP(probabilidades: number[], topP: number): number[] {
  if (topP >= 1) return [...probabilidades];
  const ordem = probabilidades.map((_, i) => i).sort((a, b) => probabilidades[b]! - probabilidades[a]!);
  const mantidos = new Set<number>();
  let acumulado = 0;
  for (const i of ordem) {
    mantidos.add(i);
    acumulado += probabilidades[i]!;
    if (acumulado >= topP) break;
  }
  const filtradas = probabilidades.map((p, i) => (mantidos.has(i) ? p : 0));
  const soma = filtradas.reduce((a, b) => a + b, 0);
  return filtradas.map((p) => p / soma);
}

export interface OpcoesAmostragem {
  temperature?: number; // padrão 1
  topP?: number; // padrão 1
}

/**
 * Escolhe o índice do próximo token: softmax com temperatura → filtro top-p → sorteio.
 * Sorteio: tire r = aleatorio() em [0, 1) e devolva o primeiro índice i (na ordem do array)
 * em que a probabilidade acumulada até i (inclusive) passa de r.
 */
export function amostrar(
  logits: number[],
  opcoes: OpcoesAmostragem = {},
  aleatorio: () => number = Math.random,
): number {
  const probabilidades = filtrarTopP(softmax(logits, opcoes.temperature ?? 1), opcoes.topP ?? 1);
  const r = aleatorio();
  let acumulado = 0;
  for (let i = 0; i < probabilidades.length; i++) {
    acumulado += probabilidades[i]!;
    if (acumulado > r) return i;
  }
  // Arredondamento: a soma pode ficar um fio abaixo de 1. Devolve o último com probabilidade > 0.
  return probabilidades.findLastIndex((p) => p > 0);
}
