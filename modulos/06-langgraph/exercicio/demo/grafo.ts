// Demo (aula, 0–15 min): a triagem como grafo. Offline (classificador de mentira, por palavra-chave).
// pnpm -F @mentoria/ex06-langgraph demo:grafo
import { MemorySaver } from "@langchain/langgraph";
import { corrigirCategoria } from "../solucao/desafio/viagem.js";
import { montarTriagem } from "../solucao/triagem.js";
import { classificadorFalso, thread } from "../test/apoio.js";

const { classificar } = classificadorFalso();
const grafo = montarTriagem(classificar, { checkpointer: new MemorySaver() });

console.log("── 1. O desenho (cole em https://mermaid.live) ──\n");
console.log((await grafo.getGraphAsync()).drawMermaid());

console.log("── 2. Arestas condicionais: cada chamado segue um caminho ──\n");
const chamados = ["Meu boleto veio em dobro", "O app trava no login", "Como mudo meu e-mail?", "Acho que fui cobrado errado, talvez"];
for (const [i, chamado] of chamados.entries()) {
  const r = await grafo.invoke({ chamado }, thread(`demo-${i}`));
  console.log(`${chamado.padEnd(38)} → ${r.categoria} (${r.confianca}) → ${r.atendidoPor}`);
}

console.log("\n── 3. Memória: a mesma thread, duas chamadas ──\n");
await grafo.invoke({ chamado: "Meu boleto veio em dobro" }, thread("cliente-ana"));
const r = await grafo.invoke({ chamado: "Não recebi o reembolso" }, thread("cliente-ana"));
console.log("historico da thread cliente-ana:", r.historico);

console.log("\n── 4. Os checkpoints da thread (do mais novo para o mais antigo) ──\n");
for await (const c of grafo.getStateHistory(thread("cliente-ana"))) {
  const v = c.values as { chamado?: string; atendidoPor?: string };
  console.log(`passo ${String(c.metadata?.step).padStart(2)} · próximo: ${(c.next.join(", ") || "(fim)").padEnd(12)} · atendidoPor: ${v.atendidoPor ?? "-"}`);
}

console.log("\n── 5. Viagem no tempo: \"reembolso\" foi para o FAQ; corrigimos para cobrança ──\n");
const certo = await corrigirCategoria(grafo, thread("cliente-ana"), "cobranca");
console.log(`agora: ${certo.atendidoPor} · historico:`, certo.historico);
