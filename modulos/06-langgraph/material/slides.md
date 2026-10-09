---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 06 — Orquestração com LangGraph.js
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 6 de 8**

# Orquestração com LangGraph.js

O fluxo vira um grafo: estado, caminhos por confiança e "salvar jogo"

<!--
Abertura (30 s). Na aula passada, o time era um pipeline em código. Hoje ele vira um grafo: dá para desenhar, escolher caminhos pelo estado e retomar se cair.
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- modelar um fluxo com **estado, nós e arestas**
- usar **arestas condicionais** e **reducers**
- explicar **checkpoint, thread** e retomada
- dizer o que a **viagem no tempo** resolve
- escolher entre **LangGraph** e as alternativas

</div>
<div class="card">

### Roteiro (40 min)

1. As peças de um grafo
2. Demo: o curador como grafo
3. Checkpoint e retomada
4. Alternativas

Depois: 15 min de discussão

</div>
</div>

---

<!-- _class: frase -->

Um workflow vira grafo quando você precisa **retomar, desviar ou pausar**.

*Se o fluxo é curto e reto, uma função com `if` basta.*

<!--
Frase da aula. Escreva no chat. A segunda linha importa tanto quanto a primeira: LangGraph é ferramenta para um problema específico.
-->

---

## O que faltava no time da Aula 5

| Problema | No pipeline em código | No grafo |
|---|---|---|
| Caiu no último passo | refaz tudo (~14 min) | **retoma** do checkpoint |
| Confiança baixa | segue o mesmo caminho | **desvia** para a fila humana |
| Edição sem regulação nem mercado | "top 10 por confiança" | **cota** por categoria no nó de seleção |
| Entender o fluxo | ler o código | **desenhar** o grafo |

<!--
0–3 min. Retomar a Aula 5: o relatório mostrou 14 min de execução e um viés editorial. Cada linha desta tabela é uma coisa que vamos ver hoje.
-->

---

<!-- _class: secao -->

# 1 · As peças de um grafo

---

## Estado, nós e arestas

<div class="cols-3">
<div class="card">

### Estado
A **pasta** que passa de mesa em mesa: campos tipados (Zod)

</div>
<div class="card">

### Nó
Uma **função**: recebe o estado e devolve **só o que mudou**

</div>
<div class="card">

### Aresta
**Depois deste, vá para aquele.** A condicional escolhe pelo estado

</div>
</div>

```ts
new StateGraph(EstadoTriagem)
  .addNode("classificar", async (e) => await classificar(e.chamado))
  .addNode("financeiro", atender("financeiro"))  // … suporte, faq, humano
  .addEdge(START, "classificar")
  .addConditionalEdges("classificar", rotaDeTriagem, ["financeiro", "suporte", "faq", "humano"])
```

<!--
3–8 min. Analogia: fluxograma de processo, só que executável. Caixas = nós, setas = arestas, losangos = arestas condicionais. A função da aresta condicional é pura: dá para testar sem montar o grafo (é o exercício).
-->

---

## Reducers: como juntar atualizações

<div class="cols">
<div>

Um nó devolve `{ avaliados: [x] }`. E o que já estava lá?

- **Sem reducer:** o novo **substitui**
- **Com reducer:** o LangGraph **combina** (aqui, concatena)

Essencial quando nós **em paralelo** escrevem no mesmo campo.

</div>
<div class="card">

### Fan-out com `Send`
```ts
candidatos.map(
  (id) => new Send("classificar", { id })
)
```
Uma execução do nó por item, em paralelo. Todas escrevem em `avaliados`.

</div>
</div>

<!--
8–12 min. Sem reducer, 32 classificações em paralelo: só a última sobreviveria. Analogia: várias pessoas preenchendo a mesma planilha; com reducer, cada uma acrescenta uma linha; sem, cada uma apaga a planilha e escreve a sua.
-->

---

## Duas armadilhas que pegamos

<div class="cols">
<div class="card">

### Condicional logo após fan-out
Roda **uma vez por ramo**: 32 ramos, 32 decisões, itens repetidos.

**Solução:** um **nó de junção** (`selecionar`) com aresta normal. Ele roda uma vez, com tudo pronto.

