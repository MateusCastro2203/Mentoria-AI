// Demo (aula, 30–37 min): a confiança que o modelo informa acompanha o acerto?
// Lê projeto-final/saidas/m02-previsoes.json (gerado por: pnpm -F @mentoria/curador m02:comparar:solucao).
// pnpm -F @mentoria/ex02-decisoes demo:calibracao
import { existsSync, readFileSync } from "node:fs";
import { acuracia, brier, coberturaVsAcuracia, ece, tabelaDeCalibracao } from "../solucao/calibracao.js";

const arquivo = new URL("../../../../projeto-final/saidas/m02-previsoes.json", import.meta.url);
if (!existsSync(arquivo)) {
  console.log("Rode antes: pnpm -F @mentoria/curador m02:comparar:solucao");
  process.exit(1);
}
const previsoes: { id: string; confianca: number; acertou: boolean }[] = JSON.parse(readFileSync(arquivo, "utf8"));
const media = previsoes.reduce((s, p) => s + p.confianca, 0) / previsoes.length;

console.log(`${previsoes.length} previsões`);
console.log(`Acurácia:          ${(acuracia(previsoes) * 100).toFixed(0)}%`);
console.log(`Confiança média:   ${(media * 100).toFixed(0)}%`);
console.log(`ECE:               ${ece(previsoes, 10).toFixed(3)}   (0 = calibrado)`);
console.log(`Brier:             ${brier(previsoes).toFixed(3)}   (0 = perfeito)\n`);

console.log("Faixa        n   confiança  acurácia");
for (const f of tabelaDeCalibracao(previsoes, 10).filter((f) => f.quantidade > 0)) {
  console.log(
    `${f.de.toFixed(1)}–${f.ate.toFixed(1)}  ${String(f.quantidade).padStart(3)}   ${(f.confiancaMedia! * 100).toFixed(0).padStart(5)}%    ${(f.acuracia! * 100).toFixed(0).padStart(5)}%`,
  );
}

console.log("\nSe eu só aceitar automaticamente acima de um limiar:");
for (const limiar of [0.9, 0.95, 0.99]) {
  const { cobertura, acuracia: acc } = coberturaVsAcuracia(previsoes, limiar);
  console.log(`  ≥ ${limiar}: cobre ${(cobertura * 100).toFixed(0)}% das notícias, acerta ${acc === null ? "—" : (acc * 100).toFixed(0) + "%"}`);
}
console.log("\nErros com confiança alta:", previsoes.filter((p) => !p.acertou).map((p) => `${p.id} (${p.confianca})`).join(", "));
