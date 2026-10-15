---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 08 — Deploy e operação
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 8 de 8**

# Deploy e operação

O curador rodando sozinho, toda segunda, num lugar que você não vê

<!--
Abertura (30 s). Até agora, o curador rodava no seu terminal, quando você mandava. Hoje ele roda sozinho na nuvem. As perguntas mudam: onde roda, como eu sei o que aconteceu, como eu desfaço.
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- escolher **onde rodar** e tratar os limites como requisito
- pôr um fluxo **agendado** num Worker
- **rastrear** custo e latência por execução
- **versionar** o prompt, com portão e **rollback**
- montar um **CI** com duas velocidades
- escrever um job que **aguenta produção**

</div>
<div class="card">

### Roteiro (40 min)

1. Empacotar e escolher a plataforma
2. Rastreio, custo e latência
3. Versão do prompt e rollback
4. Evals em CI
5. Demo: o cron no Worker

Depois: discussão + retrospectiva

</div>
</div>

---

<!-- _class: frase -->

Em produção, o que importa é o que você consegue **ver** e **desfazer**.

*Escreva o job supondo que ele vai rodar duas vezes, falhar no meio e custar mais do que você pensou.*

<!--
Frase da aula. Escreva no chat.
-->

---

<!-- _class: secao -->

# 1 · Empacotar e escolher a plataforma

---

## Onde o curador pode morar

| Precisa de | Workers | Apps Script | Sites |
|---|---|---|---|
| Rodar TypeScript com AI SDK, LangGraph, Zod | **sim** | não | não |
| Rodar agendado | **sim** (Cron Triggers) | sim | não |
| Guardar estado entre execuções | **sim** (KV, D1) | sim | não |

- **Empacotar:** não há disco. Feeds, skill e fontes entram **no pacote**, como texto
- **Variável** para o que muda por ambiente; **segredo** para o que é secreto (`wrangler secret put`)

<!--
0–4 min. Apps Script e Sites seguem úteis para outra coisa (uma página com a última edição). A regra: escolha pelo runtime e pelo estado de que você precisa.
-->

---

## Os limites viram requisito

| Limite | Gratuito | O que mudou no curador |
|---|---|---|
| Chamadas externas por execução | **50** | 32 notícias ≈ 70 chamadas: não cabe → **8 notícias** |
| CPU por execução | 10 ms | esperar o modelo **não conta** |
| Duração de um cron | 15 min | edição local com 32 notícias passa disso |
| Escrita no KV, mesma chave | 1 por segundo | checkpoint gravado **uma vez**, no fim |

**Coletor virou código:** às 9h de segunda ninguém olha a trajetória de um agente (Aula 4).

<p class="fonte">developers.cloudflare.com/workers/platform/limits · kv/platform/limits</p>

<!--
4–8 min. O limite de 50 subrequests do plano gratuito decidiu o tamanho da edição. Dois ajustes que só apareceram rodando de verdade: o AsyncLocalStorage do LangGraph (sem ele, o interrupt quebra no Worker) e caminhos de arquivo calculados no carregamento do módulo.
-->

---

<!-- _class: secao -->

# 2 · Rastreio, custo e latência

<span class="demo">m08:operar execucoes</span>

---

## Um evento por chamada ao modelo

<div class="cols">
<div>

```ts
observarChamadas((e) => eventos.push(e));

comAtributos({ papel: "redigir", alvo: "n13" },
  () => papeis.redigir("n13"));
```

```ts
// um evento (médias do redator na demo)
{ papel: "redigir", alvo: "n13",
  tokensEntrada: 152, tokensSaida: 49,
  latenciaMs: 9839, prompt: "embutida" }
```

</div>
<div class="card">

### Por que aqui
Toda chamada passa pelo `@mentoria/llm`: é o **único lugar** para medir

O contexto atravessa os `await` (AsyncLocalStorage): 8 classificações em **paralelo** não se misturam

</div>
</div>

<!--
8–11 min. Rastro = registro de uma execução, quebrado em partes. O padrão de mercado é OpenTelemetry (o AI SDK emite nesse formato); o nosso é caseiro para dar para ver as peças e testar offline.
-->

