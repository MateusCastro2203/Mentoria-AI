# Módulo 06 — Conceitos (leitura de apoio)

No Módulo 5, o time do curador era um **pipeline em código**: uma função `montarEdicao` chamando os papéis em ordem, com um laço para o redator ⇄ revisor. Funciona, mas tem três limites:

1. **Se o processo cair no meio, perde tudo.** O time levou ~14 minutos; uma falha no último passo obrigava a reclassificar as 32 notícias.
2. **O caminho é fixo.** Todo item passava pelo mesmo trajeto, com uma confiança alta ou baixa.
3. **É difícil ver o fluxo.** Para saber o que o código faz, é preciso ler o código.

Este módulo transforma o pipeline em um **grafo de estado** com o LangGraph.js: o fluxo vira dado (dá para desenhar), cada passo salva um checkpoint (dá para retomar) e os caminhos podem depender do estado (aresta condicional).

---

## 1. As quatro peças de um grafo

| Peça | O que é | No curador |
|---|---|---|
| **Estado** | um objeto compartilhado, com campos tipados (os "canais") | `candidatos`, `avaliados`, `itens`, `paraRevisao`, `arquivo`… |
| **Nó** | uma função que recebe o estado e devolve **só o que mudou** | `coletar`, `classificar`, `redigir`, `publicar` |
| **Aresta** | "depois deste nó, vá para aquele" | `redigir → publicar` |
| **Aresta condicional** | uma função que olha o estado e escolhe o próximo nó | `selecionar → redigir` ou `→ fila_humana`, conforme a confiança |

**Analogia:** um fluxograma de processo, só que executável. As caixas são os nós, as setas são as arestas, os losangos ("a confiança é ≥ 0,9?") são as arestas condicionais, e o estado é a pasta que passa de mesa em mesa com os papéis do caso.

### Reducers: como juntar atualizações

Quando um nó devolve `{ avaliados: [x] }`, o que acontece com o que já estava em `avaliados`? Depende do campo:

- **sem reducer:** o valor novo **substitui** o antigo (é o caso de `arquivo`);
- **com reducer:** o LangGraph **combina** o antigo com o novo. No projeto, o reducer de listas concatena.

Isso importa quando vários nós rodam **em paralelo** e escrevem no mesmo campo: sem reducer, um apagaria o resultado do outro. No curador, as 32 classificações rodam como 32 execuções do nó `classificar` (uma por notícia, disparadas com `Send`), e todas escrevem em `avaliados`.

No LangGraph.js 1.x, o estado é declarado com `StateSchema` e campos Zod; um campo com reducer usa `ReducedValue`. (Versões e exemplos antigos usam `Annotation.Root`, que continua funcionando.)

### Fan-out com `Send`

Uma aresta condicional pode devolver uma **lista de `Send`**: cada `Send("classificar", { id })` agenda uma execução do nó com uma entrada própria. É o padrão "um para muitos" (*map*): uma tarefa por item, em paralelo, juntando no estado pelo reducer.

### Duas armadilhas que encontramos

- **Aresta condicional logo depois de um fan-out roda uma vez por ramo.** Se cada `classificar` tivesse uma aresta condicional para "redigir ou não", ela rodaria 32 vezes, e os itens se repetiriam. A solução é um **nó de junção** (`selecionar`) ligado por aresta normal: o LangGraph espera todos os ramos terminarem e roda o nó uma vez, com o estado completo.
- **O nome de um nó não pode ser igual ao de um campo do estado.** O LangGraph recusa com um erro do tipo "*X is already being used as a state attribute*". Por isso, no exercício, o campo é `atendidoPor` e os nós são `financeiro`, `suporte`…

---

## 2. Checkpoint: salvar a cada passo

Um **checkpointer** grava um retrato do estado (um *checkpoint*) depois de cada passo do grafo. Cada execução pertence a uma **thread**, identificada por `thread_id` na configuração:

```ts
const grafo = construtor.compile({ checkpointer: new MemorySaver() });
await grafo.invoke(entrada, { configurable: { thread_id: "edicao-da-semana" } });
```

Com isso, ganhamos:

| Recurso | Como usar | Para que serve |
|---|---|---|
| **Retomar depois de uma falha** | `invoke(null, config)` na mesma thread | continua do último passo salvo, sem refazer o que já terminou |
| **Memória entre chamadas** | chamar de novo com o mesmo `thread_id` | o estado da thread continua lá (uma conversa, um cliente) |
| **Inspecionar** | `getState(config)`, `getStateHistory(config)` | ver o estado atual, o próximo nó (`next`) e cada passo anterior |
| **Viagem no tempo** | `updateState(checkpointAntigo, valores, comoNo)` + `invoke(null, novoConfig)` | corrigir um valor no passado e seguir dali, criando um **ramo** novo, sem apagar o original |
| **Pausar para um humano** | `interrupt()` + `Command({ resume })` | o Módulo 7 |

**Analogia:** o "salvar jogo" de um videogame. Cada fase concluída grava o progresso; se a energia cair, você volta da última fase salva, não do começo. E dá para carregar um save antigo e jogar diferente, sem perder o original.

### Onde o checkpoint fica

