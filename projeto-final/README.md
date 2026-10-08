# Projeto final — curador automático de newsletter sobre IA

Um sistema que lê notícias, decide quais entram numa newsletter sobre **IA aplicada para devs**, classifica, resume e publica. Cada módulo acrescenta uma camada; o código evolui no mesmo pacote (`@mentoria/curador`).

Os dados são sintéticos: veja [`dados/README.md`](../dados/README.md) (notícias, rótulos e critério de relevância).

## Etapas

| Etapa | Módulo | Entrega | Testes |
|---|---|---|---|
| **M1** | [01 — Como LLMs funcionam](../modulos/01-como-llms-funcionam/README.md) | classificação em texto livre | `test/m01.test.ts` |
| **M2** | [02 — System One e Jev](../modulos/02-system-one-e-jev/README.md) | decisão tipada (Zod) com confiança | `test/m02.test.ts` |
| **M3** | [03 — Prompt, Evals e Guardrails](../modulos/03-prompt-evals-guardrails/README.md) | prompt v2, resumos, guardrails e evals | `test/m03.test.ts` + `m03:avaliar` |
| **M4** | [04 — Skills vs. Agentes](../modulos/04-skills-vs-agentes/README.md) | skill reutilizável + agente que busca fontes | `test/m04.test.ts` + `m04:comparar` |
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
2. a comparação roda com o modelo de verdade nas notícias rotuladas e grava `saidas/m02-comparacao.md` e `saidas/m02-previsoes.json`:

   ```bash
   pnpm -F @mentoria/curador m02:comparar
   ```

Abra o relatório e responda (vamos discutir na Aula 3):

- O texto livre e a decisão tipada acertaram quanto? O que mudou além da acurácia?
- A confiança acompanha o acerto? Em que faixa estão os erros?
- Os erros são aleatórios ou têm padrão? O rótulo humano está sempre certo?

**Desafio extra:** acrescente um campo `justificativa` (string curta) **antes** de `relevante` no schema e rode a comparação de novo. A acurácia mudou? E a confiança? (A ordem dos campos importa: o modelo gera o JSON da esquerda para a direita.)

## Etapa M3 — prompt v2, resumos, guardrails e evals

**Objetivo:** melhorar o prompt **com medição**, gerar os resumos da newsletter e garantir por código que nada inseguro seja publicado sozinho. O dataset cresceu para 40 notícias, com um guia de rotulagem e três casos especiais (injeção, sem URL, URL interna): veja [`dados/README.md`](../dados/README.md).

Implemente em `src/m03/`:

1. **`prompt-v2.ts` → `montarPromptV2(noticia, exemplos)`:** seções em XML (`<papel>`, `<criterios>`, `<categorias>`, `<regras>`, `<exemplos>`), critérios do guia de rotulagem, exemplos *few-shot* de `dados/exemplos.json` (nunca a própria notícia) e a notícia escapada dentro de `<noticia>`. A `classificarTipado` da M2 aceita `montarPrompt` para usar a v2.
2. **`resumir.ts` → `resumir(noticia)`:** até 2 frases, só com fatos do original, no máximo 280 caracteres.
3. **`guardrails.ts`:**
   - `verificarFonte(url)`: sem URL, URL inválida, não `https` ou host não público → não verificável;
   - `detectarInjecao(texto)`: sinais de prompt injection;
   - `decidirPublicacao(noticia, resultado)`: `publicar`, `revisar` (fonte, injeção, saída inválida, confiança baixa) ou `descartar` (irrelevante).

**Feito =**
1. `pnpm -F @mentoria/curador exec vitest run test/m03.test.ts` verde (offline);
2. as evals rodam com o modelo de verdade e o **portão de qualidade aprova**:

   ```bash
   pnpm -F @mentoria/curador m03:avaliar              # classificação v1 × v2 (~5 min)
   pnpm -F @mentoria/curador m03:avaliar --resumos    # + resumos com juiz LLM (~12 min)
   pnpm -F @mentoria/curador m03:ver                  # abre a tabela do promptfoo no navegador
   ```

   O portão reprova se o macro-F1 da v2 ficar abaixo de 0,8 ou abaixo da v1, ou se algum caso especial for publicado. O relatório fica em `saidas/m03-relatorio.md`.

Traga para a Aula 4: o relatório, com os erros da v2 e as reprovações do juiz nos resumos (você concorda com ele?).

**Desafio extra:** `src/m03/desafio/verificar-online.ts` → `verificarFonteOnline(url)`: a URL responde? (HEAD com timeout, testado com `fetch` simulado: `pnpm -F @mentoria/curador test:desafio`.)

## Etapa M4 — o curador como skill e como agente

**Objetivo:** empacotar o conhecimento do curador como uma **skill** reutilizável e, depois, transformar o curador num **agente** que decide sozinho quais fontes ler. Medir o que muda.

As notícias agora chegam por **fontes** simuladas (`dados/fontes.json`: dez fontes, cada uma com descrição e notícias).

1. **A skill** (`skills/curar-noticia/`), no formato aberto [Agent Skills](https://agentskills.io/specification):
   - escreva o `SKILL.md`: `name` igual à pasta, `description` dizendo o que faz **e quando usar**, e as instruções da classificação no corpo;
   - ponha as definições das categorias em `references/guia-de-rotulagem.md` e aponte para ele no corpo.
2. **`src/m04/skill.ts`:** `lerSkill(pasta)` (lê e valida o frontmatter segundo a especificação), `montarPromptDaSkill(skill, noticia)` e `classificarComSkill(noticia)`.
3. **`src/m04/ferramentas.ts`:** `criarFerramentas(deps)` → `listarFontes`, `lerFonte`, `avaliarNoticias` e `entregarSelecao`, com um registro do que o agente fez.
4. **`src/m04/agente.ts`:** `validarSelecao` (o agente propõe; o código decide) e `curarComAgente`, que roda o loop com `gerarComFerramentas` de `@mentoria/llm`.

**Feito =**
1. `pnpm -F @mentoria/curador exec vitest run test/m04.test.ts` verde (offline, com modelo simulado);
2. a comparação roda com o modelo de verdade e grava `saidas/m04-comparacao.md`:

   ```bash
   pnpm -F @mentoria/curador m04:comparar      # pipeline com a skill × agente (2 execuções)
   ```

Abra o relatório e responda (vamos discutir na Aula 5):

- O agente leu todas as fontes? Quais pulou, e isso custou notícias?
- Quantas chamadas ao modelo cada abordagem fez? E o tempo?
- As duas execuções do agente seguiram a mesma trajetória?
- O código recusou algo que o agente entregou? Por quê?

**Desafio extra:** instale a sua skill num agente de código compatível com Agent Skills (por exemplo, copiando a pasta para o diretório de skills da ferramenta) e peça para ele classificar uma notícia nova. A `description` foi suficiente para a skill ser ativada?

