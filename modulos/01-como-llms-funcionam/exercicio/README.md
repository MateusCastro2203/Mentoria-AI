# Exercício 01 — Tokens, sampling e context window

> Tarefa assíncrona. Não precisa de modelo rodando: tudo aqui é offline e determinístico.

Você vai implementar, em TypeScript puro, as peças que a aula mostrou em funcionamento: contar tokens e estimar custo, transformar logits em probabilidades com temperatura, cortar a cauda com top-p, sortear o próximo token e encaixar uma conversa na context window.

## Como rodar

Da raiz do repositório:

```bash
pnpm --filter @mentoria/ex01-llms test            # versão base
pnpm --filter @mentoria/ex01-llms test:desafio    # desafio extra
```

Um teste só, enquanto você trabalha:

```bash
pnpm --filter @mentoria/ex01-llms exec vitest run test/sampling.test.ts -t "softmax"
```

No branch `main` os testes **falham** até você implementar. É esperado.

## Versão base

Implemente as funções marcadas com `TODO`. O comentário de cada função descreve o comportamento exato que os testes verificam.

| Arquivo | Função | O que faz |
|---|---|---|
| `src/tokens.ts` | `contarTokens` | conta tokens com o tokenizador fornecido (`src/tokenizador.ts`) |
| | `razaoDeTokens` | quantas vezes mais tokens o texto A ocupa em relação ao B |
| | `custoPorChamada` | custo em dólares, com preços diferentes para entrada e saída |
| `src/sampling.ts` | `softmax` | logits → probabilidades, com temperatura (0 = greedy) |
| | `filtrarTopP` | nucleus sampling: zera a cauda e renormaliza |
| | `amostrar` | softmax → top-p → sorteio pelo acumulado |
| `src/contexto.ts` | `ajustarAoContexto` | mantém o `system` e as mensagens mais recentes que cabem no limite |

**Sugestão de ordem:** `tokens.ts` → `softmax` → `filtrarTopP` → `amostrar` → `contexto.ts`.

**Dicas:**
- Na `softmax`, subtraia o maior logit antes de `Math.exp`. O resultado é o mesmo e não estoura.
- No `filtrarTopP`, ordene uma *cópia* dos índices por probabilidade; não reordene o array em si.
- O `amostrar` recebe a função `aleatorio` por parâmetro para os testes serem reprodutíveis. Nunca chame `Math.random` diretamente dentro dele.

**Feito =** `pnpm --filter @mentoria/ex01-llms test` com todos os testes passando.

## Desafio extra

Em `src/desafio/bigrama.ts`, construa um mini modelo de linguagem de **bigramas**: ele aprende, num corpus de frases, quantas vezes cada palavra vem depois de outra, e gera frases novas **palavra a palavra** usando o seu `amostrar`.

É o mesmo jogo de um LLM (prever o próximo token), só que olhando apenas a palavra anterior. O último teste mostra o ponto da aula: **toda transição que ele gera existe no corpus, e mesmo assim ele inventa frases que nunca viu.** Por exemplo, ele pode juntar "o brasil tem capital em" com "paris". É uma alucinação em miniatura: localmente plausível, globalmente falsa.

**Feito =** `pnpm --filter @mentoria/ex01-llms test:desafio` com todos os testes passando.

Para ir além (sem teste):
- Gere 20 frases com `temperature` 0, 1 e 2 e compare.
- Troque o corpus por algumas frases suas. O que acontece com corpus pequeno vs. grande?

## Perguntas para pensar

1. Na sua `softmax`, o que acontece com a probabilidade do favorito quando a temperatura tende a 0? E a infinito?
2. Por que `filtrarTopP` precisa renormalizar depois de zerar a cauda?
3. Em `ajustarAoContexto`, por que não pular uma mensagem grande para encaixar uma mais antiga e menor? Que problema de coerência isso causaria?
4. O seu modelo de bigramas "sabe" que Paris não é a capital do Brasil? O que um LLM tem a mais, e o que continua igual?
