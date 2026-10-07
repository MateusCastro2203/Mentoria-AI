// Experimento da etapa M1 (fornecido): roda classificarLivre 5 vezes por temperatura em 3 notícias,
// com o modelo de verdade, e grava as respostas em saidas/m01-temperaturas.md.
// pnpm --filter @mentoria/curador m01:temperaturas            (usa o seu código, em src/)
// pnpm --filter @mentoria/curador m01:temperaturas:solucao    (usa a solução de referência)
import { mkdirSync, writeFileSync } from "node:fs";
import { lerConfig } from "@mentoria/llm";
import { carregarNoticias } from "../src/noticia.js";

const { classificarLivre }: typeof import("../src/m01/classificar-livre.js") = process.env.SOLUCAO
  ? await import("../solucao/m01/classificar-livre.js")
  : await import("../src/m01/classificar-livre.js");

const TEMPERATURAS = [0, 0.7, 1.5];
const REPETICOES = 5;
const noticias = carregarNoticias().filter((n) => ["n01", "n05", "n11"].includes(n.id));

const linhas = [`# M1 · Classificação em texto livre`, ``, `Modelo: \`${lerConfig().modelo}\``, ``];

for (const noticia of noticias) {
  linhas.push(`## ${noticia.titulo}`, ``, `Rótulo humano: ${JSON.stringify(noticia.rotulo)}`, ``);
  for (const temperature of TEMPERATURAS) {
    linhas.push(`### temperature = ${temperature}`, ``);
    for (let i = 1; i <= REPETICOES; i++) {
      const resposta = await classificarLivre(noticia, { temperature });
      linhas.push(`${i}. ${resposta.replace(/\s*\n\s*/g, " ⏎ ")}`);
      process.stdout.write(".");
    }
    linhas.push(``);
  }
}

mkdirSync(new URL("../saidas/", import.meta.url), { recursive: true });
const destino = new URL("../saidas/m01-temperaturas.md", import.meta.url);
writeFileSync(destino, linhas.join("\n"));
console.log(`\nRespostas gravadas em ${destino.pathname}`);
