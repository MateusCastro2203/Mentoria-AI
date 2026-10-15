// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import { comAtributos, type EventoDeChamada } from "@mentoria/llm";
import type { Papeis } from "../../src/m05/time.js";
import { SEM_CUSTO, type Agregado, type Precos, type ResumoDoRastro } from "../../src/m08/tipos-rastreio.js";

export { SEM_CUSTO, type Agregado, type Precos, type ResumoDoRastro };

export function percentil(valores: number[], q: number): number {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const posicao = Math.max(1, Math.ceil(q * ordenados.length));
  return ordenados[Math.min(posicao, ordenados.length) - 1]!;
}

export function custoDaChamada(evento: Pick<EventoDeChamada, "tokensEntrada" | "tokensSaida">, precos: Precos): number {
  return ((evento.tokensEntrada ?? 0) * precos.entradaPorMilhao + (evento.tokensSaida ?? 0) * precos.saidaPorMilhao) / 1_000_000;
}

function agregar(eventos: EventoDeChamada[], precos: Precos): Agregado {
  const latencias = eventos.map((e) => e.latenciaMs);
  return {
    chamadas: eventos.length,
    erros: eventos.filter((e) => e.erro !== undefined).length,
    tokensEntrada: eventos.reduce((s, e) => s + (e.tokensEntrada ?? 0), 0),
    tokensSaida: eventos.reduce((s, e) => s + (e.tokensSaida ?? 0), 0),
    custo: eventos.reduce((s, e) => s + custoDaChamada(e, precos), 0),
    latenciaTotalMs: latencias.reduce((s, x) => s + x, 0),
    p50Ms: percentil(latencias, 0.5),
    p95Ms: percentil(latencias, 0.95),
  };
}

export function resumirRastro(eventos: EventoDeChamada[], precos: Precos = SEM_CUSTO): ResumoDoRastro {
  const grupos = new Map<string, EventoDeChamada[]>();
  for (const e of eventos) {
    const papel = typeof e.atributos.papel === "string" ? e.atributos.papel : "sem-papel";
    grupos.set(papel, [...(grupos.get(papel) ?? []), e]);
  }
  return {
    total: agregar(eventos, precos),
    porPapel: Object.fromEntries([...grupos].map(([papel, lista]) => [papel, agregar(lista, precos)])),
  };
}

export function rastrearPapeis(papeis: Papeis): Papeis {
  return {
    coletar: () => comAtributos({ papel: "coletar" }, () => papeis.coletar()),
    classificar: (id) => comAtributos({ papel: "classificar", alvo: id }, () => papeis.classificar(id)),
    redigir: (id, feedback) => comAtributos({ papel: "redigir", alvo: id }, () => papeis.redigir(id, feedback)),
    revisar: (id, resumo) => comAtributos({ papel: "revisar", alvo: id }, () => papeis.revisar(id, resumo)),
  };
}
