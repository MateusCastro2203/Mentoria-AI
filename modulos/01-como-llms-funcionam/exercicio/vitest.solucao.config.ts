// Roda os mesmos testes contra solucao/ em vez de src/ (pnpm --filter @mentoria/ex01-llms test:solucao).
// Só os arquivos com TODO são redirecionados; os fornecidos (tokenizador, aleatorio) continuam vindo de src/.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const solucao = fileURLToPath(new URL("./solucao/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^(?:\.\.\/)+src\/(tokens|sampling|contexto|desafio\/bigrama)\.js$/, replacement: `${solucao}$1.ts` }],
  },
});
