# Módulo 04 — Skills vs. Agentes

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** Módulo 03 e o relatório da etapa M3 (`projeto-final/saidas/m03-relatorio.md`)
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. explicar o que é um prompt, uma skill, um agente e uma decisão estruturada, e o que muda entre eles (quem decide os passos, custo, previsibilidade, como avaliar);
2. empacotar conhecimento como skill no formato aberto Agent Skills e explicar a divulgação progressiva;
3. descrever o loop de um agente (escolher ação → executar ferramenta → devolver resultado → repetir) e as proteções que ele precisa;
4. aplicar um framework de decisão a casos novos e justificar a escolha;
5. comparar com dados um pipeline fixo e um agente fazendo o mesmo trabalho.

## Mensagem central

> Comece pelo mais simples que resolve. **Skill** empacota o *como*; **agente** decide *o que fazer a seguir*. Autonomia é cara e imprevisível: só vale quando o próximo passo realmente depende do que se descobre. E mesmo assim, **o agente propõe; o código decide**.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–8 | **Quatro abordagens** | Prompt, skill, agente, decisão estruturada. A pergunta que separa: **quem decide os passos?** Workflows (caminho no código) × agentes (o modelo dirige). | — |
| 8–20 | **Framework de decisão + tabela** | As 4 perguntas, na ordem: passos variáveis com ferramentas? decisão de conjunto fechado? reuso ou conhecimento extenso? senão, prompt. A tabela comparativa (custo, latência, previsibilidade, como avaliar). | — |
| 20–27 | **O curador como skill** | A pasta `skills/curar-noticia/`: `SKILL.md` (name, description, instruções) e `references/`. Divulgação progressiva: ~79 tokens sempre, ~400 ao ativar, ~220 sob demanda. A skill classificando. | `demo:skill` |
| 27–35 | **O curador como agente** | O loop com 4 ferramentas; a trajetória passo a passo; "o agente propõe, o código decide". O resultado da comparação: o agente leu menos, gastou mais e perdeu 3 notícias boas. | `demo:agente` |
| 35–40 | **Os 4 casos** | Apresentar os casos (sem resposta). A turma classifica na discussão. | `demo:casos` |
| 40–55 | **Discussão** | Classificar os 4 casos, depois as perguntas abaixo. | `demo:casos --revelar` |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M4. | — |

### Comandos das demos

Da raiz do repositório, com o modelo do `.env` rodando:

```bash
pnpm -F @mentoria/ex04-agentes demo:skill
pnpm -F @mentoria/ex04-agentes demo:agente                 # ~2 min
pnpm -F @mentoria/curador m04:comparar:solucao             # ANTES da aula (~6 min): pipeline × 2 execuções do agente
pnpm -F @mentoria/ex04-agentes demo:casos                  # offline: os 4 casos, para votar
pnpm -F @mentoria/ex04-agentes demo:casos --revelar        # com as respostas
```

### Notas para o mentor

Rodei com `qwen3:4b-instruct` (Ollama 0.34.4), 40 notícias em 10 fontes, gabarito de 27 publicáveis (relevantes com fonte `https`).

| | Selecionadas | Precisão | Recall | Chamadas ao modelo | Tempo | Fontes lidas |
|---|---|---|---|---|---|---|
| Pipeline + skill | 27 | 100% | 100% | 40 | 106 s | 10 |
| Agente (2 execuções) | 24 | 100% | 89% | 43 (12 do agente + 31 avaliações) | 114–132 s | 9 |

- **O agente pulou a fonte certa:** "variedades" (entretenimento, esportes), onde não há nada relevante. Essa é a promessa do agente: economizar escolhendo o que ler.
- **Mas perdeu notícias e não economizou:** leu 9 fontes (35 notícias) e montou **uma só** chamada de `avaliarNoticias` com 31 ids, esquecendo 4 delas (n21, n22, n23 e n39; as três primeiras eram publicáveis). É um erro de omissão ao montar uma lista longa, a mesma família do "perdido no meio" da Aula 1. No total, fez mais chamadas que o pipeline e levou mais tempo.
- **Trajetória igual nas duas execuções** (temperature 0). Não conte com isso em geral: mudar o modelo, o prompt ou as fontes muda o caminho.
- **O código não precisou recusar nada:** o agente só entregou ids que avaliou como "publicar". Os testes cobrem o caso em que ele entrega id inventado.
- **A skill resolveu a n13:** a notícia que passou pelos guardrails na M3 ("promete nunca errar") agora vai para revisão. O `SKILL.md` tem um exemplo de "promessa sem detalhes" e a regra "na dúvida, baixe a confiança". Mudança de prompt medida, como na Aula 3.
- **Conclusão para a turma:** para esta tarefa (poucas fontes, todas baratas de ler, critério fixo), o framework diz **pipeline + skill**, e os números concordam. O agente faria sentido com centenas de fontes caras, quando escolher o que ler economiza de verdade, ou quando o próximo passo depende do que se descobre (como no caso do incidente).