---

## O rastro real de uma edição

| Papel | Chamadas | Tokens saída | p50 | p95 |
|---|---|---|---|---|
| classificar | 8 | 260 | 15 s | 24 s |
| redigir | 6 | 295 | 10 s | 61 s |
| **revisar** | 6 | **3.747** | **72 s** | **173 s** |
| total | 20 | 4.302 | 17 s | 149 s |

O **revisor** gerou **87%** dos tokens de saída. Com saída em JSON schema, o Ollama contou **758 tokens** para uma resposta de 326 caracteres (sem schema: 152).

<p class="fonte">qwen3:4b-instruct · 8 notícias · wrangler dev · preparo da aula</p>

<!--
11–15 min. Custo se mede, não se estima. Sem o rastro, ninguém olharia para o revisor. Não investiguei a causa dos tokens a mais com schema: diga isso. Pergunte: o que vocês fariam com o revisor?
-->

---

## Custo e latência: como ler

<div class="cols">
<div class="card">

### Custo
tokens × preço por milhão

- **Estimar** (caracteres ÷ 4) é para **teto**
- **Medir** (`usage` do provedor) é para **fatura**
- Modelo local: preço zero; o custo é **tempo e máquina**

</div>
<div class="card">

### Latência
- **p50:** a experiência típica
- **p95:** os casos ruins, que estouram o limite
- **Soma ≠ duração:** 829 s somados numa execução de 245 s (chamadas em paralelo, fila no modelo local)

</div>
</div>

<!--
15–18 min. p95 = 95% das chamadas foram mais rápidas que isso. Com paralelismo, a fila do Ollama local infla o p95. Somar latências e chamar de duração é um erro comum.
-->

---

<!-- _class: secao -->

# 3 · Versão do prompt e rollback

<span class="demo">m08:avaliar</span> · <span class="demo">m08:operar promover</span>

---

## O prompt é código que muda o comportamento

1. **Versão imutável com hash:** mudou o texto, é outra versão
2. **Portão antes de ativar**, em duas camadas:
   - **absoluto** (CI): macro-F1 ≥ 0,8 e nenhum caso especial publicado
   - **relativo** (Worker): não pode ser **pior que a versão no ar**, com o mesmo modelo
3. **Cada execução registra** qual versão rodou
4. **Rollback sem deploy:** a versão ativa é um ponteiro no KV

O **modelo** faz parte da versão: trocar o modelo muda tudo.

<!--
18–21 min. O hash amarra a avaliação ao texto: não dá para avaliar um texto e promover outro. O portão relativo só existe no Worker porque só ele sabe qual versão está no ar.
-->

---

## O portão pegou uma regressão de verdade

| Versão | Mudança | macro-F1 | CI (≥ 0,8) | Worker (vs. ativa) |
|---|---|---|---|---|
| **v1** | a skill da Aula 4 | **0,967** | passa | **ativada** |
| v2 | "considere relevante tudo que mencione IA" | 0,852 | **passa** | **barrada**: pior que 0,967 |
| v1.1 | uma palavra a mais | 0,967 | passa | ativada → **revertida** para v1 |

Avaliar uma versão: **~1,5 min** (40 notícias rotuladas).

<p class="fonte">qwen3:4b-instruct · m08:avaliar · preparo da aula</p>

<!--
21–24 min. Mostre m08:operar promover v2 devolvendo 422 com o motivo, e depois reverter. A v2 é realista: alguém quer mais itens por semana e afrouxa o critério.
-->

---

## O que o rollback não desfaz

<div class="cols">
<div>

**Volta:**
- o prompt (ponteiro no KV)
- o código (`wrangler rollback`, últimas 100 versões)

**Não volta:**
- dados gravados (KV, D1, filas)
- a edição já publicada
- o e-mail já enviado

</div>
<div class="card">

### Implantação gradual
`wrangler versions deploy` com porcentagem: **10%** na nova, 90% na antiga

No prompt, o mesmo: **canário** (desafio do exercício)

</div>
</div>

<p class="fonte">developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks</p>

<!--
24–26 min. Por isso a pausa da edição (Aula 7) continua importante: é o que segura o que não volta.
-->

