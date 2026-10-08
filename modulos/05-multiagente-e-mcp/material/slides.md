---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 05 — Sistemas multiagênticos e MCP
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 5 de 8**

# Sistemas multiagênticos e MCP

Times de agentes e uma tomada universal para ferramentas

<!--
Abertura (30 s). Na aula passada, um agente. Hoje: um time de agentes, e um protocolo padrão para eles acessarem o mundo.
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- reconhecer **pipeline, supervisor, hierárquico, handoff** e **gerador + revisor**
- dizer quando multiagente é **exagero**
- explicar **MCP**: host, cliente, servidor
- diferenciar **tools, resources e prompts**
- escrever e conectar um **servidor MCP local**

</div>
<div class="card">

### Roteiro (40 min)

1. Padrões multiagente
2. Quando é exagero
3. MCP
4. Demo: o time do curador

Depois: 15 min de discussão

</div>
</div>

---

<!-- _class: frase -->

Divida em vários agentes só quando as partes forem **independentes**.

*E ligue todos ao mundo por um protocolo padrão: o servidor não precisa saber quem vai usá-lo.*

<!--
Frase da aula. Escreva no chat.
-->

---

<!-- _class: secao -->

# 1 · Padrões multiagente

Como ligar os agentes

---

## Cinco formas de organizar um time

| Padrão | Como funciona | Exemplo |
|---|---|---|
| **Pipeline** | cada um faz uma etapa e passa adiante | coletor → classificador → redator → revisor |
| **Supervisor** | um agente central escolhe quem trabalha a cada rodada | pesquisador-chefe distribuindo subtarefas |
| **Hierárquico** | supervisores de supervisores | gerente com times de pesquisa e redação |
| **Handoff** | quem atende passa a conversa para outro | triagem → financeiro → técnico |
| **Gerador + revisor** | um gera, outro critica, até aprovar | redator ⇄ revisor |

<!--
0–8 min. Analogia da cozinha: linha de montagem (pipeline), chef (supervisor), chefs de praça (hierárquico), garçom passando o pedido para o confeiteiro (handoff), chef provando e devolvendo o prato (gerador + revisor).
-->

---

## O time do curador

```text
           MCP fontes (RSS)                                   MCP edição
                 │                                                 ▲
 coletor ──► classificador ──► redator ⇄ revisor ──► publicar_edicao
 (agente)    (skill+guardrails) (texto)   (código+juiz)
```

- Orquestração = **pipeline em código** (um workflow)
- Só o **coletor** é agente (escolhe as fontes)
- Redator ⇄ revisor = **gerador + revisor**, até 2 tentativas

<!--
8–12 min. Ligar com a Aula 4: só é agente onde há escolha de passos (o coletor). O resto são papéis com uma tarefa só, chamados pelo código.
-->

---

<!-- _class: secao -->

# 2 · Quando é exagero

---

## Duas visões, um dia de diferença

<div class="cols">
<div class="card">

### Anthropic (13/jun/2025)
Agente-líder + subagentes **em paralelo** na pesquisa: **+90%** nas avaliações internas.

Mas **~15× mais tokens** que um chat. Ruim quando todos precisam do mesmo contexto, como em programação.

</div>
<div class="card">

### Cognition (12/jun/2025)
"**Não construa multiagentes**": em paralelo, sem o contexto um do outro, os agentes tomam **decisões conflitantes**.

Padrão: um agente, em sequência.

</div>
</div>

<br>

**Ponto em comum:** compensa quando as partes são **independentes** e podem rodar em paralelo.

<p class="fonte">Anthropic, How we built our multi-agent research system · Cognition, Don't Build Multi-Agents</p>

<!--
12–17 min. Perguntas antes de dividir: as partes são independentes? cada papel precisa de contexto, ferramentas ou permissões diferentes? o ganho paga o custo? um pipeline em código não resolve?
-->

---

<!-- _class: secao -->

# 3 · MCP

Model Context Protocol

---

## Uma tomada universal

<div class="cols">
<div>

- **Host:** a aplicação com LLM (chat, editor, o nosso time)
- **Cliente:** o conector dentro do host, um por servidor
- **Servidor:** oferece ferramentas, dados e prompts

Mensagens em **JSON-RPC 2.0**. Inspiração: o *Language Server Protocol* dos editores.

</div>
<div class="card">

### Transportes
**stdio:** subprocesso local; nada de `console.log` em stdout

**Streamable HTTP:** servidor remoto

</div>
</div>

<p class="fonte">modelcontextprotocol.io/specification/2026-07-28</p>

<!--
17–21 min. Analogia: tomada. Quem faz o aparelho (servidor) não sabe em que casa (aplicação) ele vai ser ligado. O mesmo servidor de fontes serve o nosso time, um agente de código e o MCP Inspector.
-->

---

## O que um servidor oferece

