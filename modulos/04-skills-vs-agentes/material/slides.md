---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 04 — Skills vs. Agentes
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 4 de 8**

# Skills vs. Agentes

Quando empacotar, quando dar autonomia

<!--
Abertura (30 s). Até aqui o curador seguia um caminho fixo no código. Hoje: empacotar o conhecimento dele (skill) e dar autonomia a ele (agente). E decidir quando cada coisa vale a pena.
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- diferenciar **prompt, skill, agente** e **decisão estruturada**
- empacotar conhecimento como **skill**
- descrever o **loop** de um agente e as proteções
- aplicar um **framework de decisão**
- comparar **pipeline × agente** com dados

</div>
<div class="card">

### Roteiro (40 min)

1. Quatro abordagens
2. Framework de decisão
3. O curador como skill
4. O curador como agente
5. Os 4 casos

Depois: 15 min de discussão

</div>
</div>

---

<!-- _class: frase -->

Comece pelo **mais simples** que resolve.

*Skill empacota o como; agente decide o que fazer a seguir.* Autonomia é cara: só vale quando o próximo passo depende do que se descobre.

<!--
Frase da aula. Escreva no chat.
-->

---

<!-- _class: secao -->

# 1 · Quatro abordagens

Quem decide os passos?

---

## Prompt, skill, agente, decisão

| | Prompt | Skill | Agente | Decisão estruturada |
|---|---|---|---|---|
| O que é | um pedido bem escrito | instruções + referências numa pasta reutilizável | loop: o modelo escolhe a ação e usa ferramentas | escolha tipada com confiança |
| Quem decide os passos | você | você | **o modelo** | você |
| Custo | 1 chamada | 1 chamada + contexto | **variável** | 1 chamada pequena |
| Previsibilidade | alta | alta | **baixa** | alta |
| Avaliar | resposta | resposta | resposta **e trajetória** | resposta + calibração |

<!--
0–5 min. A pergunta que separa: quem decide os passos? Se é o código, é um workflow (mesmo que use ferramentas). Se é o modelo, é um agente.
-->

---

## Workflow × agente

<div class="cols">
<div class="card">

### Workflow
LLMs e ferramentas orquestrados por **caminhos definidos em código**.

*Encadear prompts, rotear, paralelizar, orquestrador-trabalhadores, avaliador-otimizador.*

</div>
<div class="card">

### Agente
O LLM **dirige o próprio processo** e o uso de ferramentas.

*Troca latência e custo por desempenho em tarefas abertas.*

</div>
</div>

<br>

> "Otimizar chamadas únicas com recuperação e exemplos geralmente basta."

<p class="fonte">Anthropic (2024), Building effective agents</p>

<!--
5–8 min. A citação é a recomendação central do texto: comece simples.
-->

---

<!-- _class: secao -->

# 2 · Framework de decisão

---

## Quatro perguntas, nesta ordem

1. **Passos variáveis e precisa de ferramentas?** O próximo passo depende do que se descobre → **agente**
2. **A saída é uma decisão de conjunto fechado, com passos fixos?** → **decisão estruturada**
3. **É reutilizado ou depende de conhecimento extenso?** → **skill**
4. **Senão** → **prompt**

<br>

E sempre: **alto volume** pesa a favor do mais barato e previsível.

<p class="mini">É uma heurística para começar pelo simples, não uma lei. No exercício, vira código.</p>

<!--
8–14 min. Ressaltar a ordem: uma decisão que precisa investigar com ferramentas é agente (regra 1 vem antes).
-->

---

## O que muda ao virar agente

| | Pipeline | Agente |
|---|---|---|
| Custo | fixo | depende da trajetória |
| Cobertura | lê tudo | pode pular (economiza ou perde) |
| Trajetória | sempre igual | pode mudar |
| Falhas novas | — | parar sem entregar, repetir chamadas, inventar ids, seguir injeção vinda das ferramentas |
| Avaliar | resultado | resultado **e** caminho |

<!--
14–20 min. Proteções: limite de passos, orçamento, detectar repetição, validar no código o que o agente entrega, registrar a trajetória, humano antes de ações irreversíveis.
-->

---

<!-- _class: secao -->

# 3 · O curador como skill

---

## Uma skill é uma pasta <span class="demo">demo:skill</span>

<div class="cols">
<div>

```text
skills/curar-noticia/
├── SKILL.md
└── references/
    └── guia-de-rotulagem.md
```

```yaml
---
name: curar-noticia
description: Classifica uma notícia para
  a newsletter... Use ao triar, filtrar ou
  categorizar notícias sobre IA.
---
```

</div>
<div>

- `name` = nome da pasta
- `description`: **o que faz e quando usar**
- corpo: as instruções
- detalhe em `references/`

Formato aberto (Agent Skills), adotado por várias ferramentas de agentes.

</div>
</div>

<p class="fonte">agentskills.io/specification · Anthropic (2025), Equipping agents… with Agent Skills</p>

<!--
20–23 min. Mostrar a pasta de verdade. A description é a parte mais importante: é o que o agente lê para decidir se ativa a skill.
-->

---

## Divulgação progressiva

<div class="cols-3">
<div class="card">

