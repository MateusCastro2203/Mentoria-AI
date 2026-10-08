# Exercício 04 — O framework em código e um agente sem biblioteca

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo rodando.

Duas peças:

1. o **framework de decisão** da aula (prompt, skill, agente ou decisão estruturada?) como uma função testável;
2. um **agente escrito à mão**: o loop que qualquer biblioteca de agentes faz por baixo. O "modelo" é uma função que você controla nos testes.

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex04-agentes test            # versão base
pnpm -F @mentoria/ex04-agentes test:desafio    # desafio extra
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex04-agentes test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | Função | O que faz |
|---|---|---|
| `src/framework.ts` | `recomendarAbordagem` | aplica as 4 regras do framework, na ordem, e devolve a abordagem com os motivos |
| `src/loop.ts` | `executarAgente` | o loop: decidir → executar ferramenta → registrar → repetir, até responder ou chegar ao limite |

`src/casos.ts` (fornecido) tem os 4 casos da aula com a resposta esperada. Os testes usam esses casos.

**Dicas:**
- No framework, a **ordem** das regras importa: uma decisão que precisa investigar com ferramentas é agente, não decisão estruturada.
- No loop, erro de ferramenta **não** derruba o agente: vira um evento no histórico para o "modelo" ver na próxima volta.

**Feito =** `pnpm -F @mentoria/ex04-agentes test` com todos os testes passando.

## Desafio extra — proteções

Em `src/desafio/protecoes.ts`, implemente `executarAgenteProtegido`: o mesmo loop, que também para quando o modelo **repete** a mesma chamada várias vezes seguidas e quando a próxima ferramenta **estouraria o orçamento** de custo. São as proteções que faltam a um agente de verdade além do limite de passos.

**Feito =** `pnpm -F @mentoria/ex04-agentes test:desafio` com todos os testes passando.

Para ir além (sem teste): troque o "modelo" de roteiro por um LLM de verdade. Monte o `decidir` com `gerarObjeto` (de `@mentoria/llm`) pedindo um objeto `{ tipo, nome, entrada, texto }` a partir do histórico. O que dá errado primeiro?

## Perguntas para pensar

1. Pense num caso do seu trabalho que daria vontade de resolver com um agente. Ele passa na regra 1 do framework (passos variáveis **e** ferramentas)? Se não passa, qual abordagem mais simples resolveria?
2. Por que devolver o erro da ferramenta para o modelo, em vez de lançar uma exceção?
3. No seu loop, o que impede o agente de chamar uma ferramenta que não deveria? E de chamar uma permitida com uma entrada perigosa?
4. O limite de passos protege contra o quê? E o que ele **não** protege?
