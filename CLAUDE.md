# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Mentoria de IA aplicada — regras do projeto

Este repositório contém uma mentoria sobre IA aplicada criada por um AI Engineer. A trilha vai da base técnica de LLMs até sistemas multiagênticos em produção.

**Antes de gerar ou alterar qualquer módulo, leia [`ESPECIFICACAO.md`](ESPECIFICACAO.md).** Ela define a trilha, o conteúdo de cada módulo e a evolução do projeto final.

## Público e formato

- Devs com e sem experiência em IA.
- 8 aulas de 1h, uma por semana.
- Material em português brasileiro; termos técnicos em inglês quando forem o jargão do mercado.

## Todo módulo precisa ter

1. Objetivos de aprendizagem verificáveis ("ao final, a pessoa consegue…")
2. Conceitos-chave explicados com analogias e exemplos concretos
3. Demo ou exercício hands-on executável, com critério claro de "feito"
4. Armadilhas comuns e perguntas para discussão
5. Referências primárias (docs oficiais, papers, posts dos autores), sempre com URL

## Estrutura do repositório

```
/README.md              → visão geral, público, pré-requisitos, cronograma
/ESPECIFICACAO.md       → especificação da trilha (não alterar sem pedir)
/referencias.md         → bibliografia consolidada
/packages/llm/          → @mentoria/llm: camada de provedor (única porta para modelos)
/scripts/verificar.ts   → verificação do ambiente (`pnpm verificar`)
/dados/                 → dados sintéticos compartilhados
/modulos/00-setup/      → pré-requisitos e configuração do ambiente
/modulos/NN-nome/
    README.md           → plano do encontro (roteiro com tempos)
    conceitos.md        → material de apoio
    exercicio/          → enunciado + código inicial + testes (pacote do workspace)
/projeto-final/         → projeto integrador que atravessa os módulos
```

## Comandos

```bash
pnpm install                          # instala o workspace
pnpm verificar                           # valida Node, pnpm e provedor de modelo
pnpm test                             # Vitest em todos os pacotes (offline, com mock)
pnpm typecheck                        # tsc --noEmit em todos os pacotes
pnpm --filter <pacote> test           # testes de um pacote só (ex.: @mentoria/llm)
pnpm --filter <pacote> exec vitest run <arquivo> -t "<nome do teste>"   # um teste
```

## Arquitetura

- **Toda chamada a modelo passa por `@mentoria/llm`** (`packages/llm`). Exercícios e projeto final nunca importam provedores diretamente; trocar de modelo é só mudar `.env` (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`).
- O pacote usa o Vercel AI SDK (`ai`) com `@ai-sdk/openai-compatible`: Ollama (padrão, `http://localhost:11434/v1`) e qualquer provedor remoto compatível com a API da OpenAI usam o mesmo caminho.
- **Testes Vitest são determinísticos e offline**: recebem um modelo mock (`MockLanguageModelV4` de `ai/test`) por injeção. Chamadas reais ao modelo ficam em scripts e evals (promptfoo), nunca nos testes de critério de feito.
- Ao documentar provedores remotos, mantenha a explicação genérica (qualquer endpoint compatível com a API da OpenAI). Não recomende fornecedor nem token de API específico.

## Restrições de formato

- **Tempo:** aula ao vivo de 1h: ~40 min de conceito + demo, ~15 min de discussão, 5 min de folga. O exercício é **tarefa assíncrona** entre aulas e não entra no tempo da aula. Se um módulo não couber, diga o que cortar em vez de comprimir.
- **Dois níveis:** todo exercício tem uma versão base (para quem nunca usou IA) e um desafio extra (para quem já tem experiência).
- **Critério de feito verificável por máquina:** sempre que possível, testes (Vitest) ou uma eval que a pessoa roda e vê passar.

## Soluções dos exercícios

- O branch `main` contém só enunciados, código inicial e testes que **falham** até a pessoa resolver.
- As soluções ficam no branch `solucoes`. Nunca escreva soluções no `main`.
- Ao concluir um exercício, faça o commit do enunciado no `main` e depois da solução no `solucoes`. Rode os testes no `solucoes` para confirmar que passam.

## Ambiente

- TypeScript com Node.js na versão LTS atual e `pnpm`. Repositório organizado como workspace do pnpm (um pacote por exercício e um para o projeto final), com `tsconfig.base.json` compartilhado.
- Cada exercício roda com um comando documentado no README (ex.: `pnpm --filter <exercicio> test`).
- Validação de schema com Zod. Testes com Vitest. Evals com promptfoo.
- Provedor de modelo configurável por variável de ambiente, com opção de modelo local (Ollama) para quem não tiver acesso a API.
- Nenhum exercício pode exigir token de serviço externo (Notion, Slack, e-mail etc.). Integrações externas são sempre desafio extra opcional.
- Use apenas fontes públicas e dados sintéticos.
- Deploy (Módulo 8) só em Cloudflare Workers, Google Apps Script ou Google Sites (veja `ESPECIFICACAO.md`).

## Como trabalhar

- Gere um módulo por vez e pare ao fim de cada um para revisão.
- Para qualquer ferramenta, lib ou API, consulte a documentação atual na web antes de escrever código. Não confie em memória para versões e assinaturas.
- Não invente citações nem números. Se não achar a fonte, sinalize.
- Todo commit inclui o trailer:

  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  AI-Assisted: yes
  AI-Tool: claude-code
  ```