</div>
<div class="card">

### Nó com nome de campo
`"atendidoPor" is already being used as a state attribute`

**Solução:** nomes diferentes para nós e campos.

</div>
</div>

<!--
12–15 min. As duas aconteceram na preparação deste módulo. A primeira é silenciosa (não dá erro, só duplica), por isso o teste conta quantas vezes "selecionar" aparece na trajetória.
-->

---

<!-- _class: secao -->

# 2 · O curador como grafo

<span class="demo">demo:grafo</span>

---

## O grafo do curador

```text
START → coletar ─(Send × N)─► classificar ──► selecionar ─┬─(Send)─► redigir ⇄ revisor ─┐
           └─ sem candidatos ─► END                        ├─(Send)─► fila_humana ──────┼─► publicar → END
                                                           └─ nada a fazer ─────────────┘
```

- **classificar:** um por notícia, em paralelo
- **selecionar:** confiança ≥ 0,9, até 10 itens, **no máximo 3 por categoria**
- **fila_humana:** confiança baixa ou guardrail. Na Aula 7, vira uma **pausa** de verdade
- Os papéis da Aula 5 entram **sem mudar uma linha**

<!--
15–20 min. Rodar demo:grafo (offline, instantâneo) para mostrar o desenho em mermaid e a triagem; depois mostrar saidas/m06-grafo.mmd do curador em mermaid.live. Ponto: o framework só LIGA as funções; os papéis continuam funções simples.
-->

---

## Resultado do grafo

| Etapa | Chamadas | Resultado |
|---|---|---|
| coletar | 1 agente | 32 candidatos |
| classificar (paralelo) | 32 | 32 de 32 iguais ao gabarito |
| selecionar | 0 (código) | 10 escolhidos · 4 para a fila humana · 15 fora pela cota/limite |
| redigir ⇄ revisor | 16 + 16 | 9 aprovados · n10 reprovada 2× |

- **Regulação voltou** (3 itens) graças à cota. **Mercado continua fora:** o modelo dá **0,95** a todo item de mercado e **0,98** aos outros

<p class="fonte">qwen3:4b-instruct · m06:grafo:solucao · 663 s (~11 min)</p>

<!--
20–25 min. Mostrar saidas/m06-relatorio.md e a edição. Ponto alto: a cota resolveu um viés (regulação), mas revelou outro — não é empate, é a confiança: o modelo é sistematicamente menos confiante em mercado, e ordenar por confiança pune sempre a mesma categoria. Pergunte: como garantir diversidade? (Alternar categorias; comparar a confiança dentro da categoria.) A fila humana pegou n38 (injeção), n40 (URL interna), n13 e n17: os mesmos casos difíceis das Aulas 3 e 4.
-->

---

<!-- _class: secao -->

# 3 · Checkpoint e retomada

<span class="demo">demo:checkpoint</span>

---

## "Salvar jogo" a cada passo

<div class="cols">
<div>

```ts
.compile({ checkpointer })
await grafo.invoke(entrada,
  { configurable: { thread_id: "edicao-da-semana" } })
```

- **Thread:** uma execução (uma conversa, uma edição)
- **Retomar:** `invoke(null, config)`
- **Memória:** mesmo `thread_id`, chamada seguinte
- **Inspecionar:** `getState`, `getStateHistory`

</div>
<div class="card">

### Onde guardar
`MemorySaver`: testes

Arquivo JSON: para ver que é **só dado**

Banco (SQLite, Postgres): produção

</div>
</div>

<!--
25–30 min. Rodar demo:checkpoint: o processo morre em "processar", o arquivo JSON fica, outro processo (outro pid) retoma só de "processar". Analogia do videogame: cada fase salva; caiu a energia, volta da última fase.
-->

---

## A retomada no curador

<div class="cols">
<div class="card">

### 1ª execução · `--falhar`
coletar **1** · classificar **32** · redigir **16** · revisar **16**

663 s · parou em `publicar`

</div>
<div class="card">

### 2ª execução · retomada
coletar **0** · classificar **0** · redigir **0** · revisar **0**

**1 s** · só `publicar` rodou

