// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import { softmax } from "../../src/softmax.js";

export interface ExemploRotulado {
  logits: number[];
  correta: number;
}

export function logVerossimilhancaNegativa(exemplos: ExemploRotulado[], temperatura: number): number {
  const total = exemplos.reduce((soma, e) => soma - Math.log(softmax(e.logits, temperatura)[e.correta]!), 0);
  return total / exemplos.length;
}

export function ajustarTemperatura(
  exemplos: ExemploRotulado[],
  candidatos: number[] = Array.from({ length: 50 }, (_, i) => (i + 1) / 10),
): number {
  let melhor = candidatos[0]!;
  let menor = Infinity;
  for (const t of candidatos) {
    const nll = logVerossimilhancaNegativa(exemplos, t);
    if (nll < menor) {
      menor = nll;
      melhor = t;
    }
  }
  return melhor;
}
