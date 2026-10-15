# Módulo 08 — Deploy e operação

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** Módulo 07 e a sua resposta a "o que fica automático na versão agendada?"
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. escolher onde rodar um fluxo com LLM e transformar os limites da plataforma (tempo, CPU, chamadas por execução) em decisões de desenho;
2. colocar um fluxo agendado num Cloudflare Worker com Cron Trigger e estado num KV, e testá-lo localmente;
3. rastrear cada chamada ao modelo (papel, item, tokens, latência) e calcular custo e latência (p50/p95) por execução;
4. versionar o prompt como um artefato, promover uma versão só se ela passar no portão de avaliação, e reverter sem novo deploy;
5. montar um CI com duas velocidades: testes offline em todo push e eval com o modelo de verdade quando o prompt muda;
6. escrever um job que aguenta produção: idempotência, retry só para erro transitório, backoff e teto de custo.

## Mensagem central

> Em produção, o que importa é o que você consegue **ver** e **desfazer**. Rastreie cada chamada (onde vai o tempo e o dinheiro), versione o prompt como código (com um portão de avaliação antes e um botão de voltar depois) e escreva o job supondo que ele vai rodar duas vezes, falhar no meio e custar mais do que você pensou.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–8 | **Empacotar e escolher a plataforma** | Por que Workers (runtime TS, cron, KV) e não Apps Script ou Sites. Os limites como requisito: 50 chamadas por execução no plano gratuito → 8 notícias, não 32. Coletor vira código. | — |
| 8–18 | **Rastreio, custo e latência** | Um evento por chamada ao modelo, com papel e item. Custo = tokens × preço. p50 × p95. O rastro real: o revisor gerou 87% dos tokens de saída. | `m08:operar execucoes` |
| 18–26 | **Versão do prompt e rollback** | O prompt como artefato com hash. Portão absoluto (CI) × relativo (contra a versão ativa). Reverter sem deploy; `wrangler rollback` para o código. O que o rollback **não** desfaz. | `m08:operar promover` / `reverter` |
| 26–33 | **Evals em CI** | Duas velocidades: testes offline em todo push; eval com o modelo de verdade só quando o prompt muda. O portão reprova → PR vermelho. | GitHub Actions |
| 33–40 | **Demo: o cron no Worker** | `wrangler dev --test-scheduled`, disparar o cron, ver a pausa, revisar por HTTP, publicar. Idempotência: disparar de novo não faz nada. | `m08:dev` · `m08:operar` |
| 40–55 | **Discussão** | Perguntas abaixo + retrospectiva da mentoria. | — |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M8. | — |

