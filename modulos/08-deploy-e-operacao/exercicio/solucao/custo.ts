// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import type { Precos, Uso } from "../src/estado.js";

export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}

export function custo(uso: Uso, precos: Precos): number {
  return ((uso.tokensEntrada ?? 0) * precos.entradaPorMilhao + (uso.tokensSaida ?? 0) * precos.saidaPorMilhao) / 1_000_000;
}
