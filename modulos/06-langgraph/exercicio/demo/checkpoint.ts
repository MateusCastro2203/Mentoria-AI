// Demo (aula, 15–30 min): o processo "morre" no meio do grafo e outro processo retoma do checkpoint.
// pnpm -F @mentoria/ex06-langgraph demo:checkpoint
// Offline. O checkpoint fica num arquivo JSON: é só dado, dá para abrir e ler.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";
import { CheckpointEmArquivo } from "../../../../projeto-final/src/m06/checkpoint-arquivo.js";

const Estado = new StateSchema({ pedido: z.string(), feito: z.array(z.string()).default(() => []) });
type E = typeof Estado.State;
const config = { configurable: { thread_id: "pedido-42" } };

function montar(arquivo: string) {
  const etapa = (nome: string) => async (e: E) => {
    console.log(`   [pid ${process.pid}] rodando ${nome}`);
    await new Promise((r) => setTimeout(r, 400));
    if (nome === "processar" && process.env.CAIR) {
      console.log(`   [pid ${process.pid}] 💥 o processo morreu no meio de ${nome}`);
      process.exit(1);
    }
    return { feito: [...e.feito, nome] };
  };
  return new StateGraph(Estado)
    .addNode("buscar", etapa("buscar"))
    .addNode("processar", etapa("processar"))
    .addNode("entregar", etapa("entregar"))
    .addEdge(START, "buscar")
    .addEdge("buscar", "processar")
    .addEdge("processar", "entregar")
    .addEdge("entregar", END)
    .compile({ checkpointer: new CheckpointEmArquivo(arquivo) });
}

if (process.env.ARQUIVO) {
  // Processo filho: começa ou retoma, conforme o checkpoint.
  const grafo = montar(process.env.ARQUIVO);
  const antes = await grafo.getState(config);
  const retomando = antes.next.length > 0;
  console.log(`   [pid ${process.pid}] ${retomando ? `retomando; próximo nó: ${antes.next.join(", ")}` : "começando do zero"}`);
  const r = await grafo.invoke(retomando ? null : { pedido: "pedido 42" }, config);
  console.log(`   [pid ${process.pid}] terminou: feito = ${JSON.stringify(r.feito)}`);
} else {
  const arquivo = join(mkdtempSync(join(tmpdir(), "checkpoint-")), "checkpoint.json");
  const rodar = (extra: Record<string, string>) =>
    spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url)], { stdio: "inherit", env: { ...process.env, ARQUIVO: arquivo, ...extra } });

  console.log("── 1ª execução (vai cair em 'processar') ──");
  rodar({ CAIR: "1" });
  const salvo = JSON.parse(readFileSync(arquivo, "utf8"));
  console.log(`\n── O arquivo de checkpoint (${arquivo}) ──`);
  console.log(`   threads salvas: ${Object.keys(salvo.storage ?? salvo).join(", ")} · ${readFileSync(arquivo).length} bytes`);
  console.log("\n── 2ª execução, OUTRO processo, mesma thread ──");
  rodar({});
}
