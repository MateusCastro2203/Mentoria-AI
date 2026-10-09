// Experimento da etapa M6 (fornecido): o time da M5 orquestrado como um grafo LangGraph,
// com checkpoint em arquivo.
//   pnpm -F @mentoria/curador m06:grafo                      (seu código)
//   pnpm -F @mentoria/curador m06:grafo:solucao              (soluções de referência)
//   ... m06:grafo:solucao -- --falhar                        (o servidor de edição "cai" no publicar)
//   ... m06:grafo:solucao -- --nova                          (ignora o checkpoint e começa outra thread)
// Rodar de novo depois de uma falha RETOMA a mesma thread do ponto onde parou.
// Grava saidas/m06-checkpoint.json, saidas/m06-grafo.mmd e saidas/m06-relatorio.md.
import { rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lerConfig } from "@mentoria/llm";
import { CheckpointEmArquivo } from "../src/m06/checkpoint-arquivo.js";

const sol = Boolean(process.env.SOLUCAO);
const m = {
  fontes: (sol ? await import("../solucao/m05/servidor-fontes.js") : await import("../src/m05/servidor-fontes.js")) as typeof import("../src/m05/servidor-fontes.js"),
  edicao: (sol ? await import("../solucao/m05/servidor-edicao.js") : await import("../src/m05/servidor-edicao.js")) as typeof import("../src/m05/servidor-edicao.js"),
  ponte: (sol ? await import("../solucao/m05/mcp-para-ai-sdk.js") : await import("../src/m05/mcp-para-ai-sdk.js")) as typeof import("../src/m05/mcp-para-ai-sdk.js"),
  papeis: (sol ? await import("../solucao/m05/papeis.js") : await import("../src/m05/papeis.js")) as typeof import("../src/m05/papeis.js"),
  grafo: (sol ? await import("../solucao/m06/grafo.js") : await import("../src/m06/grafo.js")) as typeof import("../src/m06/grafo.js"),
};

const falhar = process.argv.includes("--falhar");
const SAIDAS = fileURLToPath(new URL("../saidas/", import.meta.url));
const ARQUIVO = `${SAIDAS}m06-checkpoint.json`;
if (process.argv.includes("--nova")) rmSync(ARQUIVO, { force: true });
const config = { configurable: { thread_id: "edicao-da-semana" } };

const clienteFontes = await m.ponte.conectarEmMemoria(m.fontes.criarServidorFontes(), "grafo-curador");
const clienteEdicao = await m.ponte.conectarEmMemoria(m.edicao.criarServidorEdicao({ pasta: SAIDAS }), "grafo-curador");
const { papeis } = await m.papeis.criarPapeis({ clienteFontes });

// Conta chamadas desta execução (para ver que a retomada não refaz trabalho).
const chamadas = { coletar: 0, classificar: 0, redigir: 0, revisar: 0 };
const contados = Object.fromEntries(
  (Object.keys(chamadas) as (keyof typeof chamadas)[]).map((nome) => [
    nome,
    async (...args: unknown[]) => {
      chamadas[nome]++;
      process.stdout.write(nome[0]!);
      return (papeis[nome] as (...a: unknown[]) => Promise<unknown>)(...args);
    },
  ]),
) as unknown as typeof papeis;

const data = new Date().toISOString().slice(0, 10);
const grafo = m.grafo.montarGrafo(
  contados,
  async (itens) => {
    if (falhar) throw new Error("servidor de edição fora do ar (simulado com --falhar)");
    const res: any = await clienteEdicao.callTool({ name: "publicar_edicao", arguments: { titulo: `Curador de IA · semana de ${data}`, itens } });
    if (res.isError) throw new Error(res.content[0].text);
    return { arquivo: res.structuredContent.arquivo };
  },
  { checkpointer: new CheckpointEmArquivo(ARQUIVO) },
);
writeFileSync(`${SAIDAS}m06-grafo.mmd`, (await grafo.getGraphAsync()).drawMermaid());

const antes = await grafo.getState(config);
const retomando = antes.next.length > 0;
console.log(retomando ? `Retomando a thread do checkpoint; próximo nó: ${antes.next.join(", ")}` : "Começando uma edição nova.");

const inicio = Date.now();
let erro: string | null = null;
try {
  await grafo.invoke(retomando ? null : {}, config);
} catch (e) {
  erro = (e as Error).message;
}
const segundos = ((Date.now() - inicio) / 1000).toFixed(0);
const estado = (await grafo.getState(config)) as { values: any; next: string[] };
let checkpoints = 0;
for await (const _ of grafo.getStateHistory(config)) checkpoints++;
const v = estado.values;

const relatorio = [
  `# M6 · O curador como grafo`,
  ``,
  `Modelo: \`${lerConfig().modelo}\` · thread \`${config.configurable.thread_id}\` · ${retomando ? "**retomada** de checkpoint" : "execução nova"} · ${segundos} s`,
  ``,
  `| Nesta execução | Coletar | Classificar | Redigir | Revisar |`,
  `|---|---|---|---|---|`,
  `| chamadas | ${chamadas.coletar} | ${chamadas.classificar} | ${chamadas.redigir} | ${chamadas.revisar} |`,
  ``,
  erro ? `- **Parou com erro:** ${erro}. Próximo nó no checkpoint: \`${estado.next.join(", ")}\`. Rode de novo (sem --falhar) para retomar.` : `- Terminou. Edição: ${v.arquivo ?? "não publicada (nada aprovado)"}`,
  `- Candidatos: ${v.candidatos.length} · avaliados: ${v.avaliados.length}`,
  `- Na edição: ${v.itens.map((i: any) => `${i.id} (${i.categoria})`).join(", ") || "nenhum"}`,
  `- Fila humana: ${v.paraRevisao.map((p: any) => `${p.id} (${p.motivo})`).join(", ") || "nenhum"}`,
  `- Fora pela cota/limite: ${v.foraDaEdicao.join(", ") || "nenhum"}`,
  `- Reprovadas pelo revisor: ${v.reprovadas.map((x: any) => `${x.id} (${x.motivo})`).join("; ") || "nenhuma"}`,
  `- Checkpoints na thread: ${checkpoints} (arquivo: saidas/m06-checkpoint.json)`,
  `- Desenho do grafo: saidas/m06-grafo.mmd`,
];
writeFileSync(`${SAIDAS}m06-relatorio.md`, relatorio.join("\n"));
console.log(`\n\n${relatorio.join("\n")}`);
await clienteFontes.close();
await clienteEdicao.close();
if (erro) process.exitCode = 1;

