// Roda uma config do promptfoo e devolve os resultados (usado por m03:avaliar e m08:avaliar).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function rodarPromptfoo(pasta: string, config: string, saida: string) {
  console.log(`▸ promptfoo eval -c evals/${config}`);
  const r = spawnSync(`${pasta}node_modules/.bin/promptfoo`, ["eval", "-c", `evals/${config}`, "--no-cache", "--no-table", "--no-progress-bar", "-o", saida], {
    cwd: pasta,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PROMPTFOO_DISABLE_TELEMETRY: "1", PROMPTFOO_DISABLE_UPDATE: "1" },
  });
  // O promptfoo sai com código != 0 quando alguma asserção falha; isso é esperado aqui.
  if (r.error) throw r.error;
  return JSON.parse(readFileSync(saida, "utf8")).results.results as ResultadoPromptfoo[];
}

export interface ResultadoPromptfoo {
  provider: { label: string };
  vars: Record<string, string>;
  namedScores: Record<string, number>;
  response?: { output?: string };
  error?: string;
}
