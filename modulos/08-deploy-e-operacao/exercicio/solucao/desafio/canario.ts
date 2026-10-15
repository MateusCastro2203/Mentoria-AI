// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import { balde } from "../../src/estado.js";
import type { Canario, Execucao, RegraDoCanario } from "../../src/desafio/canario.js";

export type { Canario, Execucao, RegraDoCanario };

export function escolherVersao(chave: string, canario: Canario): string {
  return balde(chave) < canario.percentual ? canario.candidata : canario.estavel;
}

const taxaDeFalha = (lista: Execucao[]) => (lista.length ? lista.filter((e) => e.status === "falhou").length / lista.length : 0);

export function decidirCanario(execucoes: Execucao[], canario: Canario, regra: RegraDoCanario): "aguardar" | "reverter" | "promover" {
  const candidata = execucoes.filter((e) => e.versao === canario.candidata);
  const estavel = execucoes.filter((e) => e.versao === canario.estavel);
  if (candidata.length < regra.minimoDeExecucoes) return "aguardar";
  return taxaDeFalha(candidata) > taxaDeFalha(estavel) + regra.tolerancia ? "reverter" : "promover";
}
