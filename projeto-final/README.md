# Projeto final — curador automático de newsletter sobre IA

Um sistema que lê notícias, decide quais entram numa newsletter sobre **IA aplicada para devs**, classifica, resume e publica. Cada módulo acrescenta uma camada; o código evolui no mesmo pacote (`@mentoria/curador`).

Os dados são sintéticos: veja [`dados/README.md`](../dados/README.md) (notícias, rótulos e critério de relevância).

## Etapas

| Etapa | Módulo | Entrega | Testes |
|---|---|---|---|
| **M1** | [01 — Como LLMs funcionam](../modulos/01-como-llms-funcionam/README.md) | classificação em texto livre | `test/m01.test.ts` |
| **M2** | [02 — System One e Jev](../modulos/02-system-one-e-jev/README.md) | decisão tipada (Zod) com confiança | `test/m02.test.ts` |
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

A solução de referência de cada etapa fica em [`solucao/mNN/`](solucao/). Tente antes de abrir. `pnpm --filter @mentoria/curador test:solucao` roda os mesmos testes contra ela, e `m01:temperaturas:solucao` roda o experimento usando a solução (útil se você travou e quer seguir para a próxima etapa).

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

## Etapa M2 — decisão tipada com confiança

**Objetivo:** em vez de texto livre, o modelo devolve um objeto que o código usa direto, `{ relevante, categoria, confianca }`, validado por Zod. O código fica no controle das regras e das falhas.

Implemente em `src/m02/classificar-tipado.ts`:

1. `SchemaClassificacao`: `relevante` (boolean), `categoria` (uma de `CATEGORIAS` ou `null`), `confianca` (número de 0 a 1).
2. `montarPromptTipado(noticia)` → `{ system, prompt }`. Explique o que é `confianca`: a certeza de que a classificação **inteira** está correta (na preparação desta etapa, sem essa explicação, o modelo devolveu 0,15 para notícias irrelevantes que ele tinha acertado: entendeu "confiança" como "chance de ser relevante").
3. `classificarTipado(noticia, { temperature, modelo })` → `{ ok: true, decisao }` ou `{ ok: false, motivo }`:
   - saída fora do schema → `motivo: "saida-invalida"` (outros erros, como rede, continuam sendo lançados);
   - não relevante → `categoria` vira `null` no código;
   - relevante sem categoria → `motivo: "inconsistente"`.

**Cuidado com nomes:** a saída restrita a um schema só proíbe tokens. Se o começo do que o modelo quer escrever bate com o começo de uma opção, ele "cai" nela (veja a demo `demo:armadilha-do-rotulo` do Módulo 2). Por isso `relevante` vem antes e separado de `categoria`.

**Feito =**
1. `pnpm -F @mentoria/curador exec vitest run test/m02.test.ts` verde (offline, com mock);
2. a comparação roda com o modelo de verdade nas 20 notícias e grava `saidas/m02-comparacao.md` e `saidas/m02-previsoes.json`:

   ```bash
   pnpm -F @mentoria/curador m02:comparar
   ```

Abra o relatório e responda (vamos discutir na Aula 3):

- O texto livre e a decisão tipada acertaram quanto? O que mudou além da acurácia?
- A confiança acompanha o acerto? Em que faixa estão os erros?
- Os erros são aleatórios ou têm padrão? O rótulo humano está sempre certo?

**Desafio extra:** acrescente um campo `justificativa` (string curta) **antes** de `relevante` no schema e rode a comparação de novo. A acurácia mudou? E a confiança? (A ordem dos campos importa: o modelo gera o JSON da esquerda para a direita.)

