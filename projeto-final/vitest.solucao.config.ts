// Roda os mesmos testes contra solucao/ em vez de src/ (pnpm --filter @mentoria/curador test:solucao).
// Só os arquivos das etapas (src/mNN/...) são redirecionados; o resto continua vindo de src/.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const solucao = fileURLToPath(new URL("./solucao/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^(?:\.\.\/)+src\/(m\d+\/.+)\.js$/, replacement: `${solucao}$1.ts` }],
  },
});