### Sempre
`name` + `description`

**~79 tokens**

</div>
<div class="card">

### Ao ativar
corpo do `SKILL.md`

**~400 tokens**

</div>
<div class="card">

### Sob demanda
`references/guia…`

**~220 tokens**

</div>
</div>

<br>

Como a lombada de um manual: você só abre se o título bater com o problema.

**Bônus medido:** com a skill, a **n13** (a que escapou na Aula 3) foi para revisão.

<!--
23–27 min. A n13 ("promete nunca errar") passou pelos guardrails na M3. A skill tem um exemplo de "promessa sem detalhes" e a regra de baixar a confiança na dúvida: agora ela vai para revisão. Mudança medida, não no olho.
-->

---

<!-- _class: secao -->

# 4 · O curador como agente

---

## O loop <span class="demo">demo:agente</span>

```text
objetivo → [modelo escolhe a ação] → executa a ferramenta → resultado volta → …
           até: chamar entregarSelecao · atingir o limite de passos
```

<div class="cols">
<div>

**Ferramentas**
- `listarFontes`
- `lerFonte(fonte)`
- `avaliarNoticias(ids)` → skill + guardrails
- `entregarSelecao(ids)`

</div>
<div class="card">

### O agente propõe; o código decide
Id não avaliado ou não publicável entregue pelo agente → **recusado**.

</div>
</div>

<!--
27–30 min. Rodar a demo (~2 min) ou mostrar a trajetória: listar → ler 9 fontes → avaliar 31 ids de uma vez → entregar.
-->

---

## Pipeline × agente: os números

| | Selecionadas | Precisão | Recall | Chamadas | Tempo | Fontes |
|---|---|---|---|---|---|---|
| Pipeline + skill | 27 | 100% | **100%** | **40** | **106 s** | 10 |
| Agente | 24 | 100% | 89% | 43 | 114–132 s | **9** |

- Pulou "variedades": **escolha certa**
- Mas montou **uma** lista de 31 ids e **esqueceu 4** das 35 que leu (3 publicáveis)
- Mesma trajetória nas duas execuções (temperature 0)

<p class="fonte">40 notícias, 10 fontes, 27 publicáveis · qwen3:4b-instruct · m04:comparar:solucao</p>

<!--
30–35 min. Conclusão honesta: aqui o agente não ganhou. Poucas fontes, baratas de ler, critério fixo: o framework diria pipeline + skill. O agente faria sentido com centenas de fontes caras, ou quando o próximo passo depende do que se descobre. O esquecimento de itens em lista longa é parente do "perdido no meio" da Aula 1.
-->

---

<!-- _class: secao -->

# 5 · Os 4 casos

Prompt, skill, agente ou decisão estruturada? <span class="demo">demo:casos</span>

---

## Classifique

1. **Comunicado:** reescrever **uma vez** um comunicado do RH em linguagem simples
2. **Tickets:** rotear **30 mil tickets/dia** para 8 filas, duvidosos para uma pessoa
3. **Contratos:** revisar com o **checklist jurídico** de 40 itens, usado por vários times em ferramentas diferentes
4. **Incidente:** a API ficou lenta; olhar **logs, métricas e deploys** até achar a causa

<!--
35–40 min. Ler os casos. Não revelar. A votação acontece na discussão.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos

---

## Respostas <span class="demo">demo:casos --revelar</span>

| Caso | Resposta | Por quê |
|---|---|---|
| Comunicado | **prompt** | texto, uma vez, sem dados externos |
| Tickets | **decisão estruturada** | conjunto fechado, passos fixos, alto volume, confiança decide o fallback |
| Contratos | **skill** | passos fixos, conhecimento extenso que precisa ser igual em todo lugar |
| Incidente | **agente** | o próximo passo depende do que o anterior revelou; cada passo usa ferramenta |

<!--
40–47 min. Revelar depois da votação. Se alguém discordar, ótimo: peça o argumento. O framework é heurística.
-->

---

## Para conversar

1. Em que cenário o agente do curador ganharia do pipeline?
2. Que caso do seu trabalho parece pedir um agente? Ele passa na 1ª pergunta?
3. Skill × prompt longo num arquivo: qual a diferença na prática?
4. O que o código deveria checar antes de aceitar o resultado de um agente no seu caso?
5. Como avaliar um agente além da resposta final?

<!--
47–55 min. Respostas esperadas no guia do mentor.
-->

---

## Para a próxima aula

<div class="cols">
<div class="card">

### Exercício
O framework como função e um agente **sem biblioteca**

```bash
pnpm -F @mentoria/ex04-agentes test
```
Desafio: repetição e orçamento

</div>
<div class="card">

### Projeto final · M4
A skill, as ferramentas e o agente

```bash
pnpm -F @mentoria/curador m04:comparar
```
Traga o relatório

</div>
</div>

---

<!-- _class: capa -->
<!-- _paginate: false -->

Próxima aula · **Sistemas multiagênticos e MCP**

# E se o curador fosse um **time**: coletor, classificador, redator e revisor?

E as ferramentas viessem de um servidor padrão, que qualquer agente consegue usar?

<!--
Gancho para a Aula 5.
-->
