// Demo (aula, 20–30 min): a mesma notícia em texto livre (3×, temperature 0.7) e como decisão tipada.
// pnpm -F @mentoria/ex02-decisoes demo:livre-vs-tipado [id-da-noticia]
import { gerarObjeto, gerarTexto, lerConfig } from "@mentoria/llm";
import { carregarNoticias } from "@mentoria/curador";
import { montarPromptClassificacao } from "../../../../projeto-final/solucao/m01/classificar-livre.js";
import { montarPromptTipado, SchemaClassificacao } from "../../../../projeto-final/solucao/m02/classificar-tipado.js";

const id = process.argv[2] ?? "n06";
const noticia = carregarNoticias().find((n) => n.id === id)!;
console.log(`Modelo: ${lerConfig().modelo}\nNotícia ${id}: ${noticia.titulo}\nRótulo humano: ${JSON.stringify(noticia.rotulo)}\n`);

console.log("── Texto livre (temperature 0.7) ──");
for (let i = 1; i <= 3; i++) {
  const r = await gerarTexto({ ...montarPromptClassificacao(noticia), temperature: 0.7 });
  console.log(`${i}. [${r.uso.latenciaMs} ms · ${r.uso.tokensSaida} tokens] ${r.texto.replace(/\s*\n\s*/g, " ⏎ ")}\n`);
}

console.log("── Decisão tipada (Zod, temperature 0) ──");
const r = await gerarObjeto({ ...montarPromptTipado(noticia), schema: SchemaClassificacao, temperature: 0 });
console.log(`[${r.uso.latenciaMs} ms · ${r.uso.tokensSaida} tokens]`, r.objeto);
