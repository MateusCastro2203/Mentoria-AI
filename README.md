# Mentoria de IA aplicada

Trilha prática de 8 encontros que vai da base técnica de LLMs até sistemas multiagênticos em produção. Ao longo da trilha, cada pessoa constrói o mesmo **projeto final**, um curador automático de newsletter sobre IA, que ganha uma camada nova a cada módulo.

## Para quem é

Devs com ou sem experiência em IA. Todo exercício tem dois níveis:

- **Base:** para quem nunca usou IA no código.
- **Desafio extra:** para quem já tem experiência.

## Formato

- 8 aulas de 1h, uma por semana: ~40 min de conceito + demo, ~15 min de discussão, 5 min de folga.
- O exercício é **tarefa assíncrona** entre as aulas.
- O critério de "feito" é verificável por máquina: testes (Vitest) ou evals (promptfoo) que você roda e vê passar.

## Pré-requisitos

- TypeScript básico e terminal.
- Notebook com ~8 GB de RAM livres para rodar um modelo local (Ollama) **ou** acesso a um provedor remoto compatível com a API da OpenAI.
- Ambiente pronto: siga o [Módulo 00 — Setup](modulos/00-setup/README.md) **antes da Aula 1**.

## Cronograma

| Semana | Módulo | Projeto final evolui para… |
|---|---|---|
| antes | [00 — Setup](modulos/00-setup/README.md) | ambiente rodando (`pnpm verificar`) |
| 1 | 01 — Como LLMs funcionam | prompt que classifica notícias em texto livre |
| 2 | 02 — Além do chat: System One e Jev | decisão tipada (Zod) com confiança |
| 3 | 03 — Prompt, Evals e Guardrails | dataset rotulado, evals e guardrails de schema e fonte |
| 4 | 04 — Skills vs. Agentes | skill reutilizável e agente que busca fontes |
| 5 | 05 — Multiagente e MCP | coletor, classificador, redator e revisor com MCP local |
| 6 | 06 — Orquestração com LangGraph.js | grafo com estado, checkpoint e arestas por confiança |
| 7 | 07 — HITL e automação | editor humano aprova, edita ou rejeita a edição |
| 8 | 08 — Deploy e operação | execução agendada com tracing, custo, evals em CI e rollback |

A especificação completa está em [`ESPECIFICACAO.md`](ESPECIFICACAO.md).

## Como o repositório funciona

```
packages/llm/      → @mentoria/llm: única porta para modelos (troca de provedor só pelo .env)
modulos/NN-nome/   → README.md (roteiro da aula), conceitos.md (leitura de apoio), exercicio/
projeto-final/     → o curador de newsletter, evoluindo módulo a módulo
dados/             → dados sintéticos usados nos exercícios
referencias.md     → bibliografia consolidada
```

- Workspace pnpm: cada exercício e o projeto final são pacotes.
- No branch `main`, os testes dos exercícios **falham** até você resolver. As soluções de referência ficam no branch `solucoes`; consulte só depois de tentar.

## Comandos

```bash
pnpm install                       # instala tudo
pnpm verificar                     # confere Node, pnpm e provedor de modelo
pnpm test                          # todos os testes (offline, sem chamar modelo)
pnpm typecheck                     # checagem de tipos
pnpm --filter <pacote> test        # testes de um pacote (ex.: @mentoria/llm)
```
