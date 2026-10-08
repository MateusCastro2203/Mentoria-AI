# Módulo 04 — Conceitos (leitura de apoio)

Até aqui, o curador era um **pipeline fixo**: para cada notícia, o código chamava o modelo do mesmo jeito. Este módulo faz duas transformações e pergunta o que muda em cada uma:

1. empacotar o conhecimento do curador como uma **skill** reutilizável;
2. transformar o curador num **agente**, que decide sozinho quais fontes ler e o que avaliar.

No fim, o **framework de decisão** junta tudo: quando basta um prompt, quando empacotar como skill, quando construir um agente e quando usar uma decisão estruturada.

---

## 1. As quatro abordagens

| | Prompt | Skill | Agente | Decisão estruturada |
|---|---|---|---|---|
| **O que é** | um pedido bem escrito, numa chamada | instruções + referências + scripts empacotados numa pasta reutilizável | um loop: o modelo escolhe a próxima ação, usa ferramentas e decide quando parar | uma escolha tipada de um conjunto fechado, com confiança (Módulo 2) |
| **Quem decide os passos** | você | você (a skill descreve como fazer) | **o modelo** | você |
| **Ferramentas** | não | opcional (scripts) | sim, é o centro | não |
| **Custo e latência** | 1 chamada | 1 chamada + o contexto da skill | variável: N passos + o que as ferramentas chamam | 1 chamada, saída pequena |
| **Previsibilidade** | alta | alta | **baixa** (a trajetória muda) | alta |
| **Como avaliar** | eval da resposta | eval da resposta | eval da resposta **e da trajetória** | eval + calibração |
| **Bom para** | tarefa pontual de texto | conhecimento procedural reutilizado em vários lugares | tarefas abertas, em que o próximo passo depende do que se descobre | classificar, rotear, pontuar em volume |

Elas se combinam: um agente pode **usar** uma skill; uma skill pode **conter** uma decisão estruturada; um pipeline fixo pode chamar um agente só para o pedaço aberto.

---

## 2. Skills

### O formato