</div>
</div>

<p class="fonte">Cuidado: retomar <strong>reexecuta o nó que falhou</strong>. Efeitos externos (e-mail, cobrança, arquivo) precisam ser idempotentes.</p>

<!--
25–30 min. Mesma thread (edicao-da-semana), outro processo. O checkpoint tinha next = publicar; invoke(null, config) rodou só esse nó. Sem checkpoint, seriam mais 11 minutos.
-->

---

## Viagem no tempo

<div class="cols">
<div>

O classificador mandou "Não recebi o reembolso" para o **FAQ**. Era **cobrança**.

1. Ache no histórico o checkpoint depois de `classificar`
2. `updateState` grava **cobrança** ali, como se `classificar` tivesse respondido isso
3. `invoke(null, …)` segue do **ramo** novo: só o atendimento roda de novo

</div>
<div class="card">

### O passado fica
O ramo errado **continua** no histórico. Serve para auditar e para criar exemplos de avaliação (Aula 3).

</div>
</div>

<!--
30–32 min. É o desafio do exercício. Mostrar a parte 5 da demo:grafo.
-->

---

<!-- _class: secao -->

# 4 · Alternativas

Quando usar o quê

---

## Não é só LangGraph

| Opção | Em uma frase | Escolha quando |
|---|---|---|
| **Código puro** | funções, laços e `if` | fluxo curto, sem retomar nem pausar |
| **Vercel AI SDK** | chamadas, ferramentas e loop de **um** agente | o agente é o produto |
| **LangGraph.js** | grafo com estado e checkpoint | fluxos longos, com ramos, falhas e humanos |
| **Mastra** | workflows em TS (`.then`, `.branch`, `.parallel`) + suspender/retomar | framework completo, API encadeada |
| **OpenAI Agents SDK** | agentes com handoffs, guardrails e aprovação | atendimento com transferência entre especialistas |
| **Claude Agent SDK** | o motor do Claude Code como biblioteca | agente que trabalha com arquivos e comandos |

<!--
32–38 min. Não é ranking. Critérios no próximo slide. Todos mudam rápido: confira a versão antes de adotar.
-->

---

## Como escolher

1. Precisa **retomar, pausar ou voltar no tempo**? → algo com checkpoint
2. O fluxo é **fixo** ou o **modelo decide** os passos? → workflow ou agente (Aula 4)
3. Quanta **abstração** a equipe aguenta?
4. **Prenda-se pouco:** papéis como funções simples; o framework só **liga**

<p class="fonte">docs.langchain.com/oss/javascript/langgraph · mastra.ai/docs · openai.github.io/openai-agents-js · code.claude.com/docs/en/agent-sdk</p>

<!--
38–40 min. O critério 4 é o que fizemos: o grafo usa os papéis da Aula 5 sem mudança. Trocar de framework amanhã custaria só a cola.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos

---

## Para conversar

1. O curador precisava de um grafo, ou o pipeline da Aula 5 bastava? O que pesou?
2. Que processo do seu trabalho **cai no meio** e hoje recomeça do zero?
3. Onde um processo precisa **lembrar** de interações anteriores? O que seria a thread?
4. A cota de 3 por categoria é uma regra editorial no **código**. Quem deveria decidir essa regra?
5. Para que serve guardar o caminho **errado** no histórico?

<!--
40–55 min. Respostas esperadas no guia do mentor.
-->

---

## Para a próxima aula

<div class="cols">
<div class="card">

### Exercício
Grafo de triagem de chamados

```bash
pnpm -F @mentoria/ex06-langgraph test
```
Desafio: viagem no tempo

</div>
<div class="card">

### Projeto final · M6
O curador como grafo, com checkpoint

```bash
pnpm -F @mentoria/curador m06:grafo
```
Traga o relatório e a fila humana

</div>
</div>

---

<!-- _class: capa -->
<!-- _paginate: false -->

Próxima aula · **Human-in-the-loop**

# E se a fila humana virasse uma **pausa**, e o grafo esperasse alguém aprovar?

`interrupt()`, `Command({ resume })` e o que automatizar 100%.

<!--
Gancho para a Aula 7.
-->
