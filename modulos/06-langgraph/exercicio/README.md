# Exercício 06 — Um grafo de triagem com LangGraph.js

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo rodando.

Uma central de atendimento recebe chamados e precisa mandar cada um para o lugar certo: financeiro, suporte técnico, perguntas frequentes ou uma pessoa. Você vai montar isso como um **grafo de estado**:

```text
START → classificar ─┬─► financeiro ─┐
                     ├─► suporte ────┤
                     ├─► faq ────────┼─► END
                     └─► humano ─────┘
```

O classificador é uma função injetada (nos testes, uma de mentira que decide por palavra-chave; na vida real, um LLM com saída tipada, como no Módulo 2). O que importa aqui é a **orquestração**: estado, nós, arestas condicionais e checkpoint.

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex06-langgraph test            # versão base
pnpm -F @mentoria/ex06-langgraph test:desafio    # desafio extra
pnpm -F @mentoria/ex06-langgraph demo:grafo      # vê o grafo, os caminhos, a memória e a viagem no tempo
pnpm -F @mentoria/ex06-langgraph demo:checkpoint # um processo morre no meio; outro retoma
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex06-langgraph test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | O que fazer |
|---|---|
| `src/rotas.ts` | `rotaDeTriagem`: a função da aresta condicional (categoria + confiança → nó) |
| `src/triagem.ts` | `montarTriagem`: o grafo com `StateGraph`, os nós, as arestas e o checkpointer |

Fornecidos em `src/estado.ts`: o estado (`EstadoTriagem`, com o `historico` acumulando por reducer), as categorias, os nós de atendimento e as respostas prontas.

**Dicas:**
- Um nó é uma função que recebe o estado e devolve **só o que mudou** (`{ categoria, confianca }`), não o estado inteiro.
- `addConditionalEdges("classificar", funcao, [destinos])`: a função devolve o nome do próximo nó. Passe a lista de destinos para o desenho do grafo sair certo.
- O nome de um nó **não pode** ser igual ao de um campo do estado (o LangGraph recusa). Por isso o campo é `atendidoPor` e os nós são `financeiro`, `suporte`…
- Sem `checkpointer` o grafo funciona, mas esquece tudo entre uma chamada e outra. Com ele, cada `thread_id` é uma conversa com memória.

**Feito =** `pnpm -F @mentoria/ex06-langgraph test` com todos os testes passando.

## Desafio extra — viagem no tempo

O classificador mandou "Não recebi o reembolso" para o FAQ. Era cobrança. Em `src/desafio/viagem.ts`, implemente `corrigirCategoria`: ache no histórico de checkpoints o ponto logo depois da classificação, grave a categoria certa com `updateState` (criando um **ramo** novo) e continue dali com `invoke(null, config)`. Sem chamar o classificador de novo, e sem apagar o passado: o atendimento errado continua no histórico.

**Feito =** `pnpm -F @mentoria/ex06-langgraph test:desafio` com todos os testes passando.

## Perguntas para pensar

1. O que mudaria se `historico` fosse um campo simples, sem reducer? Teste e veja o que acontece com a memória da thread.
2. `rotaDeTriagem` é uma função pura. Que vantagem isso dá em relação a deixar o LLM escolher o próximo nó?
3. Onde, no seu trabalho, um processo precisa "lembrar" de interações anteriores com a mesma pessoa? O que seria o `thread_id`?
4. Viagem no tempo cria um ramo e mantém o passado. Para que serve guardar o caminho errado?
