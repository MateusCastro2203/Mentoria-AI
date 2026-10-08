// Experimento da etapa M5 (fornecido): o time de agentes monta e publica a edição via MCP.
//   pnpm -F @mentoria/curador m05:edicao            (seu código)
//   pnpm -F @mentoria/curador m05:edicao:solucao    (soluções de referência)
// Grava saidas/edicao.md (pelo servidor MCP de edição) e saidas/m05-relatorio.md.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lerConfig } from "@mentoria/llm";
import { carregarNoticias } from "../src/noticia.js";

const sol = Boolean(process.env.SOLUCAO);
const m = {
  fontes: (sol ? await import("../solucao/m05/servidor-fontes.js") : await import("../src/m05/servidor-fontes.js")) as typeof import("../src/m05/servidor-fontes.js"),
  edicao: (sol ? await import("../solucao/m05/servidor-edicao.js") : await import("../src/m05/servidor-edicao.js")) as typeof import("../src/m05/servidor-edicao.js"),
  ponte: (sol ? await import("../solucao/m05/mcp-para-ai-sdk.js") : await import("../src/m05/mcp-para-ai-sdk.js")) as typeof import("../src/m05/mcp-para-ai-sdk.js"),
  time: (sol ? await import("../solucao/m05/time.js") : await import("../src/m05/time.js")) as typeof import("../src/m05/time.js"),
  papeis: (sol ? await import("../solucao/m05/papeis.js") : await import("../src/m05/papeis.js")) as typeof import("../src/m05/papeis.js"),
};

const SAIDAS = fileURLToPath(new URL("../saidas/", import.meta.url));
const clienteFontes = await m.ponte.conectarEmMemoria(m.fontes.criarServidorFontes(), "time-curador");
const clienteEdicao = await m.ponte.conectarEmMemoria(m.edicao.criarServidorEdicao({ pasta: SAIDAS }), "time-curador");
const { papeis, trajetoriaDoColetor } = await m.papeis.criarPapeis({ clienteFontes });

// Cronometra cada papel.
const tempo = { coletar: 0, classificar: 0, redigir: 0, revisar: 0 };
const cronometrado = Object.fromEntries(
  (Object.keys(tempo) as (keyof typeof tempo)[]).map((nome) => [
    nome,
    async (...args: unknown[]) => {
      const inicio = Date.now();
      try {
        return await (papeis[nome] as (...a: unknown[]) => Promise<unknown>)(...args);
      } finally {
        tempo[nome] += Date.now() - inicio;
        process.stdout.write(nome[0]!);
      }
    },
  ]),
) as unknown as typeof papeis;

const data = new Date().toISOString().slice(0, 10);
const r = await m.time.montarEdicao(cronometrado, async (itens) => {
  const res: any = await clienteEdicao.callTool({ name: "publicar_edicao", arguments: { titulo: `Curador de IA · semana de ${data}`, itens } });
  if (res.isError) throw new Error(res.content[0].text);
  return { arquivo: res.structuredContent.arquivo };
});

const noticias = carregarNoticias();
const gabarito = new Set(noticias.filter((n) => n.rotulo.relevante && n.url.startsWith("https://")).map((n) => n.id));
const s = (ms: number) => `${(ms / 1000).toFixed(0)} s`;
const fontesLidas = trajetoriaDoColetor.filter((c) => c.ferramenta === "ler_fonte").map((c) => (c.entrada as { fonte: string }).fonte);
const passosDoColetor = new Set(trajetoriaDoColetor.map((c) => c.passo)).size;

const relatorio = [
  `# M5 · O time de agentes`,
  ``,
  `Modelo: \`${lerConfig().modelo}\` · servidores MCP: curador-fontes (RSS) e curador-edicao (markdown)`,
  ``,
  `| Papel | Tipo | Chamadas | Tempo |`,
  `|---|---|---|---|`,
  `| Coletor | agente (tools do MCP de fontes) | 1 (${passosDoColetor} passos) | ${s(tempo.coletar)} |`,
  `| Classificador | decisão estruturada (skill + guardrails) | ${r.chamadas.classificar} | ${s(tempo.classificar)} |`,
  `| Redator | geração de texto | ${r.chamadas.redigir} | ${s(tempo.redigir)} |`,
  `| Revisor | código + juiz LLM | ${r.chamadas.revisar} | ${s(tempo.revisar)} |`,
  ``,
  `- Fontes lidas pelo coletor: ${fontesLidas.join(", ") || "nenhuma"}`,
  `- Candidatos: ${r.candidatos.length} (dos ${gabarito.size} publicáveis do gabarito, ${r.candidatos.filter((id) => gabarito.has(id)).length} chegaram ao classificador)`,
  `- Publicáveis (top 10 por confiança): ${r.publicaveis.join(", ")}`,
  `- Aprovadas pelo revisor: ${r.aprovadas.join(", ") || "nenhuma"}`,
  `- Reprovadas: ${r.reprovadas.map((x) => `${x.id} (${x.motivo})`).join("; ") || "nenhuma"}`,
  `- Edição: ${r.arquivo ?? "não publicada"}`,
];
writeFileSync(`${SAIDAS}m05-relatorio.md`, relatorio.join("\n"));
console.log(`\n\n${relatorio.join("\n")}`);
await clienteFontes.close();
await clienteEdicao.close();
