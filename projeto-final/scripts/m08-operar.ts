// Operar o curador no Worker (M8), pelo terminal. Fornecido. Precisa do Worker rodando (m08:dev ou publicado).
//   pnpm -F @mentoria/curador m08:operar rodar                  dispara o cron (só no local: wrangler dev --test-scheduled)
//   pnpm -F @mentoria/curador m08:operar execucoes              custo, tokens e latência das últimas edições
//   pnpm -F @mentoria/curador m08:operar pendentes              as pausas esperando decisão
//   pnpm -F @mentoria/curador m08:operar responder '{"n39":{"acao":"rejeitar","motivo":"sem fonte"}}'
//   pnpm -F @mentoria/curador m08:operar edicao                 a última edição publicada
//   pnpm -F @mentoria/curador m08:operar prompts                versão ativa do prompt e histórico
//   pnpm -F @mentoria/curador m08:operar promover <id>          promove a versão avaliada por m08:avaliar
//   pnpm -F @mentoria/curador m08:operar reverter               rollback para a versão anterior
// Endereço: CURADOR_URL (padrão http://localhost:8787). Token: EDITOR_TOKEN (ou o de .dev.vars).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RegistroDeExecucao } from "../src/m08/nuvem.js";

const PASTA = fileURLToPath(new URL("..", import.meta.url));
const URL_BASE = (process.env.CURADOR_URL ?? "http://localhost:8787").replace(/\/$/, "");
const devVars = join(PASTA, ".dev.vars");
const TOKEN =
  process.env.EDITOR_TOKEN ??
  (existsSync(devVars) ? readFileSync(devVars, "utf8").match(/^EDITOR_TOKEN=(.*)$/m)?.[1]?.trim() : undefined);

async function pedir(metodo: "GET" | "POST", caminho: string, corpo?: unknown) {
  const r = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: { "content-type": "application/json", ...(metodo === "POST" && TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  }).catch((e) => {
    throw new Error(`não consegui falar com ${URL_BASE} (${e.cause?.code ?? e.message}). O Worker está rodando? (pnpm -F @mentoria/curador m08:dev)`);
  });
  const texto = await r.text();
  const dados = r.headers.get("content-type")?.includes("json") ? JSON.parse(texto) : texto;
  if (!r.ok) {
    console.error(`HTTP ${r.status}:`, typeof dados === "string" ? dados : JSON.stringify(dados, null, 2));
    process.exit(1);
  }
  return dados;
}

const s = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

function mostrarExecucao(r: RegistroDeExecucao) {
  const t = r.rastro.total;
  console.log(
    `\n${r.execucao} · prompt ${r.prompt.id} (${r.prompt.hash}) · ${r.modelo} · ${r.noticias} notícias · ${s(r.duracaoMs)}` +
      `\n  pausas: ${r.pausas} · edição: ${r.arquivo ?? "não publicada"}${r.erro ? ` · ERRO: ${r.erro}` : ""}`,
  );
  console.log(`  ${"papel".padEnd(12)}${"chamadas".padStart(9)}${"erros".padStart(7)}${"tok. entrada".padStart(14)}${"tok. saída".padStart(12)}${"p50".padStart(9)}${"p95".padStart(9)}${"custo".padStart(11)}`);
  for (const [papel, a] of [...Object.entries(r.rastro.porPapel), ["TOTAL", t] as const]) {
    console.log(
      `  ${papel.padEnd(12)}${String(a.chamadas).padStart(9)}${String(a.erros).padStart(7)}${String(a.tokensEntrada).padStart(14)}${String(a.tokensSaida).padStart(12)}${s(a.p50Ms).padStart(9)}${s(a.p95Ms).padStart(9)}${a.custo.toFixed(4).padStart(11)}`,
    );
  }
  for (const x of r.retomadas) console.log(`  retomada ${x.em}: ${s(x.duracaoMs)}, ${x.rastro.total.chamadas} chamadas ao modelo`);
}

const [comando, ...args] = process.argv.slice(2);
switch (comando) {
  case "rodar": {
    // A rota do wrangler dev --test-scheduled. Publicado, o cron dispara sozinho (ou pelo painel).
    console.log("Disparando o cron (o modelo trabalha alguns minutos)…");
    const inicio = Date.now();
    const r = await fetch(`${URL_BASE}/cdn-cgi/local/scheduled?cron=${encodeURIComponent("0 9 * * 1")}`);
    console.log(`${r.status} ${await r.text()} em ${s(Date.now() - inicio)}`);
    const [ultima] = (await pedir("GET", "/execucoes")) as RegistroDeExecucao[];
    if (ultima) mostrarExecucao(ultima);
    break;
  }
  case "execucoes":
    for (const r of (await pedir("GET", "/execucoes")) as RegistroDeExecucao[]) mostrarExecucao(r);
    break;
  case "pendentes": {
    const { thread, pausas } = await pedir("GET", "/pendentes");
    console.log(`thread: ${thread ?? "-"} · ${pausas.length} pausa(s)`);
    for (const p of pausas) {
      if (p.tipo === "item") console.log(`\n⏸  ${p.id} · ${p.titulo}\n   ${p.url}\n   categoria: ${p.categoria ?? "-"} · confiança: ${p.confianca ?? "-"} · motivo: ${p.motivo}`);
      else {
        console.log(`\n⏸  edicao · ${p.itens.length} itens`);
        p.itens.forEach((i: { id: string; categoria: string; titulo: string }, n: number) => console.log(`   ${String(n + 1).padStart(2)}. ${i.id} [${i.categoria}] ${i.titulo}`));
      }
    }
    if (pausas.length) console.log(`\nResponda com: m08:operar responder '{"<id ou edicao>": {"acao": "aprovar"}}'`);
    break;
  }
  case "responder": {
    const r = await pedir("POST", "/retomar", { respostas: JSON.parse(args[0] ?? "{}") });
    console.log(r.arquivo ? `✅ publicada: ${r.arquivo}` : `${r.pausas.length} pausa(s) restante(s): ${r.pausas.map((p: { id?: string; tipo: string }) => (p.tipo === "item" ? p.id : "edicao")).join(", ")}`);
    break;
  }
  case "edicao":
    console.log(await pedir("GET", "/edicao"));
    break;
  case "prompts":
    console.log(JSON.stringify(await pedir("GET", "/prompts"), null, 2));
    break;
  case "promover": {
    const id = args[0];
    const arquivo = join(PASTA, "saidas/m08-avaliacao.json");
    if (!id || !existsSync(arquivo)) {
      console.error("uso: m08:operar promover <id>   (rode antes m08:avaliar, que grava saidas/m08-avaliacao.json)");
      process.exit(1);
    }
    const { pasta, avaliacao } = JSON.parse(readFileSync(arquivo, "utf8"));
    const texto = readFileSync(join(pasta, "SKILL.md"), "utf8");
    console.log(JSON.stringify(await pedir("POST", "/prompts", { id, texto, avaliacao }), null, 2));
    break;
  }
  case "reverter":
    console.log(JSON.stringify(await pedir("POST", "/prompts/reverter"), null, 2));
    break;
  default:
    console.log("comandos: rodar · execucoes · pendentes · responder <json> · edicao · prompts · promover <id> · reverter");
}
