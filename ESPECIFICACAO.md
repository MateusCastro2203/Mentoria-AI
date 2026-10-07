# Especificação da trilha

## Módulo 1 — Como LLMs funcionam (base técnica)

Tokenização, embeddings, transformer/atenção (intuição, sem matemática pesada), geração autoregressiva token a token, sampling (temperature, top-p), context window, pré-treino vs. RLHF/RLVR, alucinação e por que ela acontece, custo e latência por token.

**Este módulo não cabe inteiro em 1h.** Na aula ao vivo, priorize tokenização, geração autoregressiva, sampling, context window e alucinação. Embeddings, atenção e pré-treino vs. RLHF/RLVR ficam no `conceitos.md` como leitura de apoio, com menção rápida em aula. Se outra divisão funcionar melhor, proponha.

## Módulo 2 — Além do chat: System One Models e o Jev

Fonte: [https://typesafe.ai/blog/introducing-system-one-models-and-jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) (lançado em 15/set/2026, provavelmente fora do seu conhecimento de treino; leia antes de escrever). Resumo:

- A TypeSafe AI lançou uma nova classe de modelos ("System One", em referência a Kahneman). O primeiro é o **Jev**.

- Ele não gera texto. Recebe estado não estruturado e devolve **decisões tipadas** com **probabilidades calibradas**, geradas em paralelo, não token a token.

- É treinado com RLCD (Reinforcement Learning for Calibrated Decisions), em vez de RLHF/RLVR.

- Funciona como um "if inteligente" dentro do código: classificar, rotear, pontuar, extrair, servir de guardrail ou de juiz.

- A empresa afirma latência de 70–500ms, custo muito menor e ausência de erro de tipo por construção.

Use o Jev como contraste com o Módulo 1 (strings vs. valores tipados, sequencial vs. paralelo) e como gancho para a pergunta "quando eu preciso de um LLM gerativo e quando preciso só de uma decisão?". **Trate as alegações de forma crítica**: são números do próprio fornecedor, o produto está em early access e os autores listam ressalvas sobre os benchmarks. Inclua essas ressalvas no material.

**O exercício não pode depender do Jev.** A pessoa reproduz a ideia com um LLM comum: compara a saída em texto livre com uma saída estruturada validada com Zod, acompanhada de um sinal de confiança (logprobs quando o provedor oferecer, senão autoavaliação). Depois mede se a confiança acompanha o acerto num conjunto pequeno de exemplos rotulados. O uso real do Jev fica como demo opcional do mentor.

## Módulo 3 — Prompt, Evals e Guardrails

Prompt engineering (estrutura, exemplos, XML, saída estruturada), evals (datasets, LLM-as-judge, métricas, regressão, ferramentas como promptfoo), guardrails (validação de entrada e saída, schema, detecção de jailbreak, confiança/calibração como gatilho de fallback).

## Módulo 4 — Skills vs. Agentes

O que é cada um, como se diferenciam e um **framework de decisão** explícito: quando basta um prompt, quando empacotar como skill, quando construir um agente (loop com ferramentas e autonomia) e quando usar uma decisão estruturada estilo Jev. Inclua uma tabela comparativa e 3–4 casos **de domínios diferentes do projeto final** para a turma classificar, cada um com resposta esperada e justificativa.

## Módulo 5 — Sistemas multiagênticos e MCP

Padrões multiagente (supervisor, hierárquico, pipeline, handoff), MCP (o que é, servidor vs. cliente, tools/resources/prompts) e quando multiagente é exagero.

O exercício usa um **servidor MCP local** (escrito pela pessoa ou mock fornecido). Conectar a Notion, Slack ou e-mail é desafio extra opcional.

## Módulo 6 — Orquestração com LangGraph.js (e alternativas)

Grafos de estado, nós, arestas condicionais, checkpointing, memória, usando LangGraph.js. Compare brevemente com alternativas do ecossistema TypeScript (ex.: Claude Agent SDK, OpenAI Agents SDK, Mastra, Vercel AI SDK, workflows em código puro) e diga quando cada uma faz sentido. Confirme na documentação atual que os recursos usados nos Módulos 6 e 7 (checkpoint, interrupções para HITL) existem na versão JS.

## Módulo 7 — HITL e automação

Human-in-the-loop: interrupções, aprovação, revisão por limiar de confiança e níveis de autonomia. Automação de ponta a ponta: o que automatizar totalmente, o que manter com humano e como medir isso.

## Módulo 8 — Deploy e operação

Empacotamento, observabilidade/tracing, custo, latência, versionamento de prompts e modelos, evals em CI, rollback e monitoramento em produção.

O deploy prático usa **Cloudflare Workers** (aplicações mais complexas), **Google Apps Script** ou **Google Sites** (páginas estáticas). Escolha o mais adequado e justifique. Os conceitos gerais de operação podem ser ensinados de forma agnóstica de plataforma.

---

# Projeto final: curador automático de newsletter sobre IA

Evolui ao longo da trilha:

- **Módulos 1–2:** um prompt classifica se uma notícia é relevante e em que categoria entra. Comparar a saída livre do LLM com uma decisão estruturada e tipada, com confiança (estilo System One / Jev, simulado com LLM comum).

- **Módulo 3:** dataset rotulado de notícias + evals de classificação (precisão/recall) e de qualidade de resumo (LLM-as-judge); guardrails de schema e de fonte (não publicar nada sem URL verificável).

- **Módulo 4:** transformar o fluxo numa skill reutilizável e depois num agente que busca fontes por conta própria; discutir o que muda.

- **Módulo 5:** multiagente (coletor, classificador, redator, revisor) com MCP para fontes (RSS/web). Destino padrão local (arquivo markdown via servidor MCP local); Notion, Slack ou e-mail opcionais.

- **Módulo 6:** orquestrar em LangGraph, com estado, checkpoint e arestas condicionais por confiança.

- **Módulo 7:** HITL, em que um editor humano aprova, edita ou rejeita a edição antes do envio. Itens com baixa confiança vão para revisão obrigatória.

- **Módulo 8:** rodar agendado em uma das plataformas de deploy do Módulo 8, com tracing, custo por edição, evals em CI e rollback de prompt.