---

<!-- _class: secao -->

# 4 · Evals em CI

---

## Duas velocidades

| | Testes offline | Eval com modelo |
|---|---|---|
| **Quando** | todo push e PR | prompt, eval ou dataset mudaram |
| **Modelo** | simulado | o de verdade (Ollama no runner) |
| **Tempo** | segundos | minutos |
| **Pega** | código quebrado, contrato | regressão de qualidade |

`.github/workflows/ci.yml` · `.github/workflows/eval-prompt.yml`

Reprovou no portão → **PR vermelho**.

<!--
26–33 min. Mostrar os dois arquivos no GitHub e uma execução. Por que não rodar a eval com modelo em todo push: é lenta, custa, e um sinal lento e ruidoso vira um sinal que o time ignora.
-->

---

<!-- _class: secao -->

# 5 · Demo: o cron no Worker

<span class="demo">m08:dev</span> · <span class="demo">m08:operar</span>

---

## O curador como Worker

```text
Cron (seg 9h) ─► scheduled() ─► grafo da Aula 7 (checkpoint no KV) ─► pausa ─► registra execução + rastro
HTTP (editor)  ─► GET /pendentes · POST /retomar ─► Command({ resume }) ─► publica no KV
```

<div class="cols">
<div class="card">

### Antes da aula
`m08:operar rodar` → ~4 min, 20 chamadas, **1 pausa** (`n39`, sem fonte)

</div>
<div class="card">

### Na aula
Rejeitar `n39`, aprovar a edição → **publicada** · 0 chamadas ao modelo

Disparar o cron de novo → **pulada** (já rodou hoje)

</div>
</div>

<!--
33–40 min. O grafo é o mesmo da Aula 7; a "tela" virou HTTP. Rotas que mudam algo pedem token. Mostre a idempotência disparando o cron outra vez.
-->

---

## Um job que aguenta produção (o exercício)

| Situação | O job faz |
|---|---|
| O cron disparou **duas vezes** | idempotência: o dia já deu "ok" → não faz nada |
| **429 / 503** | tenta de novo: espera 1 s, 2 s, 4 s |
| Resposta **fora do schema** | não insiste: tentar de novo não melhora |
| Entrada **enorme** | teto de custo estimado: nem chama |

**Retry numa camada só:** se cada camada tenta de novo por conta própria, a carga se multiplica.

<p class="fonte">Amazon Builders' Library, Timeouts, retries, and backoff with jitter</p>

<!--
Se sobrar tempo, rode demo:falhas:solucao (instantânea). O AI SDK já tenta 2 vezes sozinho; com o seu retry por cima, seriam até 9 chamadas. No exemplo do artigo, com cada camada tentando de novo por conta própria, a carga no banco cresce 243 vezes.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos · e uma retrospectiva

---

## Para conversar

1. Que job com IA do seu trabalho rodaria **agendado**? E se rodasse **duas vezes**?
2. Quem decide **promover** uma versão de prompt: o CI, uma pessoa, os dois?
3. O revisor custa **87%** dos tokens de saída. Tirar, trocar por modelo menor ou por regras? Como saber se a qualidade caiu?
4. O que no seu sistema **não volta** com rollback?
5. **Retrospectiva:** das oito aulas, o que você usaria **amanhã**? O que ficou faltando?

<!--
40–55 min. Respostas esperadas no guia do mentor. Reserve pelo menos 5 minutos para a retrospectiva.
-->

---

## Para fechar

<div class="cols">
<div class="card">

### Exercício
Job diário que aguenta produção

```bash
pnpm -F @mentoria/ex08-operacao test
```
Desafio: canário

</div>
<div class="card">

### Projeto final · M8
O curador no Worker + versões do prompt

```bash
pnpm -F @mentoria/curador m08:dev
```
Leitura extra: monitoramento em produção

</div>
</div>

---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **fim da trilha**

# Do token ao **sistema em produção**

LLMs, decisões tipadas, evals, skills e agentes, MCP, grafos, humanos no circuito e operação.

<!--
Encerramento. Agradeça. Lembre que todo o material fica no repositório, incluindo as soluções e as leituras extras.
-->
