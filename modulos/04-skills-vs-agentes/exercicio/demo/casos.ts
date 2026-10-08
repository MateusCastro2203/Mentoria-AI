// Demo (aula, discussão): os 4 casos e o que o framework recomenda. Offline.
// pnpm -F @mentoria/ex04-agentes demo:casos            (só os casos, para a turma votar)
// pnpm -F @mentoria/ex04-agentes demo:casos --revelar  (com a resposta e a justificativa)
import { CASOS_DA_AULA } from "../src/casos.js";
import { recomendarAbordagem } from "../solucao/framework.js";

const revelar = process.argv.includes("--revelar");
for (const [i, c] of CASOS_DA_AULA.entries()) {
  console.log(`\n${i + 1}. ${c.titulo}\n   ${c.descricao}`);
  if (!revelar) continue;
  const r = recomendarAbordagem(c.caso);
  console.log(`   → ${r.abordagem}`);
  for (const m of r.motivos) console.log(`     · ${m}`);
  console.log(`   Por quê: ${c.justificativa}`);
}
if (!revelar) console.log("\nPrompt, skill, agente ou decisão estruturada? (rode com --revelar depois da votação)");