Uma **skill** é uma pasta com um `SKILL.md`: um cabeçalho YAML com `name` e `description`, seguido das instruções em Markdown. Pastas opcionais guardam o resto: `references/` (documentação), `scripts/` (código executável) e `assets/` (modelos, dados). A Anthropic lançou o formato em outubro de 2025 ([post](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)) e o publicou como padrão aberto em dezembro de 2025 ([especificação](https://agentskills.io/specification)). Outras ferramentas de agentes adotaram o mesmo formato.

Regras principais da especificação:

- `name`: até 64 caracteres, só minúsculas, números e hífens, **igual ao nome da pasta**;
- `description`: até 1024 caracteres, dizendo **o que a skill faz e quando usar**;
- corpo do `SKILL.md`: recomenda-se menos de 500 linhas; o detalhe vai para arquivos referenciados.

### Divulgação progressiva

Um agente não lê todas as skills inteiras. Ele carrega em camadas:

1. **sempre:** só `name` + `description` de cada skill (~100 tokens cada);
2. **ao ativar:** o corpo do `SKILL.md`, quando a tarefa combina com a descrição;
3. **sob demanda:** os arquivos de `references/`, `scripts/`, `assets/`, só se precisar.

Por isso a `description` é a parte mais importante: se ela não tiver as palavras que aparecem nos pedidos, a skill nunca é ativada. **Analogia:** a lombada de um manual na estante. Você só abre o manual se o título bater com o problema, e só lê o apêndice se precisar.

### Quando empacotar como skill

- o mesmo conhecimento é usado **de novo**, por pessoas ou ferramentas diferentes;
- há **conhecimento específico extenso** (checklists, guias, cláusulas, exemplos) que não cabe num prompt de uma linha;
- você quer **versionar** e revisar esse conhecimento como código.

Skill **não** dá autonomia: ela diz **como** fazer uma tarefa. Quem decide **quando** usá-la é a pessoa ou o agente.

No projeto, `skills/curar-noticia/` tem as instruções de classificação no `SKILL.md` e as definições das categorias em `references/guia-de-rotulagem.md`. O nosso código carrega a pasta e usa como prompt; a mesma pasta pode ser instalada num agente de código compatível.

---

## 3. Agentes

### O loop

Um **agente** é um LLM num loop com ferramentas:

```
objetivo → [modelo escolhe a próxima ação] → executa a ferramenta → resultado volta para o modelo → …
                                                         até: responder · chamar "entregar" · atingir o limite
```

A diferença para um pipeline não é usar ferramentas; é **quem decide os passos**. A Anthropic separa os dois casos ([Building effective agents, 2024](https://www.anthropic.com/engineering/building-effective-agents)):

- **workflows:** LLMs e ferramentas orquestrados por **caminhos definidos em código**;
- **agentes:** o LLM **dirige o próprio processo** e o uso de ferramentas.

A recomendação deles é começar simples ("otimizar chamadas únicas com recuperação e exemplos geralmente basta") e só usar agentes quando a troca vale a pena: agentes trocam **latência e custo** por desempenho em tarefas abertas. O mesmo texto lista padrões de workflow que resolvem muita coisa sem autonomia: encadeamento de prompts, roteamento, paralelização, orquestrador-trabalhadores e avaliador-otimizador.

A ideia de intercalar raciocínio e ação num loop ficou conhecida com o **ReAct** ([Yao et al., 2022](https://arxiv.org/abs/2210.03629)). Hoje, provedores e bibliotecas implementam esse loop com *tool calling*: o modelo devolve uma chamada estruturada (`{ ferramenta, entrada }`), o código executa e devolve o resultado. No projeto, `gerarComFerramentas` (`@mentoria/llm`) usa o loop do AI SDK; no exercício, você escreve o loop à mão.

### Ferramentas bem desenhadas

As ferramentas são a interface entre o agente e o mundo. Boas práticas (o "ACI", *agent-computer interface*, do mesmo texto da Anthropic):

- **descrição clara** do que faz e de cada parâmetro: é o que o modelo lê para decidir;
- **entrada validada** por schema;
- **erros como mensagem**, não como exceção: "fonte desconhecida: X" deixa o modelo se corrigir;
- **idempotência:** chamar duas vezes não deve fazer estrago (no projeto, avaliar a mesma notícia de novo devolve a avaliação guardada);
- **menor privilégio:** o agente só recebe as ferramentas de que precisa. Ferramentas que **mudam** algo (publicar, apagar, pagar) pedem aprovação humana (Módulo 7).

### O que muda ao virar agente

| | Pipeline com skill | Agente |
|---|---|---|
| Custo | fixo e previsível | variável: depende da trajetória |
| Cobertura | lê tudo | pode pular fontes (economiza, mas pode perder notícias) |
| Trajetória | sempre a mesma | pode mudar entre execuções |
| Novos modos de falha | — | parar sem entregar, repetir a mesma chamada, inventar ids, ler a fonte errada, seguir instruções vindas das ferramentas (injeção) |
| Avaliação | resultado | resultado **e** trajetória (quais ferramentas, quantos passos, custo) |

### Proteções

- **limite de passos** e **orçamento** de custo;
- **detecção de repetição** (a mesma chamada várias vezes seguidas);
- **validação no código** do que o agente entrega. No projeto, "o agente propõe; o código decide": um id que o agente não avaliou, ou cuja avaliação não foi "publicar", é recusado;
- **registro** de toda a trajetória, para depurar e avaliar;
- **humano no meio** antes de ações irreversíveis.

---

## 4. O framework de decisão

Responda, para o problema, nesta ordem:

1. **Os passos são variáveis e precisam de ferramentas?** (O próximo passo depende do que se descobre: investigar, pesquisar, navegar.) → **agente**, com limites e validação.
2. **A saída é uma decisão de um conjunto fechado, com passos fixos?** (Classificar, rotear, pontuar, aprovar.) → **decisão estruturada** com confiança.
3. **É reutilizado ou depende de conhecimento específico extenso?** → **skill**.
4. **Senão** → **prompt**.

E, em qualquer caso: **alto volume** pesa a favor do que é mais barato e previsível.

É uma heurística, não uma lei. Ela serve para **começar pelo mais simples** e só subir de nível quando houver um motivo que você consegue dizer em voz alta. O exercício transforma essas perguntas em código.

### Quatro casos (os da aula)

| Caso | Resposta | Por quê |
|---|---|---|
| Reescrever **uma vez** um comunicado do RH em linguagem simples | **prompt** | texto para pessoas, pontual, sem dados externos |
| Rotear **30 mil tickets/dia** para 8 filas, duvidosos para humano | **decisão estruturada** | escolha de conjunto fechado, passos fixos, alto volume, confiança decide o fallback |
| Revisar contratos com o **checklist jurídico**, usado por vários times em ferramentas diferentes | **skill** | passos fixos, mas conhecimento extenso que precisa ser o mesmo em todo lugar |
| **Investigar um incidente** olhando logs, métricas e deploys | **agente** | o próximo passo depende do que o anterior revelou; cada passo usa uma ferramenta |

---

## Referências

- Anthropic (2024). *Building effective agents*. https://www.anthropic.com/engineering/building-effective-agents
- Anthropic (2025). *Equipping agents for the real world with Agent Skills*. https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Agent Skills — especificação. https://agentskills.io/specification · repositório: https://github.com/agentskills/agentskills
- Yao et al. (2022). *ReAct: Synergizing Reasoning and Acting in Language Models*. https://arxiv.org/abs/2210.03629
- AI SDK — agentes: https://ai-sdk.dev/docs/agents/overview · controle do loop: https://ai-sdk.dev/docs/agents/loop-control
