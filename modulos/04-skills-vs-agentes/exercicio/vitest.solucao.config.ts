// Roda os mesmos testes contra solucao/ em vez de src/ (pnpm --filter @mentoria/ex04-agentes test:solucao).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const solucao = fileURLToPath(new URL("./solucao/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^(?:\.\.\/)+src\/(framework|loop|desafio\/protecoes)\.js$/, replacement: `${solucao}$1.ts` }],
  },
});
