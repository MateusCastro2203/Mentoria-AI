# Exercício 08 — Um job agendado que aguenta produção

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo nem de conta na Cloudflare.

Todo dia às 8h, um Cloudflare Worker resume os chamados de suporte abertos no dia (dados sintéticos em [`dados/chamados.json`](dados/chamados.json)) com um LLM e guarda o resultado num KV. Parece simples, mas em produção:

- o cron às vezes **dispara duas vezes**;
- o provedor devolve **429** (limite de taxa) ou **503** (fora do ar) de vez em quando;
- às vezes o modelo devolve **lixo**, e tentar de novo não adianta;
- um chamado com um log colado pode fazer a chamada custar **100 vezes mais**.

```text
cron ─► executarDia(data)
          ├─ já deu "ok" hoje? ───────────────► devolve o registro (não chama o modelo)
          ├─ nenhum chamado no dia? ──────────► "sem-chamados"
          ├─ custo estimado > orçamento? ─────► "orcamento"
          └─ resumir ─┬─ ok ──────────────────► "ok" (tokens, custo, resumo)
                      ├─ ErroTransitorio ─────► espera 1 s, 2 s… e tenta de novo (até maxTentativas)
                      └─ outro erro ──────────► "falhou" (sem insistir)
```

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex08-operacao test               # versão base
pnpm -F @mentoria/ex08-operacao test:desafio       # desafio extra
pnpm -F @mentoria/ex08-operacao demo:falhas        # offline: as cenas de produção com o seu código
pnpm -F @mentoria/ex08-operacao dev                # o Worker de verdade, local (precisa do Ollama)
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex08-operacao test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | O que fazer |
|---|---|
| `src/custo.ts` | `estimarTokens` (regra de bolso: caracteres ÷ 4) e `custo` (tokens × preço por milhão) |
| `src/execucao.ts` | `executarDia`: idempotência, orçamento, retry com backoff só para erro transitório, registro no KV |

Fornecidos: `src/estado.ts` (formatos, `ErroTransitorio`, `POLITICA_PADRAO`) e `src/worker.ts` (o Worker, que usa a sua `executarDia`).

**Dicas:**
- Tudo o que vem de fora (KV, modelo, relógio, espera) chega em `deps`. Por isso o teste roda em milissegundos: a "espera" de 2 s só é anotada.
- Idempotência é **antes** de tudo: a primeira coisa é olhar se o dia já deu certo.
- Para saber se vale tentar de novo: `erro instanceof ErroTransitorio`. O Worker transforma os erros do provedor (429, 5xx, rede) em `ErroTransitorio` para você.
- Espera da tentativa n+1: `esperaInicialMs × 2^(n−1)` → 1 s, 2 s, 4 s…

**Feito =** `pnpm -F @mentoria/ex08-operacao test` com todos os testes passando.

### Ver no Worker (opcional, mas recomendado)

Com o Ollama rodando:

```bash
pnpm -F @mentoria/ex08-operacao dev -- --var SIMULAR_FALHAS:2       # as 2 primeiras chamadas falham (503 simulado)
curl "http://localhost:8787/cdn-cgi/local/scheduled?cron=0+8+*+*+*&time=1791878400000"   # cron de 13/10/2026
curl "http://localhost:8787/resumo?data=2026-10-13"
```

No log do `wrangler dev`, procure a linha `{"evento":"resumo-diario",…}` com `"tentativas":3`. Dispare o cron de novo e veja que nada muda. Com a solução, rodei: 4 chamados, 3 tentativas (2 falhas simuladas), 215 tokens de entrada e 71 de saída, ~8 s (3 s são as esperas).

Repare em `retentativas: 0` em `src/worker.ts`: o AI SDK já tenta 2 vezes sozinho. Com o seu retry por cima, seriam até 9 chamadas por execução.

## Desafio extra — canário

Uma versão nova do prompt não vai para 100% das execuções de uma vez. Em `src/desafio/canario.ts`:

1. `escolherVersao`: uma parte das execuções (o `percentual`) vai para a candidata, escolhida de forma **determinística** pela chave (use `balde(chave)`, de 0 a 99);
2. `decidirCanario`: com dados suficientes da candidata, **promover** ou **reverter** comparando a taxa de falha dela com a da versão estável.

**Feito =** `pnpm -F @mentoria/ex08-operacao test:desafio` com todos os testes passando.

**Ainda mais (opcional, precisa de conta na Cloudflare):** publique o Worker (`wrangler kv namespace create RESUMOS`, troque o `id` no `wrangler.jsonc` e rode `wrangler deploy`). Ele vai precisar de um endpoint de modelo acessível pela internet (qualquer um compatível com a API da OpenAI; configure `LLM_BASE_URL` e `LLM_MODEL` como variáveis e a chave com `wrangler secret put LLM_API_KEY`).

## Perguntas para pensar

1. Por que a idempotência olha só para o status "ok"? O que aconteceria se um dia que deu "orcamento" nunca mais rodasse?
2. Um erro 400 (pedido inválido) é transitório? E um timeout?
3. O orçamento usa uma **estimativa**. O que acontece se ela errar para baixo? Que outro limite você poria?
4. No canário, por que a escolha precisa ser determinística? O que daria errado se fosse aleatória a cada execução?
