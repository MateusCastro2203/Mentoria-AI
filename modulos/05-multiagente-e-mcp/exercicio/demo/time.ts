// Demo (aula, 30–40 min): o time do curador em versão curta (3 itens), mostrando cada papel trabalhando.
// pnpm -F @mentoria/ex05-mcp demo:time
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { conectarEmMemoria } from "../../../../projeto-final/solucao/m05/mcp-para-ai-sdk.js";
import { criarPapeis } from "../../../../projeto-final/solucao/m05/papeis.js";
import { criarServidorEdicao } from "../../../../projeto-final/solucao/m05/servidor-edicao.js";
import { criarServidorFontes } from "../../../../projeto-final/solucao/m05/servidor-fontes.js";
import { montarEdicao, type Papeis } from "../../../../projeto-final/solucao/m05/time.js";

const pasta = mkdtempSync(join(tmpdir(), "edicao-"));
const fontes = await conectarEmMemoria(criarServidorFontes());
const edicao = await conectarEmMemoria(criarServidorEdicao({ pasta }));
const { papeis, trajetoriaDoColetor } = await criarPapeis({ clienteFontes: fontes });

const falando: Papeis = {
  coletar: async () => {
    console.log("🧺 coletor: lendo as fontes pelo MCP…");
    const ids = await papeis.coletar();
    for (const c of trajetoriaDoColetor) console.log(`   ${c.ferramenta}(${JSON.stringify(c.entrada).slice(0, 70)})`);
    console.log(`   → ${ids.length} candidatos`);
    return ids;
  },
  classificar: async (id) => {
    const a = await papeis.classificar(id);
    console.log(`🏷️  classificador: ${id} → ${a.acao}${a.categoria ? ` (${a.categoria}, ${a.confianca})` : ""}`);
    return a;
  },
  redigir: async (id, feedback) => {
    const r = await papeis.redigir(id, feedback);
    console.log(`✍️  redator: ${id}${feedback ? " (2ª tentativa)" : ""}: ${r}`);
    return r;
  },
  revisar: async (id, resumo) => {
    const r = await papeis.revisar(id, resumo);
    console.log(`🔎 revisor: ${id} → ${r.aprovado ? "aprovado" : `reprovado: ${r.motivo}`}`);
    return r;
  },
};

const r = await montarEdicao(
  falando,
  async (itens) => {
    const res: any = await edicao.callTool({ name: "publicar_edicao", arguments: { titulo: "Curador de IA · demo", itens } });
    return { arquivo: res.structuredContent.arquivo };
  },
  { maxItens: 3 },
);
console.log(`\n📰 edição publicada pelo MCP de edição (${r.arquivo}):\n`);
console.log(r.arquivo ? readFileSync(r.arquivo, "utf8") : "(nada aprovado)");
