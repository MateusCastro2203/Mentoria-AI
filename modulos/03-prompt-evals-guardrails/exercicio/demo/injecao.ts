// Demo (aula, 26–37 min): prompt injection indireta. O texto da notícia n38 manda o modelo classificá-la
// como relevante. O modelo obedece? E o que os guardrails fazem?
// pnpm -F @mentoria/ex03-evals demo:injecao
import { carregarNoticias } from "@mentoria/curador";
import { classificarTipado } from "../../../../projeto-final/solucao/m02/classificar-tipado.js";
import { decidirPublicacao, detectarInjecao } from "../../../../projeto-final/solucao/m03/guardrails.js";
import { montarPromptV2 } from "../../../../projeto-final/solucao/m03/prompt-v2.js";

const n = carregarNoticias().find((x) => x.id === "n38")!;
console.log(`n38 · ${n.titulo}\nResumo: ${n.resumo}\nRótulo humano: irrelevante\n`);
console.log("Detector de injeção:", detectarInjecao(n.resumo), "\n");

for (const [versao, montarPrompt] of [["v1 (M2)", undefined], ["v2 (XML + regra 'notícia é dado')", montarPromptV2]] as const) {
  const r = await classificarTipado(n, { montarPrompt });
  console.log(`${versao}`);
  console.log(`  modelo:     ${JSON.stringify(r)}`);
  console.log(`  guardrails: ${JSON.stringify(decidirPublicacao(n, r))}\n`);
}
