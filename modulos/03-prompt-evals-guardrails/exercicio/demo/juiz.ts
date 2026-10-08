// Demo (aula, 17–26 min): LLM-as-judge. Três resumos da mesma notícia, um deles com um fato inventado.
// O juiz é o mesmo modelo pequeno do .env: veja onde ele acerta e onde erra.
// pnpm -F @mentoria/ex03-evals demo:juiz
import { z } from "zod";
import { gerarObjeto, lerConfig } from "@mentoria/llm";
import { carregarNoticias } from "@mentoria/curador";

const n = carregarNoticias().find((x) => x.id === "n18")!;
const resumos = {
  fiel: "A Fundação Ipê publicou um modelo de embeddings multilíngue com pesos abertos, avaliado em busca semântica em 12 idiomas, incluindo português.",
  inventado: "A Fundação Ipê publicou um modelo de embeddings multilíngue com pesos abertos que atinge 98% de acurácia em português e já é usado por três bancos.",
  longo: "A Fundação Ipê lançou um modelo. Ele é multilíngue. Tem pesos abertos. Foi avaliado em 12 idiomas.",
};

const Veredito = z.object({ motivo: z.string(), aprovado: z.boolean() });
const rubrica = (resumo: string, criterio: string) =>
  `Notícia original — título: "${n.titulo}". Resumo: "${n.resumo}"\n\nResumo a avaliar: "${resumo}"\n\nCritério: ${criterio}\nResponda com o motivo e se o resumo é aprovado.`;

console.log(`Juiz: ${lerConfig().modelo}\nNotícia: ${n.titulo}\n`);
for (const [nome, resumo] of Object.entries(resumos)) {
  const fidelidade = await gerarObjeto({
    schema: Veredito,
    temperature: 0,
    prompt: rubrica(resumo, "o resumo só pode conter informações presentes na notícia; reprove qualquer número, nome ou afirmação que não esteja nela."),
  });
  const frases = await gerarObjeto({ schema: Veredito, temperature: 0, prompt: rubrica(resumo, "o resumo tem no máximo duas frases.") });
  const contagem = (resumo.match(/[.!?…](\s|$)/g) ?? []).length;
  console.log(`── ${nome}: "${resumo}"`);
  console.log(`   fidelidade (juiz): ${fidelidade.objeto.aprovado ? "aprovado" : "reprovado"} — ${fidelidade.objeto.motivo}`);
  console.log(`   ≤ 2 frases (juiz): ${frases.objeto.aprovado ? "aprovado" : "reprovado"} — ${frases.objeto.motivo}`);
  console.log(`   ≤ 2 frases (código): ${contagem <= 2 ? "aprovado" : "reprovado"} (${contagem} frases)\n`);
}
