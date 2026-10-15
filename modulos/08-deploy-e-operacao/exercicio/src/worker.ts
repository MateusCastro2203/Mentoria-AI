// Fornecido: o job como um Cloudflare Worker. O Cron Trigger chama `scheduled` todo dia; `fetch` mostra o resultado.
//   pnpm -F @mentoria/ex08-operacao dev            (o seu src/execucao.ts)
//   pnpm -F @mentoria/ex08-operacao dev:solucao    (a solução)
// Disparar o cron no local (o `time` escolhe o dia: 13/10/2026, que tem chamados):
//   curl "http://localhost:8787/cdn-cgi/local/scheduled?cron=0+8+*+*+*&time=1791878400000"
//   curl "http://localhost:8787/resumo?data=2026-10-13"
import { gerarTexto } from "@mentoria/llm";
import { APICallError, RetryError } from "ai";
import chamados from "../dados/chamados.json" with { type: "json" };
import { ErroTransitorio, POLITICA_PADRAO, type Armazenamento, type Chamado, type Dependencias } from "./estado.js";
import { executarDia, textoDosChamados } from "./execucao.js";

export interface Env {
  RESUMOS: Armazenamento;
  PRECO_ENTRADA_POR_MILHAO?: string;
  PRECO_SAIDA_POR_MILHAO?: string;
  ORCAMENTO?: string;
  /** Para a demo: as N primeiras chamadas de cada execução falham com um erro transitório simulado. */
  SIMULAR_FALHAS?: string;
}

/** Erros do provedor que valem nova tentativa viram ErroTransitorio; o resto segue como está. */
function classificarErro(e: unknown): unknown {
  const erro = RetryError.isInstance(e) ? e.lastError : e;
  if (APICallError.isInstance(erro) && erro.isRetryable) return new ErroTransitorio(`${erro.statusCode ?? "rede"}: ${erro.message}`);
  if (erro instanceof TypeError && /fetch/i.test(erro.message)) return new ErroTransitorio(`rede: ${erro.message}`);
  return erro;
}

export function criarWorker(executar: typeof executarDia) {
  function dependencias(env: Env): Dependencias {
    let falhasSimuladas = Number(env.SIMULAR_FALHAS ?? 0);
    return {
      armazenamento: env.RESUMOS,
      agora: () => new Date(),
      esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
      async resumir(doDia: Chamado[]) {
        if (falhasSimuladas-- > 0) throw new ErroTransitorio("503 (simulado)");
        try {
          const { texto, uso } = await gerarTexto({
            system:
              "Você resume os chamados de suporte do dia para o time de produto. Português, no máximo 4 linhas: agrupe chamados sobre o mesmo problema, diga quantos são e destaque os de prioridade alta.",
            prompt: textoDosChamados(doDia),
            temperature: 0,
            retentativas: 0, // o retry é nosso (executarDia); duas camadas de retry multiplicam as chamadas
          });
          return { texto: texto.trim(), uso };
        } catch (e) {
          throw classificarErro(e);
        }
      },
    };
  }

  return {
    async scheduled(controller: { scheduledTime: number }, env: Env): Promise<void> {
      const data = new Date(controller.scheduledTime).toISOString().slice(0, 10);
      const politica = {
        ...POLITICA_PADRAO,
        orcamento: Number(env.ORCAMENTO ?? POLITICA_PADRAO.orcamento),
        precos: { entradaPorMilhao: Number(env.PRECO_ENTRADA_POR_MILHAO ?? 0), saidaPorMilhao: Number(env.PRECO_SAIDA_POR_MILHAO ?? 0) },
      };
      const r = await executar(dependencias(env), data, chamados as Chamado[], politica);
      // Uma linha JSON por execução: é o que você filtra nos logs do Worker.
      console.log(JSON.stringify({ evento: "resumo-diario", ...r, resumo: undefined }));
    },

    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname !== "/resumo") return new Response("GET /resumo?data=AAAA-MM-DD\n");
      const data = url.searchParams.get("data") ?? new Date().toISOString().slice(0, 10);
      const registro = await env.RESUMOS.get(`execucao:${data}`);
      return new Response(registro ?? JSON.stringify({ erro: `nada registrado em ${data}` }), {
        status: registro ? 200 : 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    },
  };
}

export default criarWorker(executarDia);
