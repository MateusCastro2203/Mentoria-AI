// Roda os mesmos testes contra solucao/ em vez de src/ (pnpm --filter @mentoria/ex06-langgraph test:solucao).
// Redireciona um import de src/ só quando o arquivo existe em solucao/.
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";

const raiz = fileURLToPath(new URL(".", import.meta.url));
const src = resolve(raiz, "src");
const solucao = resolve(raiz, "solucao");

const usarSolucao: Plugin = {
  name: "usar-solucao",
  enforce: "pre",
  resolveId(fonte, importador) {
    if (!importador || !fonte.startsWith(".") || importador.startsWith(solucao)) return null;
    const alvo = resolve(dirname(importador), fonte).replace(/\.js$/, ".ts");
    if (!alvo.startsWith(src)) return null;
    const naSolucao = alvo.replace(src, solucao);
    return existsSync(naSolucao) ? naSolucao : null;
  },
};

export default defineConfig({ plugins: [usarSolucao] });
