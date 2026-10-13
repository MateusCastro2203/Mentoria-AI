// Demo (aula, 10–22 min): ao retomar, o nó que pausou roda DE NOVO desde o começo.
// pnpm -F @mentoria/ex07-hitl demo:armadilha
import { Command, END, interrupt, MemorySaver, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const Estado = new StateSchema({ ok: z.boolean().default(false) });
const config = { configurable: { thread_id: "x" } };

async function rodar(titulo: string, no: () => { ok: boolean }) {
  console.log(`\n── ${titulo}`);
  const g = new StateGraph(Estado).addNode("aprovar", no).addEdge(START, "aprovar").addEdge("aprovar", END).compile({ checkpointer: new MemorySaver() });
  await g.invoke({}, config);
  console.log("   ⏸ pausado; a pessoa responde 'sim'…");
  await g.invoke(new Command({ resume: "sim" }), config);
}

let errado = 0;
await rodar("ERRADO: e-mail ANTES do interrupt", () => {
  errado++;
  console.log(`   📧 enviando e-mail "seu pedido está em análise" (envio nº ${errado})`);
  const r = interrupt("aprova?");
  return { ok: r === "sim" };
});

let certo = 0;
await rodar("CERTO: o efeito fica DEPOIS do interrupt (ou num nó separado)", () => {
  const r = interrupt("aprova?");
  certo++;
  console.log(`   📧 enviando e-mail "aprovado" (envio nº ${certo})`);
  return { ok: r === "sim" };
});

console.log(`\nResultado: ${errado} e-mails no jeito errado, ${certo} no certo.`);
console.log("Outra armadilha: try/catch em volta do interrupt() engole a pausa (ele funciona lançando uma exceção especial).");
