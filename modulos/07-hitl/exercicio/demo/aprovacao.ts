// Demo (aula, 22–32 min): três pedidos, três níveis de autonomia. No do meio, o grafo PARA e pergunta.
// pnpm -F @mentoria/ex07-hitl demo:aprovacao            (pergunta no terminal)
// pnpm -F @mentoria/ex07-hitl demo:aprovacao -- --auto  (responde sozinho: editar para R$ 200)
// Offline: o "analisador" é uma função de mentira.
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Command, MemorySaver } from "@langchain/langgraph";
import { analise, falsos, thread } from "../test/apoio.js";
import { montarReembolso } from "../solucao/reembolso.js";

const auto = process.argv.includes("--auto");
const { analisar, pagar, pagamentos } = falsos({
  ana: analise("reembolsar", 40, 0.97),
  bia: analise("reembolsar", 350, 0.92),
  davi: analise("reembolsar", 5000, 0.99),
});
const grafo = montarReembolso({ analisar, pagar }, { checkpointer: new MemorySaver() });
const rl = auto ? null : createInterface({ input: stdin, output: stdout });

const pedidos = [
  { cliente: "ana", valor: 40, motivo: "veio quebrado" },
  { cliente: "bia", valor: 350, motivo: "não chegou" },
  { cliente: "davi", valor: 5000, motivo: "cancelei o contrato" },
];
for (const pedido of pedidos) {
  console.log(`\n── ${pedido.cliente}: R$ ${pedido.valor} (${pedido.motivo})`);
  let r = await grafo.invoke({ pedido }, thread(pedido.cliente));
  while (r.__interrupt__?.length) {
    const p = r.__interrupt__[0]!.value;
    console.log(`   ⏸ PAUSADO. Sugestão: ${p.analise.sugestao} R$ ${p.analise.valor} (confiança ${p.analise.confianca})${p.erro ? ` · ⚠ ${p.erro}` : ""}`);
    console.log(`   (o estado está salvo; o grafo pode esperar horas. Pagamentos até agora: ${pagamentos.length})`);
    let resposta: unknown = { acao: "editar", valor: 200 };
    if (rl) {
      const op = (await rl.question("   [a]provar · [e]ditar valor · [r]ejeitar > ")).trim();
      resposta =
        op === "a" ? { acao: "aprovar" } : op === "e" ? { acao: "editar", valor: Number(await rl.question("   valor > ")) } : { acao: "rejeitar", motivo: (await rl.question("   motivo > ")) || "sem motivo" };
    }
    r = await grafo.invoke(new Command({ resume: resposta }), thread(pedido.cliente));
  }
  console.log(`   nível: ${r.nivel} · caminho: ${r.trajetoria.join(" → ")} · resultado: ${r.resultado}${r.recibo ? ` (${r.recibo})` : ""}`);
}
console.log("\nPagamentos feitos:", pagamentos);
rl?.close();
