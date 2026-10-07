// Demo (aula, 11–20 min): mesmo prompt, 5 execuções com temperature 0 e 5 com temperature 1.2.
// pnpm --filter @mentoria/ex01-llms demo:temperatura
import { gerarTexto, lerConfig } from "@mentoria/llm";

const prompt = "Escreva a primeira frase de uma newsletter semanal sobre IA. Responda só com a frase.";
console.log(`Modelo: ${lerConfig().modelo}\nPrompt: ${prompt}\n`);

for (const temperature of [0, 1.2]) {
  console.log(`temperature = ${temperature}`);
  for (let i = 1; i <= 5; i++) {
    const { texto } = await gerarTexto({ prompt, temperature });
    console.log(`  ${i}. ${texto.trim()}`);
  }
  console.log();
}
