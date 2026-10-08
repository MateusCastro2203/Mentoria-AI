// Demo (aula, 20–35 min): o agente montando a seleção, passo a passo.
// pnpm -F @mentoria/ex04-agentes demo:agente
import { carregarFontes, carregarNoticias } from "@mentoria/curador";
import { curarComAgente } from "../../../../projeto-final/solucao/m04/agente.js";
import type { Avaliacao } from "../../../../projeto-final/solucao/m04/ferramentas.js";
import { decidirPublicacao } from "../../../../projeto-final/solucao/m03/guardrails.js";
import { classificarComSkill } from "../../../../projeto-final/solucao/m04/skill.js";

const noticias = carregarNoticias();
let avaliacoes = 0;
const inicio = Date.now();
const r = await curarComAgente({
  fontes: carregarFontes(),
  noticias,
  avaliar: async (n): Promise<Avaliacao> => {
    avaliacoes++;
    const c = await classificarComSkill(n);
    const { acao, motivos } = decidirPublicacao(n, c);
    process.stdout.write(`   · avaliou ${n.id}: ${acao}\n`);
    return { id: n.id, acao, motivos, categoria: c.ok ? c.decisao.categoria : null, confianca: c.ok ? c.decisao.confianca : null };
  },
});

console.log("\nTrajetória do agente:");
for (const c of r.chamadas) console.log(`  passo ${c.passo}: ${c.ferramenta}(${JSON.stringify(c.entrada).slice(0, 80)})`);
console.log(`\nFontes lidas (${r.fontesLidas.length}): ${r.fontesLidas.join(", ")}`);
console.log(`Entregou: ${r.entregou} · seleção aceita pelo código: ${r.selecao.length} notícias`);
console.log(`Recusadas pelo código: ${r.recusadas.map((x) => `${x.id} (${x.motivo})`).join(", ") || "nenhuma"}`);
console.log(`Chamadas ao modelo: ${r.passos} do agente + ${avaliacoes} avaliações · ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