| | Quem decide usar | No projeto |
|---|---|---|
| **Tools** | o **modelo** | `listar_fontes`, `ler_fonte`, `publicar_edicao` |
| **Resources** | a **aplicação** | `noticia://{id}`, `edicao://ultima` |
| **Prompts** | o **usuário** | `classificar_noticia` |

Anotações nas tools: `readOnlyHint`, `destructiveHint`, `idempotentHint`. São **dicas**, não garantias.

<!--
21–24 min. A diferença tool × resource: a mesma informação pode estar nos dois; o que muda é QUEM decide buscar. Tool: o modelo decide no meio do raciocínio. Resource: o código da aplicação lê e põe no contexto.
-->

---

## Ao vivo: o protocolo <span class="demo">demo:protocolo</span>

```text
→ tools/list
← { tools: [ { name: "buscar_termo", inputSchema: {…} }, … ] }
→ tools/call  { name: "buscar_termo", arguments: { termo: "blockchain" } }
← { content: [ "termo não encontrado: blockchain" ], isError: true }
```

<div class="cols">
<div class="card">

### Era 2025-11-25
`initialize` abre uma sessão. Padrão do cliente do SDK.

</div>
<div class="card">

### Era 2026-07-28
**Sem sessão**: cada requisição leva a versão no `_meta`.

</div>
</div>

<!--
24–28 min. Rodar a demo (offline, instantânea). Mostrar: erro de ferramenta é resposta, não exceção. Na segunda parte, por stdio em modo auto, não há initialize. Para tools/resources/prompts, as duas eras se comportam igual.
-->

---

## Segurança

- **Menor privilégio:** o coletor só recebe `listar_fontes` e `ler_fonte`
- **Valide o que vem do modelo:** `ler_fonte("../../etc/passwd")` → **erro**, nenhum arquivo lido
- **Saída de servidor é dado não confiável:** pode trazer injeção (Aula 3)
- **Ferramenta que muda algo** → aprovação humana (Aula 7)
- Só instale servidores de **fontes confiáveis**

<p class="fonte">Princípios da especificação: consentimento do usuário, privacidade dos dados, cuidado com ferramentas.</p>

<!--
28–30 min. O teste do projeto tenta exatamente esse ataque de caminho de arquivo.
-->

---

<!-- _class: secao -->

# 4 · O time do curador

<span class="demo">demo:time</span>

---

## Resultado do time

| Papel | Chamadas | Tempo |
|---|---|---|
| Coletor (agente, MCP) | 1 · 12 passos | 69 s |
| Classificador | 32 | 97 s |
| Redator | 14 | 60 s |
| Revisor (código + juiz) | 14 | **616 s** |

- **Gargalo:** o juiz do revisor (73% do tempo), não o agente
- **9 de 10** aprovados; **n10** reprovada 2× ("reduz" × "mede menos")
- Edição **sem** regulação nem mercado: "top 10 por confiança" + empates

<p class="fonte">qwen3:4b-instruct · m05:edicao:solucao · ~14 min no total</p>

<!--
30–40 min. Mostrar a edição gravada (saidas/edicao.md). Três pontos: o custo estava no revisor (juiz verboso), o gerador + revisor funcionou (e o juiz pode ser rigoroso demais), e um viés editorial surgiu sem ninguém pedir. Feche com: precisava de um time? As etapas são sequenciais e dependentes; o ganho foi organização e permissões separadas, não paralelismo.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos

---

## Para conversar

1. O curador precisava de **quatro** agentes? O que o time ganhou em relação ao pipeline da Aula 4?
2. Um processo do seu time lembra qual padrão: pipeline, supervisor, handoff ou gerador + revisor?
3. Por que `buscar_termo` é tool e `glossario://{termo}` é resource, se devolvem a mesma informação?
4. Que servidor MCP você gostaria de ter no seu trabalho? Que tools ele teria e quais seriam só leitura?
5. O que pode dar errado se você instalar um servidor MCP de uma fonte desconhecida?

<!--
40–55 min. Respostas esperadas no guia do mentor.
-->

---

## Para a próxima aula

<div class="cols">
<div class="card">

### Exercício
Um servidor MCP (glossário) e os padrões como funções

```bash
pnpm -F @mentoria/ex05-mcp test
```
Desafio: handoff com detecção de ping-pong

</div>
<div class="card">

### Projeto final · M5
Servidores de fontes e edição, adaptador e o time

```bash
pnpm -F @mentoria/curador m05:edicao
```
Traga a edição e o relatório

</div>
</div>

---

<!-- _class: capa -->
<!-- _paginate: false -->

Próxima aula · **Orquestração com LangGraph.js**

# E se o pipeline do time virasse um **grafo**, com estado salvo e caminhos que dependem da confiança?

Checkpoint para retomar de onde parou e arestas condicionais.

<!--
Gancho para a Aula 6.
-->
