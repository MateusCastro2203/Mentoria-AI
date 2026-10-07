# Exercício 02 — Sinais de confiança e calibração

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo rodando.

Na aula, a pergunta foi: **a confiança que o modelo informa acompanha o acerto?** Neste exercício você implementa as ferramentas para responder isso: três jeitos de obter um sinal de confiança de um LLM comum e as métricas que dizem se esse sinal presta.

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex02-decisoes test            # versão base
pnpm -F @mentoria/ex02-decisoes test:desafio    # desafio extra
```

Um teste só:

```bash
pnpm -F @mentoria/ex02-decisoes exec vitest run test/calibracao.test.ts -t "ece"
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex02-decisoes test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | Função | O que faz |
|---|---|---|
| `src/confianca.ts` | `probabilidadesDasOpcoes` | a partir das alternativas (logprobs) do token de decisão, a probabilidade de cada opção válida |
| | `confiancaDaEscolha` | a fórmula de confiança de uma Choice documentada pela TypeSafe: (n × p_max − 1) / (n − 1) |
| | `votacao` | autoconsistência: a resposta mais votada e a fração de votos |
| `src/calibracao.ts` | `acuracia`, `brier` | métricas básicas |
| | `tabelaDeCalibracao` | agrupa as previsões por faixa de confiança |
| | `ece` | erro de calibração esperado |
| | `coberturaVsAcuracia` | se eu só aceitar acima de um limiar, quanto cubro e quanto acerto? |

**Sugestão de ordem:** `confiancaDaEscolha` → `votacao` → `acuracia` → `brier` → `tabelaDeCalibracao` → `ece` → `coberturaVsAcuracia` → `probabilidadesDasOpcoes`.

**Dicas:**
- `logprob` é o **logaritmo** da probabilidade: use `Math.exp(logprob)` para voltar à probabilidade.
- Em `tabelaDeCalibracao`, cuidado com a confiança 1: ela tem que cair na última faixa, não numa faixa nova.
- `ece` fica bem curto se você reaproveitar `tabelaDeCalibracao`.

**Feito =** `pnpm -F @mentoria/ex02-decisoes test` com todos os testes passando.

### Use nos seus dados

Depois de fazer a etapa M2 do projeto final, o comando `pnpm -F @mentoria/curador m02:comparar` grava `projeto-final/saidas/m02-previsoes.json` (uma lista de `{ id, confianca, acertou }`). Escreva um script curto que leia esse arquivo e imprima a acurácia, a confiança média, o ECE e a cobertura × acurácia para os limiares 0,9, 0,95 e 0,99 usando as suas funções. É o que a demo `demo:calibracao` da aula faz. Compare com o resultado da turma.

## Desafio extra — temperature scaling

Em `src/desafio/temperatura.ts`, implemente:

- `logVerossimilhancaNegativa(exemplos, T)`: o quanto um modelo com temperatura T "explica" os rótulos (menor = melhor);
- `ajustarTemperatura(exemplos)`: a temperatura que minimiza essa métrica.

É a mesma temperatura do Módulo 1, agora usada para **calibrar**: um modelo confiante demais precisa de T > 1. O teste usa um modelo que dá ~96% para a classe que só está certa em 70% dos casos e espera T ≈ 2,6. A técnica é de [Guo et al. (2017)](https://arxiv.org/abs/1706.04599).

**Feito =** `pnpm -F @mentoria/ex02-decisoes test:desafio` com todos os testes passando.

Para ir além (sem teste): por que *temperature scaling* não muda a acurácia do modelo, só a confiança?

## Perguntas para pensar

1. Em `probabilidadesDasOpcoes`, por que um token que começa duas opções (`re` → `regulacao` e `relevante`) precisa ser ignorado? O que isso diz sobre escolher nomes de opções?
2. Por que a confiança de uma Choice usa o número de opções e não só a maior probabilidade?
3. A votação por autoconsistência deu 5 de 5 em respostas erradas. Que tipo de erro a autoconsistência **não** consegue detectar?
4. Com 20 previsões, quanto a acurácia muda se uma única previsão virar de errada para certa? O que isso diz sobre tirar conclusões de um ECE calculado com poucos dados?