## Os 4 casos da aula

Para a turma classificar na discussão. Respostas e justificativas em [`exercicio/src/casos.ts`](exercicio/src/casos.ts) e em [`conceitos.md`](conceitos.md#quatro-casos-os-da-aula).

1. **Reescrever um comunicado:** o RH precisa reescrever, uma única vez, um comunicado sobre a mudança de horário, em linguagem mais simples.
2. **Rotear tickets de suporte:** uma loja on-line recebe ~30 mil tickets por dia para 8 filas, com os duvidosos indo para uma pessoa.
3. **Revisar contratos com o checklist jurídico:** checklist de 40 itens e cláusulas-modelo, usado por vários times no chat interno e no editor de código.
4. **Investigar um incidente de produção:** o tempo de resposta de uma API subiu; é preciso olhar logs, métricas e deploys até achar a causa provável.

## Perguntas para discussão (15 min)

Primeiro os 4 casos (votação rápida, depois `demo:casos --revelar`). Depois:

1. O agente do curador leu menos fontes e mesmo assim gastou mais. Em que cenário ele ganharia do pipeline?
2. Que caso do seu trabalho parece pedir um agente? Ele passa na primeira pergunta do framework (passos variáveis **e** ferramentas)?
3. Uma skill e um prompt longo num arquivo: qual a diferença na prática?
4. "O agente propõe; o código decide." O que o código deveria checar antes de aceitar o resultado de um agente no seu caso?
5. Como você avaliaria um agente, além de olhar a resposta final?

## Armadilhas comuns

- **Começar pelo agente** porque é o mais interessante. Comece pelo prompt e suba de nível só com motivo.
- **Chamar de agente um pipeline com ferramentas.** Se o caminho está no código, é um workflow (e isso é bom).
- **Description vaga na skill** ("ajuda com notícias"): a skill nunca é ativada. Diga o que faz **e quando usar**.
- **SKILL.md gigante:** mova o detalhe para `references/` e aponte para ele.
- **Ferramenta que lança exceção** em vez de devolver uma mensagem de erro: o agente não consegue se corrigir.
- **Confiar no que o agente entrega** sem validar no código.
- **Agente sem limite** de passos e de custo.
- **Avaliar só a resposta final.** Num agente, a trajetória (o que leu, o que pulou, quanto gastou) também é resultado.

## Exercício (assíncrono, até a próxima aula)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** o framework de decisão como função (`recomendarAbordagem`, testada com os 4 casos) e um agente escrito à mão (`executarAgente`: o loop com ferramentas, erros como evento e limite de passos). Feito = `pnpm -F @mentoria/ex04-agentes test` verde.
- **Desafio extra:** proteções do loop: detecção de repetição e orçamento de custo. Feito = `pnpm -F @mentoria/ex04-agentes test:desafio` verde.

## Projeto final — etapa M4

Em [`projeto-final/`](../../projeto-final/README.md): a skill `skills/curar-noticia/`, o leitor de skills, as ferramentas do agente e o agente.

- Feito = `pnpm -F @mentoria/curador exec vitest run test/m04.test.ts` verde **e** `pnpm -F @mentoria/curador m04:comparar` gerando `saidas/m04-comparacao.md`.
- Traga para a Aula 5: o relatório. No próximo módulo o curador vira vários agentes conversando por MCP.

## Referências

- Anthropic (2024). *Building effective agents*. https://www.anthropic.com/engineering/building-effective-agents
- Anthropic (2025). *Equipping agents for the real world with Agent Skills*. https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Agent Skills — especificação. https://agentskills.io/specification
- Yao et al. (2022). *ReAct: Synergizing Reasoning and Acting in Language Models*. https://arxiv.org/abs/2210.03629
- AI SDK — agentes: https://ai-sdk.dev/docs/agents/overview · controle do loop: https://ai-sdk.dev/docs/agents/loop-control
