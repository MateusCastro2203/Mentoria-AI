// Demo offline (sem modelo): o que um job agendado precisa aguentar em produção.
//   pnpm -F @mentoria/ex08-operacao demo:falhas            (o seu src/execucao.ts)
//   pnpm -F @mentoria/ex08-operacao demo:falhas:solucao    (a solução)
// Um "modelo" de mentira que falha quando mandamos; as esperas são registradas, não dormidas.
import { readFileSync } from "node:fs";
import { ErroTransitorio, POLITICA_PADRAO, type Chamado, type Dependencias, type Politica, type Uso } from "../src/estado.js";

const { executarDia }: typeof import("../src/execucao.js") = process.env.SOLUCAO
  ? await import("../solucao/execucao.js")
  : await import("../src/execucao.js");

const chamados: Chamado[] = JSON.parse(readFileSync(new URL("../dados/chamados.json", import.meta.url), "utf8"));
const kv = new Map<string, string>();
let relogio = Date.parse("2026-10-13T08:00:00Z");
let roteiro: (Error | "ok")[] = [];
let chamadasAoModelo = 0;

const deps: Dependencias = {
  armazenamento: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => void kv.set(k, v) },
  agora: () => new Date(relogio),
  esperar: async (ms) => {
    console.log(`      ⏳ espera ${ms / 1000} s`);
    relogio += ms;
  },
  async resumir(doDia) {
    chamadasAoModelo++;
    const proximo = roteiro.shift() ?? "ok";
    console.log(`      → chamada ao modelo #${chamadasAoModelo}: ${proximo === "ok" ? "ok" : `${proximo.name}: ${proximo.message}`}`);
    if (proximo !== "ok") throw proximo;
    const uso: Uso = { tokensEntrada: 60 * doDia.length, tokensSaida: 80 };
    return { texto: `${doDia.length} chamados; destaque: ${doDia.find((c) => c.prioridade === "alta")?.titulo ?? "nenhum de prioridade alta"}.`, uso };
  },
};

// Preços inventados, só para a conta aparecer.
const politica: Politica = { ...POLITICA_PADRAO, precos: { entradaPorMilhao: 1, saidaPorMilhao: 4 } };

async function cena(titulo: string, data: string, falhas: (Error | "ok")[], p: Politica = politica) {
  roteiro = falhas;
  const antes = chamadasAoModelo;
  console.log(`\n▶ ${titulo}`);
  const r = await executarDia(deps, data, chamados, p);
  console.log(
    `   status: ${r.status} · tentativas: ${r.tentativas} · chamadas nesta cena: ${chamadasAoModelo - antes} · tokens: ${r.tokensEntrada}+${r.tokensSaida} · custo: ${r.custo.toFixed(6)}${r.erro ? ` · erro: ${r.erro}` : ""}`,
  );
}

await cena("13/10, 8h: o provedor está instável (429, depois 503)", "2026-10-13", [new ErroTransitorio("429 limite de taxa"), new ErroTransitorio("503 indisponível"), "ok"]);
await cena("13/10, 8h05: o cron disparou de novo (acontece)", "2026-10-13", ["ok"]);
await cena("14/10: o modelo devolveu algo fora do formato (não adianta insistir)", "2026-10-14", [new Error("resposta fora do schema")]);
await cena("14/10, de novo: o dia que falhou roda outra vez", "2026-10-14", ["ok"]);
await cena("15/10: um preço 100× maior estoura o orçamento", "2026-10-15", ["ok"], { ...politica, precos: { entradaPorMilhao: 100, saidaPorMilhao: 400 }, orcamento: 0.001 });
await cena("20/10: dia sem chamados", "2026-10-20", ["ok"]);
await cena("15/10, provedor fora do ar o tempo todo", "2026-10-15", [new ErroTransitorio("503"), new ErroTransitorio("503"), new ErroTransitorio("503")]);

console.log(`\nTotal de chamadas ao modelo: ${chamadasAoModelo}. Registros no KV: ${[...kv.keys()].join(", ")}`);