- `MemorySaver`: na memória do processo. Ótimo para testes; some quando o processo termina.
- O projeto traz `CheckpointEmArquivo` (um `MemorySaver` que grava um JSON), só para mostrar que um checkpoint é **dado**: dá para abrir o arquivo, matar o processo e retomar em outro.
- Em produção: um checkpointer de banco. Há pacotes oficiais para SQLite, Postgres e outros. No Módulo 8, discutimos o que usar num ambiente sem disco, como o Cloudflare Workers.

### Execução durável: o que ela promete e o que não promete

Retomar de um checkpoint **reexecuta o nó que estava rodando** quando a falha aconteceu. Então:

- o que o nó fez **por fora** antes de falhar (enviar um e-mail, gravar um arquivo, cobrar um cartão) pode acontecer **duas vezes**;
- por isso, nós com efeito externo devem ser **idempotentes** (rodar duas vezes dá o mesmo resultado) ou separados em nós pequenos.

No curador, `publicar` falhou antes de gravar; na retomada, só ele rodou de novo.

---

## 3. O curador como grafo

```text
START → coletar ─(Send × N)─► classificar ──► selecionar ─┬─(Send)─► redigir ⇄ revisor ─┐
           │                                               ├─(Send)─► fila_humana ──────┤
           └─ nenhum candidato ─► END                       └─ nada a fazer ─────────────┴─► publicar → END
```

- `coletar` → o agente da M5 (pelo MCP de fontes);
- `classificar` → um por notícia, em paralelo (`Send`);
- `selecionar` → nó de junção: aplica a regra editorial (limiar de confiança, até 10 itens, **no máximo 3 por categoria**: é a resposta ao viés da M5, em que a edição saiu sem regulação e sem mercado);
- `redigir` → um por item publicável; dentro dele, o ciclo redator ⇄ revisor;
- `fila_humana` → itens com confiança baixa ou que o guardrail mandou revisar. Por enquanto só registra; **no Módulo 7, vira uma pausa de verdade** com aprovação humana;
- `publicar` → chama o servidor MCP de edição.

---

## 4. Alternativas ao LangGraph

LangGraph não é a única forma de orquestrar agentes. Uma comparação curta, para escolher com critério:

| Opção | O que é | Pontos fortes | Quando escolher |
|---|---|---|---|
| **Código puro** (a M5) | funções, laços e `if` | zero dependência, fácil de testar, qualquer pessoa lê | fluxos curtos, sem necessidade de retomar ou pausar |
| **Vercel AI SDK** (o que usamos nas chamadas) | biblioteca para chamar modelos, com ferramentas, saída tipada e loop de agente | leve, vários provedores, ótimo para **um** agente | o agente é o produto; a orquestração é simples |
| **LangGraph.js** | grafo de estado com checkpoint | retomada, memória por thread, viagem no tempo, pausa humana, fluxo desenhável | fluxos longos, com ramos, falhas e humanos no meio |
| **Mastra** | framework TypeScript de agentes e *workflows* (`.then`, `.branch`, `.parallel`), com suspender e retomar | API encadeada mais "TypeScript", inclui memória, RAG e evals; licença Apache-2.0 (exceto os módulos enterprise) | quer um framework completo em TS, com workflows declarativos |
| **OpenAI Agents SDK** (JS) | agentes com *handoffs*, *guardrails*, aprovação humana, sessões e tracing | o padrão handoff é nativo; funciona com outros provedores além da OpenAI | atendimento com transferência entre especialistas |
| **Claude Agent SDK** | o mesmo "motor" do Claude Code como biblioteca (TS/Python): ferramentas prontas de arquivo e terminal, *hooks*, subagentes, MCP, permissões | agente que trabalha num ambiente de arquivos e comandos, com controles de permissão | automações parecidas com um agente de código; usa os modelos Claude |

Critérios para decidir:

1. **Precisa retomar, pausar ou voltar no tempo?** Sim → algo com checkpoint (LangGraph, Mastra). Não → código puro ou AI SDK.
2. **O fluxo é fixo ou o modelo decide os passos?** Fixo → workflow (grafo, Mastra, código). O modelo decide → um agente (AI SDK, OpenAI Agents SDK, Claude Agent SDK).
3. **Quanto a equipe aguenta de abstração?** Cada framework tem conceitos próprios para aprender e versões que mudam rápido.
4. **Prenda-se pouco:** mantenha os papéis (classificar, redigir…) como funções simples, e o framework só **liga** essas funções. Foi o que fizemos: o grafo da M6 reaproveita os papéis da M5 sem mudar uma linha deles.

---

## Referências

- LangGraph.js — visão geral: https://docs.langchain.com/oss/javascript/langgraph/overview
- LangGraph.js — Graph API (estado, nós, arestas, `Send`): https://docs.langchain.com/oss/javascript/langgraph/graph-api
- LangGraph.js — persistência (checkpointers, threads, `getState`, `updateState`): https://docs.langchain.com/oss/javascript/langgraph/persistence
- LangGraph.js — execução durável: https://docs.langchain.com/oss/javascript/langgraph/durable-execution
- LangGraph.js — viagem no tempo: https://docs.langchain.com/oss/javascript/langgraph/use-time-travel
- Mastra — workflows: https://mastra.ai/docs/workflows/overview
- OpenAI Agents SDK (JS): https://openai.github.io/openai-agents-js/
- Claude Agent SDK: https://code.claude.com/docs/en/agent-sdk/overview
- Vercel AI SDK — agentes: https://ai-sdk.dev/docs/agents/overview
- Mermaid Live (para ver o desenho do grafo): https://mermaid.live
