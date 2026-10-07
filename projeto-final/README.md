# Projeto final — curador automático de newsletter sobre IA

Um sistema que lê notícias, decide quais entram numa newsletter sobre **IA aplicada para devs**, classifica, resume e publica. Cada módulo acrescenta uma camada; o código evolui no mesmo pacote (`@mentoria/curador`).

Os dados são sintéticos: veja [`dados/README.md`](../dados/README.md) (notícias, rótulos e critério de relevância).

## Etapas

| Etapa | Módulo | Entrega | Testes |
|---|---|---|---|
| **M1** | [01 — Como LLMs funcionam](../modulos/01-como-llms-funcionam/README.md) | classificação em texto livre | `test/m01.test.ts` |
| M2 | 02 — System One e Jev | decisão tipada (Zod) com confiança | em breve |
| M3 | 03 — Prompt, Evals e Guardrails | dataset rotulado, evals, guardrails | em breve |
| M4 | 04 — Skills vs. Agentes | skill reutilizável + agente que busca fontes | em breve |
| M5 | 05 — Multiagente e MCP | coletor, classificador, redator, revisor via MCP local | em breve |
| M6 | 06 — LangGraph.js | grafo com estado, checkpoint e arestas por confiança | em breve |
| M7 | 07 — HITL | aprovação humana antes de publicar | em breve |
| M8 | 08 — Deploy | execução agendada com tracing, custo, evals em CI | em breve |

Rodar os testes de uma etapa:

```bash
pnpm --filter @mentoria/curador exec vitest run test/m01.test.ts
```

## Etapa M1 — classificação em texto livre

**Objetivo:** um prompt que diz se a notícia é relevante para a newsletter e em que categoria ela entra (`modelos`, `ferramentas`, `pesquisa`, `regulacao`, `mercado`).

Implemente em `src/m01/classificar-livre.ts`:

1. `montarPromptClassificacao(noticia)` → `{ system, prompt }`
   - `system`: papel do modelo, critério de relevância (veja `dados/README.md`) e **todas** as categorias.
   - `prompt`: título, resumo e fonte da notícia.
2. `classificarLivre(noticia, { temperature, modelo })` → texto da resposta, chamando `gerarTexto` de `@mentoria/llm`.

**Feito =**
1. `pnpm --filter @mentoria/curador exec vitest run test/m01.test.ts` verde (offline, com mock);
2. o experimento roda com o modelo de verdade e grava `projeto-final/saidas/m01-temperaturas.md`:

   ```bash
   pnpm --filter @mentoria/curador m01:temperaturas
   ```

Abra o arquivo gerado e responda (vamos discutir na Aula 2):

- As respostas mantêm o **mesmo formato** entre execuções? E entre temperaturas?
- Quantas acertaram o rótulo humano?
- Se outro programa precisasse ler essa resposta para decidir se publica a notícia, o que poderia dar errado?

**Desafio extra:** sem mudar a assinatura de `classificarLivre`, escreva um `interpretarResposta(texto)` que extraia `relevante` e `categoria` da resposta livre com regex ou parsing. Rode no arquivo de saída e conte quantas respostas você conseguiu interpretar. Guarde o número: na Aula 2 vamos compará-lo com uma saída estruturada.
