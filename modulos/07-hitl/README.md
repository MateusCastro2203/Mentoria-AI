# Módulo 07 — Human-in-the-loop e automação

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** Módulo 06 e o relatório da etapa M6 (`projeto-final/saidas/m06-relatorio.md`)
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. explicar por que e onde pôr uma pessoa no circuito, incluindo o risco do viés de automação;
2. classificar uma etapa num nível de autonomia (operadora → observadora) e justificar a escolha;
3. pausar um grafo com `interrupt()` e retomá-lo com `Command({ resume })`, inclusive com várias pausas em paralelo, aprovando, editando ou rejeitando;
4. evitar as armadilhas da retomada (o nó reexecuta desde o começo; nada de efeito externo antes da pausa);
5. medir um processo com revisão humana (taxa de intervenção, taxa de override, tempo de decisão) e calibrar o limiar de automação com dados.

## Mensagem central

> Automatize o que dá para desfazer; peça aprovação para o que não dá. Comece com mais revisão e vá soltando **com dados**. E meça se a revisão é real: uma pessoa que aprova tudo em dois segundos virou carimbo.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–10 | **Por que HITL** | Ações irreversíveis, incerteza calibrada, responsabilidade (analogia do piloto automático). O viés de automação. Os cinco níveis de autonomia, e o nível como decisão de desenho. | — |
| 10–22 | **`interrupt()` e `Command`** | Pausar, salvar, retomar em outro processo. Aprovar, editar, rejeitar; validar a resposta com schema. As armadilhas: o nó reexecuta (e-mail duas vezes), `try/catch`, várias pausas por id. | `demo:armadilha` |
| 22–32 | **Demo: aprovação** | Três pedidos de reembolso em três níveis; o do meio pausa e o mentor decide ao vivo. O curador pausado desde antes da aula: revisar os itens e a edição no terminal e publicar. | `demo:aprovacao` · `m07:edicao` |
| 32–40 | **O que automatizar e como medir** | As três perguntas (desfaz? custo do erro? confiança calibrada?). Intervenção, override, tempo de decisão; como ler juntos. Calibrar o limiar com a curva cobertura × precisão. | — |
| 40–55 | **Discussão** | Perguntas abaixo. | — |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M7. | — |

> **Corte declarado:** interfaces de revisão (web, chat), revisão em lote, filas com prazo e escalonamento, e aprendizado com as correções humanas (*feedback loops*) ficam na leitura de apoio ou fora do curso.

### Comandos das demos

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex07-hitl demo:armadilha                     # offline: o e-mail que sai duas vezes
pnpm -F @mentoria/ex07-hitl demo:aprovacao                     # offline: você decide o reembolso do meio
pnpm -F @mentoria/curador m07:edicao:solucao -- --nova         # ANTES da aula: roda até a 1ª pausa (vários minutos); responda [s]
pnpm -F @mentoria/curador m07:edicao:solucao                   # NA aula: continua da pausa; você decide e publica
```

### Notas para o mentor

Rodei com `qwen3:4b-instruct` (Ollama). Rode a primeira parte **antes** da aula: são uns 13 minutos de modelo até a primeira pausa.

| Execução | O que aconteceu | Tempo |
|---|---|---|
| `--nova` | coletar, classificar 32, redigir os 10 confiantes; **pausou** em 4 itens | ~13 min |
| retomada (outro processo) | 4 rejeitados, edição de 9 itens aprovada e publicada | **~1 s**, sem chamar o modelo |

- **A pausa sobrevive ao processo.** Na primeira execução, o terminal fechou no meio da pergunta (antes da correção, o script quebrava com a entrada fechada; agora sai limpo). Mesmo assim, a segunda execução encontrou as 4 pausas no arquivo de checkpoint. É exatamente o que a aula quer mostrar.
- **As 4 pausas foram por guardrail**, nenhuma por confiança baixa: `n40` (link `http://10.0.0.5`), `n17` (confiança 0,65, sem categoria), `n13` (a promessa de "nunca errar" da Aula 4) e `n38` (a injeção da Aula 3). Os guardrails da Aula 3 viraram o gatilho da revisão humana.
- **Métricas:** 5 pausas, intervenção de 13% (4 de 32), override de 80% (4 de 5). O override alto **não** é sinal de problema: os itens pararam porque o guardrail desconfiou; rejeitar é concordar com o guardrail e discordar do classificador. Use isso para discutir que toda métrica precisa dizer contra qual proposta mede.
- **A edição** saiu com os mesmos 9 itens da M6 (as confianças da M6 se repetiram); mercado continua de fora (veja o desafio da etapa M6).
- **A armadilha da reexecução foi medida antes de escrever o módulo:** com 3 pausas em paralelo, responder uma fez as 3 rodarem de novo até o `interrupt()` (o contador foi de 3 para 6). Por isso, no curador, a redação do item revisado fica depois da pausa.
- Para uma demo rápida sem modelo, use `demo:aprovacao` e `demo:armadilha` (instantâneas).

