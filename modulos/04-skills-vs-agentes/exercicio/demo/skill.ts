// Demo (aula, 20–35 min): a skill do curador. O que um agente lê antes de decidir usá-la, o que lê depois,
// e a skill classificando notícias.
// pnpm -F @mentoria/ex04-agentes demo:skill
import { carregarNoticias } from "@mentoria/curador";
import { classificarComSkill, lerSkill, PASTA_SKILL } from "../../../../projeto-final/solucao/m04/skill.js";

const skill = lerSkill(PASTA_SKILL);
const tokens = (t: string) => Math.round(t.length / 4); // estimativa grosseira: ~4 caracteres por token
console.log(`Skill: ${skill.nome}\n`);
console.log(`1) Sempre carregado (nome + description, ~${tokens(skill.nome + skill.descricao)} tokens):\n   ${skill.descricao}\n`);
console.log(`2) Ao ativar (corpo do SKILL.md, ~${tokens(skill.instrucoes)} tokens):\n${skill.instrucoes.split("\n").slice(0, 8).map((l) => `   ${l}`).join("\n")}\n   …\n`);
for (const [arquivo, conteudo] of Object.entries(skill.referencias)) {
  console.log(`3) Sob demanda (${arquivo}, ~${tokens(conteudo)} tokens)\n`);
}

for (const n of carregarNoticias().filter((x) => ["n06", "n22", "n35"].includes(x.id))) {
  const r = await classificarComSkill(n);
  const esperado = n.rotulo.relevante ? n.rotulo.categoria : "irrelevante";
  const previsto = r.ok ? (r.decisao.relevante ? r.decisao.categoria : "irrelevante") : r.motivo;
  console.log(`${n.id} · ${n.titulo}\n   esperado ${esperado} · skill ${previsto}${r.ok ? ` (${r.decisao.confianca})` : ""}`);
}
