# Módulo 06 — Orquestração com LangGraph.js

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** Módulo 05 e o relatório da etapa M5 (`projeto-final/saidas/m05-relatorio.md`)
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. modelar um fluxo como grafo de estado: estado, nós, arestas e arestas condicionais;
2. explicar o que um reducer faz e por que ele é necessário quando nós rodam em paralelo (fan-out com `Send`);
3. usar um checkpointer com threads para retomar uma execução depois de uma falha e para dar memória entre chamadas;
4. corrigir uma decisão passada com viagem no tempo (`getStateHistory` + `updateState`), sem apagar o histórico;
5. escolher, com critérios, entre LangGraph e as alternativas (código puro, Vercel AI SDK, Mastra, OpenAI Agents SDK, Claude Agent SDK).

## Mensagem central

> Um workflow vira **grafo** quando você precisa **retomar, desviar ou pausar**. Se o fluxo é curto e reto, uma função com `if` basta. E, seja qual for o framework, mantenha os papéis como funções simples: o framework só **liga** as peças.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–15 | **As peças de um grafo** | O que faltava no time da Aula 5 (retomar, desviar, cota, ver o fluxo). Estado, nós, arestas, arestas condicionais (analogia do fluxograma). Reducers e fan-out com `Send` (analogia da planilha). As duas armadilhas: condicional depois de fan-out e nó com nome de campo. | — |
| 15–30 | **O curador como grafo + checkpoint** | O desenho do grafo (mermaid), a triagem do exercício seguindo caminhos diferentes, o grafo do curador e o resultado da execução real com a cota por categoria. Checkpoint e threads (analogia do "salvar jogo"): um processo morre, outro retoma; a retomada do curador. Viagem no tempo. | `demo:grafo` · `demo:checkpoint` |
| 30–40 | **Alternativas** | Código puro, Vercel AI SDK, LangGraph, Mastra, OpenAI Agents SDK, Claude Agent SDK: o que é cada um e quando escolher. Os critérios. | — |
| 40–55 | **Discussão** | Perguntas abaixo. | — |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M6. | — |

> **Corte declarado:** memória de longo prazo entre threads (*store*), subgrafos, streaming de eventos e checkpointers de banco ficam na leitura de apoio ou fora do curso. Pausa para aprovação humana (`interrupt`) é a Aula 7.