## Perguntas para discussão (15 min)

1. No seu trabalho, que decisão você deixaria 100% automática, qual pediria aprovação e qual nunca deixaria com uma máquina? Por quê?
2. Se a pessoa que revisa aprova 99% dos itens sem mudar nada, o que isso indica? Como você descobriria se ela está realmente olhando?
3. No curador, a pausa da edição inteira vale o tempo de alguém toda semana? O que precisaria acontecer para tirá-la?
4. Quem deveria definir os limites da política de reembolso (R$ 100, R$ 2.000, confiança 0,9)? Com que dados?
5. Uma pausa pode durar dias. O que acontece com o mundo enquanto isso (a notícia envelhece, o cliente desiste)? Como lidar?

## Armadilhas comuns

- **Efeito externo antes do `interrupt()`:** ao retomar, o nó roda de novo, e o e-mail (ou o pagamento) sai duas vezes.
- **Chamada cara de LLM antes do `interrupt()`:** é repetida a cada retomada, inclusive quando você responde outras pausas em paralelo.
- **`interrupt()` dentro de `try/catch`:** o `catch` engole a pausa.
- **Aceitar a resposta humana sem validar:** um "sim" solto ou um valor absurdo vira aprovação.
- **Pedir aprovação de tudo:** a revisão vira carimbo (viés de automação) e o processo fica lento.
- **Pausa sem contexto:** "aprova?" sem o motivo da pausa, a fonte e a confiança.
- **Limiar de automação no chute, para sempre:** recalibre com o histórico de decisões.
- **Não registrar as decisões humanas:** sem elas, não há métricas nem dados para soltar a automação.
- **Pausar sem checkpointer persistente:** a pausa some se o processo morrer.

## Exercício (assíncrono, até a próxima aula)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** um assistente de reembolso com três níveis de autonomia (automático, aprovação, bloqueado), pausa com `interrupt()`, aprovar/editar/rejeitar e resposta inválida perguntando de novo. Feito = `pnpm -F @mentoria/ex07-hitl test` verde.
- **Desafio extra:** calibrar o limiar de automação com o histórico (curva cobertura × precisão). Feito = `pnpm -F @mentoria/ex07-hitl test:desafio` verde.

## Projeto final — etapa M7

Em [`projeto-final/`](../../projeto-final/README.md): o curador pausa em cada item incerto e na edição inteira; você revisa pelo terminal, quando quiser, e o grafo publica.

- Feito = `pnpm -F @mentoria/curador exec vitest run test/m07.test.ts` verde **e** uma edição revisada e publicada com `pnpm -F @mentoria/curador m07:edicao`.
- Traga para a Aula 8: o relatório com as métricas de revisão e a sua resposta a "o que fica automático na versão agendada?".

## Referências

- LangGraph.js — interrupts: https://docs.langchain.com/oss/javascript/langgraph/interrupts
- LangGraph.js — human-in-the-loop: https://docs.langchain.com/oss/javascript/langgraph/human-in-the-loop
- Feng, McDonald, Zhang (2025). *Levels of Autonomy for AI Agents*. https://arxiv.org/abs/2506.12469
- Parasuraman, Manzey (2010). *Complacency and Bias in Human Use of Automation: An Attentional Integration*. Human Factors 52(3). https://doi.org/10.1177/0018720810376055
- Anthropic (2024). *Building effective agents*. https://www.anthropic.com/engineering/building-effective-agents
