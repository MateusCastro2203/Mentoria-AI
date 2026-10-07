// Roda os mesmos testes contra solucao/ em vez de src/ (pnpm --filter @mentoria/ex02-decisoes test:solucao).
// Só os arquivos com TODO são redirecionados; os fornecidos continuam vindo de src/.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const solucao = fileURLToPath(new URL("./solucao/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^(?:\.\.\/)+src\/(confianca|calibracao|desafio\/temperatura)\.js$/, replacement: `${solucao}$1.ts` }],
  },
});
