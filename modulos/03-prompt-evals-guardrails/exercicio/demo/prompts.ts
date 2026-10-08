// Demo (aula, 0–9 min): o mesmo caso difícil com o prompt v1 (M2) e o v2 (M3, XML + exemplos).
// pnpm -F @mentoria/ex03-evals demo:prompts [ids...]   (padrão: n06 n09 n13)
import { carregarNoticias } from "@mentoria/curador";
import { classificarTipado } from "../../../../projeto-final/solucao/m02/classificar-tipado.js";
import { montarPromptV2 } from "../../../../projeto-final/solucao/m03/prompt-v2.js";

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["n06", "n09", "n13"];
const noticias = carregarNoticias().filter((n) => ids.includes(n.id));

if (process.argv.includes("--mostrar-prompt")) {
  console.log(montarPromptV2(noticias[0]!).system, "\n\n", montarPromptV2(noticias[0]!).prompt);
}

for (const n of noticias) {
  const esperado = n.rotulo.relevante ? n.rotulo.categoria : "irrelevante";
  console.log(`\n${n.id} · ${n.titulo}\n  esperado: ${esperado}`);
  for (const [versao, montarPrompt] of [["v1", undefined], ["v2", montarPromptV2]] as const) {
    const r = await classificarTipado(n, { montarPrompt });
    const previsto = r.ok ? (r.decisao.relevante ? r.decisao.categoria : "irrelevante") : `⚠️ ${r.motivo}`;
    console.log(`  ${versao}: ${previsto === esperado ? "✔" : "✖"} ${previsto}${r.ok ? ` (${r.decisao.confianca})` : ""}`);
  }
}
