/**
 * pnpm verificar — confere se o ambiente está pronto para a mentoria.
 * Critério de feito do módulo 00-setup: todas as verificações obrigatórias com ✔.
 */
import { z } from "zod";
import { gerarObjeto, gerarTexto, lerConfig } from "@mentoria/llm";

const config = lerConfig();
let falhas = 0;

const ok = (msg: string) => console.log(`  ✔ ${msg}`);
const info = (msg: string) => console.log(`  ℹ ${msg}`);
const falha = (msg: string, dica: string) => {
  falhas++;
  console.log(`  ✖ ${msg}\n    → ${dica}`);
};

async function verificar(nome: string, fn: () => Promise<void> | void) {
  try {
    await fn();
  } catch (erro) {
    falha(`${nome}: ${erro instanceof Error ? erro.message : String(erro)}`, dicaPara(erro));
  }
}

function dicaPara(erro: unknown): string {
  const texto = String((erro as any)?.cause?.code ?? (erro as any)?.message ?? erro);
  if (/ECONNREFUSED|fetch failed|Cannot connect/i.test(texto))
    return `nada respondendo em ${config.baseURL}. Ollama: abra o app ou rode \`ollama serve\`.`;
  if (/401|403|unauthori[sz]ed|api key/i.test(texto)) return "chave inválida ou ausente: confira LLM_API_KEY no .env.";
  if (/404|not found/i.test(texto))
    return `modelo "${config.modelo}" não encontrado. Ollama: \`ollama pull ${config.modelo}\`.`;
  return "veja a seção Troubleshooting em modulos/00-setup/README.md.";
}

console.log("\nAmbiente");

await verificar("Node.js", () => {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 24) return falha(`Node ${process.versions.node}`, "instale o Node 24 LTS (veja .nvmrc).");
  if (major % 2 === 1) return info(`Node ${process.versions.node} funciona, mas não é LTS; a turma usa Node 24.`);
  ok(`Node ${process.versions.node}`);
});

await verificar("pnpm", () => {
  const agente = process.env.npm_config_user_agent ?? "";
  const versao = agente.match(/pnpm\/(\S+)/)?.[1];
  if (!versao) return falha("o script não rodou via pnpm", "rode `pnpm verificar` (não `npm run verificar`).");
  ok(`pnpm ${versao}`);
});

console.log(`\nProvedor (${config.baseURL} · modelo ${config.modelo})`);

await verificar("listar modelos", async () => {
  const resposta = await fetch(`${config.baseURL}/models`, {
    headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const { data } = (await resposta.json()) as { data?: { id: string }[] };
  const ids = (data ?? []).map((m) => m.id);
  if (ids.length && !ids.includes(config.modelo))
    return falha(`modelo "${config.modelo}" não está disponível`, `Ollama: \`ollama pull ${config.modelo}\`. Disponíveis: ${ids.join(", ")}`);
  ok("provedor respondendo e modelo disponível");
});

if (falhas === 0) {
  await verificar("gerar texto", async () => {
    const r = await gerarTexto({ prompt: "Responda apenas com a palavra: pronto", temperature: 0 });
    ok(`gerar texto: "${r.texto.trim().slice(0, 40)}" (${r.uso.latenciaMs} ms, ${r.uso.tokensSaida ?? "?"} tokens de saída)`);
  });

  await verificar("saída estruturada", async () => {
    const r = await gerarObjeto({
      prompt: "Quanto é 2 + 3? Responda no formato pedido.",
      schema: z.object({ resultado: z.number() }),
      temperature: 0,
    });
    if (r.objeto.resultado !== 5) info(`saída estruturada válida, mas o modelo respondeu ${r.objeto.resultado} (esperado 5).`);
    else ok("saída estruturada validada com Zod");
  });

  await verificar("logprobs", async () => {
    const r = await gerarTexto({ prompt: "Diga sim.", temperature: 0, logprobs: true });
    if (r.logprobs?.length) info("provedor devolve logprobs (útil no Módulo 2).");
    else info("provedor não devolve logprobs; no Módulo 2 você usa autoavaliação de confiança.");
  });
}

console.log(falhas === 0 ? "\n✔ Ambiente pronto.\n" : `\n✖ ${falhas} verificação(ões) falharam.\n`);
process.exit(falhas === 0 ? 0 : 1);