### Comandos das demos

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex06-langgraph demo:grafo                         # offline: desenho, caminhos, memória, viagem no tempo
pnpm -F @mentoria/ex06-langgraph demo:checkpoint                    # offline: um processo morre, outro retoma
pnpm -F @mentoria/curador m06:grafo:solucao -- --nova --falhar      # ANTES da aula: o curador inteiro, caindo no publicar (vários minutos)
pnpm -F @mentoria/curador m06:grafo:solucao                         # ANTES da aula: retoma do checkpoint (segundos)
```

### Notas para o mentor

Rodei com `qwen3:4b-instruct` (Ollama). A execução nova levou **663 s (~11 min)**; rode antes da aula.

| Execução | Coletar | Classificar | Redigir | Revisar | Tempo |
|---|---|---|---|---|---|
| nova, com `--falhar` | 1 | 32 | 16 | 16 | 663 s, parou em `publicar` |
| retomada (outro processo, mesma thread) | 0 | 0 | 0 | 0 | **1 s** |

- **A retomada funcionou como prometido:** o checkpoint tinha `next = ["publicar"]` e só esse nó rodou. Sem checkpoint, a falha no último passo custaria mais ~11 minutos.
- **As 32 classificações bateram com o gabarito.** A fila humana recebeu `n38` (injeção, Aula 3), `n40` (URL interna), `n13` e `n17` (os casos difíceis da Aula 4), todos por guardrail. Nenhum item caiu na fila por confiança baixa: as confianças ficaram entre 0,95 e 0,98, acima do limiar de 0,9.
- **A cota resolveu um viés e revelou outro.** Regulação, ausente na M5, entrou com 3 itens. Mercado continuou fora, e não por empate: o modelo deu **0,95 a todos os itens de mercado** e **0,98 aos das outras categorias**. Ordenar por confiança pune sempre a mesma categoria. Ótimo para a discussão (pergunta 4) e para o desafio da etapa M6.
- **Gerador + revisor:** 16 redações para 10 itens; 9 aprovados. A `n10` foi reprovada duas vezes, pelo mesmo motivo da M5 ("reduz" × "mede menos").
- **Tempo:** 663 s aqui contra 842 s na M5, mas não tire conclusão: o revisor (juiz LLM) domina o tempo e varia bastante entre execuções. Com o modelo local, os nós em paralelo disputam o mesmo modelo; o ganho de paralelismo aparece com um provedor que atende várias chamadas ao mesmo tempo.
- **Armadilha que eu mesmo caí ao preparar:** rodei uma retomada enquanto a primeira execução ainda estava viva, no mesmo arquivo de checkpoint. As duas trabalharam ao mesmo tempo e refizeram redações. Um checkpointer de arquivo não tem trava: em produção, use um banco e **uma execução por thread**.
- `demo:grafo` e `demo:checkpoint` são offline e instantâneas; podem rodar ao vivo.

## Perguntas para discussão (15 min)

1. O curador precisava de um grafo, ou o pipeline da Aula 5 bastava? O que pesou na decisão?
2. Que processo do seu trabalho cai no meio e hoje recomeça do zero? Onde ficaria o checkpoint?
3. Onde um processo precisa lembrar de interações anteriores com a mesma pessoa? O que seria a thread?
4. A cota de 3 por categoria é uma regra editorial escrita no código. Quem deveria decidir essa regra, e como ela deveria mudar?
5. Para que serve guardar no histórico o caminho que estava errado?

## Armadilhas comuns

- **Usar um framework de grafo para um fluxo curto e reto.** Mais conceitos, mais dependências, nenhum ganho.
- **Campo de lista sem reducer** com nós em paralelo: cada nó apaga o que o outro escreveu.
- **Aresta condicional logo depois de um fan-out:** roda uma vez por ramo e duplica o trabalho, sem dar erro. Use um nó de junção.
- **Nó com o mesmo nome de um campo do estado:** o LangGraph recusa.
- **Nó devolvendo o estado inteiro** em vez de só o que mudou: com reducers, duplica as listas.
- **Esquecer o `thread_id`** (ou gerar um novo a cada chamada): sem ele, não há retomada nem memória.
- **Efeito externo não idempotente num nó:** retomar reexecuta o nó que falhou, e o e-mail sai duas vezes.
- **`MemorySaver` em produção:** some quando o processo termina. Use um checkpointer de banco.
- **Deixar o LLM escolher o próximo nó** quando uma regra no código resolve: a rota fica imprevisível e difícil de testar.

## Exercício (assíncrono, até a próxima aula)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** um grafo de triagem de chamados (financeiro, suporte, perguntas frequentes ou uma pessoa), com a aresta condicional como função pura e memória por thread. Feito = `pnpm -F @mentoria/ex06-langgraph test` verde.
- **Desafio extra:** viagem no tempo, corrigindo a categoria de um chamado sem chamar o classificador de novo. Feito = `pnpm -F @mentoria/ex06-langgraph test:desafio` verde.

## Projeto final — etapa M6

Em [`projeto-final/`](../../projeto-final/README.md): o time da M5 como grafo, com classificações em paralelo, seleção com cota por categoria, rota por confiança para a fila humana e checkpoint em arquivo.

- Feito = `pnpm -F @mentoria/curador exec vitest run test/m06.test.ts` verde **e** `pnpm -F @mentoria/curador m06:grafo -- --nova --falhar` seguido de `m06:grafo` retomando e publicando `saidas/edicao.md`.
- Traga para a Aula 7: o relatório e a lista da fila humana. Na próxima aula, a fila vira uma pausa de verdade, com aprovação humana.

## Referências

- LangGraph.js — visão geral: https://docs.langchain.com/oss/javascript/langgraph/overview
- LangGraph.js — Graph API: https://docs.langchain.com/oss/javascript/langgraph/graph-api
- LangGraph.js — persistência: https://docs.langchain.com/oss/javascript/langgraph/persistence
- LangGraph.js — execução durável: https://docs.langchain.com/oss/javascript/langgraph/durable-execution
- LangGraph.js — viagem no tempo: https://docs.langchain.com/oss/javascript/langgraph/use-time-travel
- Mastra — workflows: https://mastra.ai/docs/workflows/overview
- OpenAI Agents SDK (JS): https://openai.github.io/openai-agents-js/
- Claude Agent SDK: https://code.claude.com/docs/en/agent-sdk/overview
- Vercel AI SDK — agentes: https://ai-sdk.dev/docs/agents/overview