> **Corte declarado:** monitoramento em produção (alertas, SLOs, drift do modelo e dos dados, avaliação online) e os detalhes de exportar rastros por OpenTelemetry ficam na [leitura de apoio](conceitos.md#7-monitoramento-em-produção-leitura-extra). A retrospectiva da mentoria entra nos 15 min de discussão.

### Comandos das demos

Da raiz do repositório:

```bash
cp projeto-final/.dev.vars.example projeto-final/.dev.vars       # uma vez: o token do editor, local
pnpm -F @mentoria/curador m08:dev:solucao                         # terminal 1: o Worker local (porta 8787)
pnpm -F @mentoria/curador m08:operar rodar                        # terminal 2: dispara o cron (~4 min com 8 notícias)
pnpm -F @mentoria/curador m08:operar pendentes                    # as pausas
pnpm -F @mentoria/curador m08:operar responder '{"n39":{"acao":"rejeitar","motivo":"sem fonte"}}'
pnpm -F @mentoria/curador m08:operar responder '{"edicao":{"acao":"aprovar"}}'
pnpm -F @mentoria/curador m08:operar execucoes                    # rastro: custo, tokens, p50/p95 por papel
pnpm -F @mentoria/curador m08:avaliar:solucao                     # eval da skill (~1,5 min) → saidas/m08-avaliacao.json
pnpm -F @mentoria/curador m08:operar promover v1                  # o Worker confere o portão e ativa
pnpm -F @mentoria/curador m08:operar reverter                     # rollback
pnpm -F @mentoria/ex08-operacao demo:falhas:solucao               # offline: retry, idempotência, orçamento
```

### Notas para o mentor

Rodei tudo com `qwen3:4b-instruct` (Ollama), local, no `wrangler dev`. **Rode `m08:operar rodar` antes da aula**: são uns 4 minutos de modelo. Na aula, mostre o resultado e faça a revisão ao vivo.

| O quê | Resultado | Tempo |
|---|---|---|
| cron com 8 notícias | 20 chamadas ao modelo; pausou em 1 item (`n39`, sem fonte) | ~4 min (245 s) |
| retomadas por HTTP | rejeitar `n39`, aprovar a edição de 5 itens → publicada no KV | ~0 s, **0 chamadas** ao modelo |
| `m08:avaliar` (skill da solução) | macro-F1 0,967 · acurácia 95% · 0 casos especiais publicados | 94 s |
| skill "v2" piorada de propósito | macro-F1 0,852: **passa** no portão absoluto (≥ 0,8), **barrada** pelo Worker (pior que a ativa, 0,967) | 96 s |
| promover v1.1 e reverter | v1 → v1.1 → v1, sem deploy | instantâneo |
| `ci.yml` no GitHub Actions | typecheck + testes offline verdes | 49 s |
| `eval-prompt.yml` no GitHub Actions (runner sem GPU) | mesmo macro-F1 do local (0,967); portão aprovado | ~6 min no total (Ollama 57 s, eval 257 s) |

- **O rastro mostrou onde vai o custo.** Das 20 chamadas, as 6 do **revisor** geraram 3.747 dos 4.302 tokens de saída (87%) e tiveram p50 de 72 s. Investigando: com saída estruturada (JSON schema), o Ollama contou 758 tokens de saída para uma resposta de 326 caracteres; a mesma pergunta sem schema deu 152 tokens para 538 caracteres. Não investiguei a causa. A lição: **custo se mede, não se estima**. Sem o rastro, ninguém olharia para o revisor.
- **Latência por chamada ≠ duração da execução.** As latências somaram 829 s numa execução de 245 s: as classificações rodam em paralelo e ficam na fila do Ollama local, o que infla o p95. Use isso para explicar por que o p95 importa e por que a soma engana.
- **O portão em duas camadas pegou uma regressão real.** A "v2" ("considere relevante tudo que mencione IA") passou no mínimo absoluto, mas o Worker a barrou por ser pior que a versão no ar. O CI não sabe qual versão está no ar; o Worker sabe.
- **LangGraph roda no Workers, com um ajuste.** O wrangler empacota a entrada `browser` do LangGraph, que não liga o AsyncLocalStorage; sem ele, o `interrupt()` falha com "Called interrupt() outside the context of a graph". O `worker/recursos.ts` liga na mão. Também foi preciso não calcular caminho de arquivo no carregamento do módulo (`import.meta.url` não é `file:` no Workers).
- **O que não medi:** o deploy de verdade (precisa de conta Cloudflare; é desafio extra) e o tempo de CPU por execução. O plano gratuito dá 10 ms de CPU; esperar o modelo não conta, mas o trabalho do LangGraph conta. Não sei se cabe. Se for publicar, meça.
- **Proxy corporativo:** se o `wrangler dev` mostrar "self-signed certificate in certificate chain" ao buscar o `Request.cf`, é aviso; o Worker funciona no local.

## Perguntas para discussão (15 min)

1. No seu trabalho, qual job com IA rodaria agendado? O que acontece se ele rodar duas vezes? E se não rodar?
2. Quem decide promover uma versão de prompt: o CI, uma pessoa, os dois? Que número você exigiria?
3. O revisor custa 87% dos tokens de saída. Você o tiraria, trocaria por um modelo menor ou por regras? Como saberia se a qualidade caiu?
4. Rollback do prompt é instantâneo; o da edição já enviada, não. O que mais no seu sistema não volta com rollback?
5. **Retrospectiva:** das oito aulas, o que você já usaria amanhã? O que ficou faltando?

## Armadilhas comuns

- **Job não idempotente:** o cron dispara duas vezes (acontece) e o e-mail sai duas vezes.
- **Retry em tudo:** tentar de novo um erro de schema não melhora nada e gasta tokens. Retry só para erro transitório (limite de taxa, 5xx, rede).
- **Retry em duas camadas:** o SDK tenta 3 vezes, seu código tenta 3 vezes → até 9 chamadas. Escolha uma camada.
- **Custo estimado como fatura:** `caracteres ÷ 4` serve de teto; a fatura vem do `usage` que o provedor devolve.
- **Somar latências e chamar de duração:** com paralelismo, a soma passa (muito) da duração. Olhe p50 e p95 por papel.
- **Prompt sem versão no registro da execução:** sem isso, não dá para saber qual prompt gerou a edição ruim.
- **Avaliação de um texto, promoção de outro:** confira pelo hash.
- **Achar que rollback desfaz tudo:** o código e o prompt voltam; dados gravados, mensagens enviadas e edições publicadas não.
- **Eval com LLM em todo push:** lenta e cara; o time passa a ignorar. Rode quando o prompt, o modelo ou o dataset mudam.
- **Gravar no KV a cada passo do grafo:** o KV aceita 1 escrita por segundo na mesma chave. Grave no fim (ou use um banco).
- **Segredo no código ou no `wrangler.jsonc`:** use `wrangler secret put` (e `.dev.vars` no local, fora do git).

## Exercício (assíncrono)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** um job diário (Worker com Cron Trigger) que resume os chamados de suporte com um LLM: idempotência por dia, retry com backoff só para erro transitório, teto de custo estimado e registro de tokens e custo. Feito = `pnpm -F @mentoria/ex08-operacao test` verde.
- **Desafio extra:** canário. Uma parte das execuções vai para a versão nova, escolhida de forma determinística, e ela é promovida ou revertida com base na taxa de falha. Feito = `pnpm -F @mentoria/ex08-operacao test:desafio` verde.

## Projeto final — etapa M8

Em [`projeto-final/`](../../projeto-final/README.md): o curador vira um Worker agendado, com revisão por HTTP, rastro de custo e latência, versões do prompt com portão e rollback, e CI.

- Feito = `pnpm -F @mentoria/curador exec vitest run test/m08.test.ts` verde **e** uma edição gerada pelo cron no `wrangler dev`, revisada por HTTP e publicada.

## Referências

- Cloudflare Workers — Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare Workers — limites: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers — compatibilidade com Node.js: https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- Workers KV — limites: https://developers.cloudflare.com/kv/platform/limits/ · consistência: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- Workers — versões e rollback: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/
- Workers — logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/ · traces: https://developers.cloudflare.com/workers/observability/traces/
- LangChain — deploy em Cloudflare Workers: https://docs.langchain.com/langsmith/deploy-cloudflare-workers
- promptfoo — CI/CD: https://www.promptfoo.dev/docs/integrations/ci-cd/
- AI SDK — telemetria: https://ai-sdk.dev/docs/ai-sdk-core/telemetry
- OpenTelemetry — convenções semânticas para GenAI: https://github.com/open-telemetry/semantic-conventions-genai
- Ewaschuk, R. (2016). *Monitoring Distributed Systems*. Em: Beyer, B. et al. (orgs.), *Site Reliability Engineering*. O'Reilly. (Os quatro sinais de ouro.) https://sre.google/sre-book/monitoring-distributed-systems/
- Amazon Builders' Library. *Timeouts, retries, and backoff with jitter*. https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter
- Sculley et al. (2015). *Hidden Technical Debt in Machine Learning Systems*. NeurIPS. https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems
