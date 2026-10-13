# Exercício 07 — Um assistente de reembolso com humano no circuito

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo rodando.

Um assistente analisa pedidos de reembolso e sugere pagar ou negar. **Pagar é uma ação no mundo**: o dinheiro sai e não volta. Então nem tudo pode ser automático:

| Nível | Quando | O que acontece |
|---|---|---|
| **automático** | valor pequeno, confiança alta, sugestão a favor do cliente | paga sozinho |
| **aprovação** | o resto (valor médio, confiança baixa, toda sugestão de negar) | o grafo **pausa** e uma pessoa aprova, edita o valor ou rejeita |
| **bloqueado** | valor acima do limite | escala para outra equipe, sem pagar |

```text
START → analisar ─┬─ automatico ──────────────────────────────► pagar ──► END
                  ├─ aprovacao ──► pedir_aprovacao ⏸ ─┬─ aprovar/editar ─► pagar
                  │                    ▲               ├─ rejeitar ───────► negar ──► END
                  │                    └─ inválida ────┘
                  └─ bloqueado ──► escalar ──► END
```

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex07-hitl test             # versão base
pnpm -F @mentoria/ex07-hitl test:desafio     # desafio extra
pnpm -F @mentoria/ex07-hitl demo:aprovacao   # três pedidos; no do meio, você decide no terminal
pnpm -F @mentoria/ex07-hitl demo:armadilha   # por que nada de efeito antes do interrupt()
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex07-hitl test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | O que fazer |
|---|---|
| `src/autonomia.ts` | `nivelDeAutonomia`: a política (valor, confiança, sugestão → nível) |
| `src/reembolso.ts` | `montarReembolso`: o grafo, com `interrupt()` em `pedir_aprovacao` |

Fornecidos em `src/estado.ts`: o estado, os formatos (`PedidoSchema`, `AnaliseSchema`, `RespostaSchema`) e a política padrão.

**Dicas:**
- `interrupt(valor)` pausa o grafo e entrega `valor` a quem chamou, no campo `__interrupt__` do resultado. Para continuar: `grafo.invoke(new Command({ resume: resposta }), config)`, com o mesmo `thread_id`. A `resposta` vira o retorno do `interrupt()`.
- Ao retomar, **o nó roda de novo desde o começo**. Tudo o que vem antes do `interrupt()` acontece outra vez. Por isso `pagar` é um nó separado, depois da decisão. Rode `demo:armadilha` para ver.
- Não ponha `interrupt()` dentro de `try/catch`: ele funciona lançando uma exceção especial, e o `catch` engoliria a pausa.
- Valide a resposta humana como valida a saída de um LLM: com schema. Uma resposta inválida não pode virar "aprovado".

**Feito =** `pnpm -F @mentoria/ex07-hitl test` com todos os testes passando.

## Desafio extra — calibrar o limiar com dados

O limite de confiança 0,9 foi um chute. Em `src/desafio/limiar.ts`, use o histórico (confiança do assistente × a sugestão estava certa?) para:

1. `curvaDeLimiar`: para cada limiar possível, quanto seria automatizado (**cobertura**) e quanto acertaria (**precisão**);
2. `escolherLimiar`: o menor limiar que ainda atinge a precisão pedida, ou seja, o máximo de automação com a qualidade exigida.

É a ponte com a Aula 2: só dá para usar a confiança como gatilho se ela for **calibrada**.

**Feito =** `pnpm -F @mentoria/ex07-hitl test:desafio` com todos os testes passando.

## Perguntas para pensar

1. Na sua política, por que **toda** sugestão de negar passa por uma pessoa, mesmo com confiança alta?
2. O que aconteceria se `pagar` fosse chamado dentro de `pedir_aprovacao`, antes do `interrupt()`?
3. Se a pessoa aprova 99% do que vê sem mudar nada, o que isso diz? O processo está bom ou a revisão virou carimbo?
4. No seu trabalho, que decisão você deixaria 100% automática, qual pediria aprovação e qual nunca deixaria com uma máquina?
