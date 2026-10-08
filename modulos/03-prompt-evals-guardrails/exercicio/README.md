# Exercício 03 — Métricas de eval, regressão e quem avalia o avaliador

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo rodando.

Você implementa as contas que transformam "rodei os casos" em decisão: métricas por classe, comparação caso a caso entre duas versões, um portão de qualidade e a concordância entre um juiz LLM e um humano.

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex03-evals test            # versão base
pnpm -F @mentoria/ex03-evals test:desafio    # desafio extra
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex03-evals test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | Função | O que faz |
|---|---|---|
| `src/metricas.ts` | `matrizDeConfusao` | quem foi confundido com quem |
| | `metricasDaClasse` | precisão, recall, F1 e suporte de uma classe |
| | `macroF1` | média do F1 das classes (cada uma pesa igual) |
| `src/regressao.ts` | `compararExecucoes` | regressões, melhorias e delta de acurácia entre duas execuções |
| | `aprovarMudanca` | o portão de qualidade: aprova ou reprova, com os motivos |
| `src/concordancia.ts` | `concordancia` | fração de itens em que juiz e humano concordam |
| | `kappaDeCohen` | concordância descontando o acaso |

**Dicas:**
- Em `metricasDaClasse`: VP = previu a classe e era; FP = previu a classe e não era; FN = era a classe e previu outra.
- Em `kappaDeCohen`, o teste "um juiz que aprova tudo" mostra por que concordância simples engana: 75% de concordância, kappa 0.

**Feito =** `pnpm -F @mentoria/ex03-evals test` com todos os testes passando.

### Use nos seus dados

Depois de rodar a etapa M3 do projeto (`pnpm -F @mentoria/curador m03:avaliar`), o arquivo `projeto-final/saidas/m03-classificacao.json` tem o resultado do promptfoo para as duas versões do prompt. Escreva um script curto que monte, com as suas funções, a matriz de confusão da v2 e a lista de regressões da v1 para a v2. Confira com o relatório `saidas/m03-relatorio.md`.

**Valide o juiz:** abra `projeto-final/saidas/m03-resumos.json`, escolha 10 resumos, dê você mesmo "aprova" ou "reprova" para a fidelidade e calcule o kappa entre você e o juiz. Você confiaria nesse juiz para barrar um deploy?

## Desafio extra — intervalo de confiança por bootstrap

Em `src/desafio/bootstrap.ts`, implemente `intervaloBootstrap`: reamostre os resultados com reposição milhares de vezes e use os percentis para estimar um intervalo de confiança da acurácia ([Efron, 1979](https://doi.org/10.1214/aos/1176344552)). O teste usa 15 acertos em 20 (como na M2) e mostra que o intervalo vai de cerca de 55% a 95%. Com 4× mais casos, ele estreita.

**Feito =** `pnpm -F @mentoria/ex03-evals test:desafio` com todos os testes passando.

Para ir além (sem teste): calcule o intervalo da v1 e da v2 do relatório da M3. Os intervalos se sobrepõem? O que isso diz sobre afirmar que "a v2 é melhor"?

## Perguntas para pensar

1. No projeto, o que custa mais caro: precisão baixa ou recall baixo na decisão de **publicar**? E na de **descartar**?
2. Uma mudança subiu a acurácia em 2 pontos e criou 1 regressão num caso de injeção. Você aprovaria? Que regra de portão evitaria a discussão?
3. Por que o kappa de um juiz que aprova tudo é 0, mesmo com 75% de concordância?
4. O que dá para checar com código nos resumos da newsletter, sem juiz?
