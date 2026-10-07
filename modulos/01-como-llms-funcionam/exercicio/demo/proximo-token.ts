// Demo (aula, 11–20 min): o modelo escolhe um token por vez, entre candidatos com probabilidades.
// Precisa de um provedor que devolva logprobs (pnpm verificar mostra se o seu devolve).
// pnpm --filter @mentoria/ex01-llms demo:proximo-token
import { gerarTexto } from "@mentoria/llm";

const prompt = process.argv[2] ?? "Complete a frase com poucas palavras: A capital do Brasil é";
const { texto, logprobs } = await gerarTexto({ prompt, temperature: 0, logprobs: true });

if (!logprobs) {
  console.log("Seu provedor não devolveu logprobs. Resposta:", texto);
  process.exit(0);
}

console.log(`Prompt: ${prompt}\nResposta: ${texto}\n`);
for (const t of logprobs.slice(0, 8)) {
  const alternativas = t.alternativas
    .map((a) => `${JSON.stringify(a.token)} ${(Math.exp(a.logprob) * 100).toFixed(1)}%`)
    .join("  ");
  console.log(`${JSON.stringify(t.token).padEnd(14)} ← ${alternativas}`);
}
