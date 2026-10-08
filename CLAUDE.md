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
6. Material de aula em `material/`: `slides.md` seguindo o roteiro do README (com notas do apresentador e os tempos) e `apostila.json` montando a apostila a partir dos .md existentes (não duplique texto), mais `guia-do-mentor.md` explicando cada slide para quem vai apresentar (o mentor não é especialista em todos os termos: explique jargão, dê analogias e respostas esperadas das perguntas). Qualquer `material/<nome>.json` vira `<nome>.pdf`. Rode `pnpm material NN`, confira os PDFs visualmente e commite os arquivos gerados.

## Estrutura do repositório

```
/README.md              → visão geral, público, pré-requisitos, cronograma
/ESPECIFICACAO.md       → especificação da trilha (não alterar sem pedir)
/referencias.md         → bibliografia consolidada
/packages/llm/          → @mentoria/llm: camada de provedor (única porta para modelos)
/scripts/verificar.ts   → verificação do ambiente (`pnpm verificar`)
/scripts/material.ts    → gera apresentação e apostila (`pnpm material NN`)
/material/              → tema Marp dos slides e CSS da apostila
/dados/                 → dados sintéticos compartilhados
/modulos/00-setup/      → pré-requisitos e configuração do ambiente
/modulos/NN-nome/
    README.md           → plano do encontro (roteiro com tempos)
    conceitos.md        → material de apoio
    exercicio/          → enunciado + código inicial + testes (pacote do workspace)
    material/
        slides.md       → apresentação (Marp, tema `mentoria`), com notas do apresentador em comentários HTML
        apostila.json   → quais trechos dos .md do repo entram na apostila
        guia-do-mentor.md / .json → cada slide explicado em linguagem simples (termos, o que falar, respostas esperadas)
        apresentacao.pdf / apresentacao.pptx / apostila.pdf  → gerados por `pnpm material NN` (commitados)
/projeto-final/         → projeto integrador que atravessa os módulos
    src/mNN/ · solucao/mNN/ · test/mNN.test.ts   → uma pasta por etapa
    evals/              → configs do promptfoo + providers que rodam o curador de verdade (a partir do M3)
    scripts/            → experimentos fornecidos por etapa (mNN:*); gravam em saidas/ (ignorado no git)
```

## Comandos

```bash
pnpm install                          # instala o workspace
pnpm verificar                           # valida Node, pnpm e provedor de modelo
pnpm test                             # Vitest em todos os pacotes (offline, com mock; exercícios falham até resolver)
pnpm test:solucao                     # mesmos testes contra as soluções de referência (solucao/)
pnpm typecheck                        # tsc --noEmit em todos os pacotes
pnpm material 01                      # gera apresentação (PDF + PPTX) e apostila do módulo 01 (precisa de Chrome/Edge/Chromium)
pnpm --filter <pacote> test           # testes de um pacote só (ex.: @mentoria/llm)
pnpm --filter <pacote> exec vitest run <arquivo> -t "<nome do teste>"   # um teste
```

## Arquitetura

- **Toda chamada a modelo passa por `@mentoria/llm`** (`packages/llm`). Exercícios e projeto final nunca importam provedores diretamente; trocar de modelo é só mudar `.env` (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`).
- O pacote usa o Vercel AI SDK (`ai`) com `@ai-sdk/openai-compatible`: Ollama (padrão, `http://localhost:11434/v1`) e qualquer provedor remoto compatível com a API da OpenAI usam o mesmo caminho.
- **Evals (promptfoo) rodam o sistema de verdade**: os providers em `projeto-final/evals/` importam o código do curador (`src/` ou, com `SOLUCAO=1`, `solucao/`) e o script `m03:avaliar` lê a saída JSON do promptfoo, calcula as métricas e aplica o portão de qualidade (sai com código 1 se reprovar). O promptfoo não tem portão por taxa de acerto: ele fica no script.
- **Testes Vitest são determinísticos e offline**: recebem um modelo mock (`MockLanguageModelV4` de `ai/test`) por injeção. Chamadas reais ao modelo ficam em scripts e evals (promptfoo), nunca nos testes de critério de feito.
- Ao documentar provedores remotos, mantenha a explicação genérica (qualquer endpoint compatível com a API da OpenAI). Não recomende fornecedor nem token de API específico.

## Restrições de formato

- **Tempo:** aula ao vivo de 1h: ~40 min de conceito + demo, ~15 min de discussão, 5 min de folga. O exercício é **tarefa assíncrona** entre aulas e não entra no tempo da aula. Se um módulo não couber, diga o que cortar em vez de comprimir.
- **Dois níveis:** todo exercício tem uma versão base (para quem nunca usou IA) e um desafio extra (para quem já tem experiência).
- **Critério de feito verificável por máquina:** sempre que possível, testes (Vitest) ou uma eval que a pessoa roda e vê passar.

## Soluções dos exercícios

- Tudo fica no `main`, sem branch de soluções.
- `src/` contém só enunciado e código inicial com `TODO`: os testes (`pnpm --filter <pacote> test`) **falham** até a pessoa resolver. Nunca escreva solução em `src/`.
- A solução de referência fica em `solucao/`, no mesmo pacote, espelhando só os arquivos com `TODO` (no projeto final, `solucao/mNN/…`). Todo arquivo de solução começa com o aviso de spoiler.
- `vitest.solucao.config.ts` redireciona por alias os imports `../src/<arquivo>.js` dos testes para `solucao/`, então os **mesmos testes** rodam contra a resposta: `pnpm --filter <pacote> test:solucao` (ou `pnpm test:solucao` na raiz). Ao criar um exercício novo, inclua o arquivo no regex do alias.
- Ao concluir um exercício, confirme as duas coisas: `test` falha (stubs) e `test:solucao` passa.

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
