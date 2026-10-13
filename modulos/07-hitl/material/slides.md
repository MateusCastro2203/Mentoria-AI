---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 07 — Human-in-the-loop e automação
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 7 de 8**

# Human-in-the-loop e automação

Quando a máquina para e espera alguém decidir

<!--
Abertura (30 s). Na aula passada, a fila humana só anotava. Hoje, o grafo para de verdade e espera uma pessoa. E discutimos o que pode ser 100% automático.
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- dizer **onde** pôr uma pessoa no circuito
- usar os **níveis de autonomia**
- pausar com **`interrupt()`** e retomar com **`Command`**
- evitar as **armadilhas** da retomada
- **medir** a revisão e calibrar o limiar

</div>
<div class="card">

### Roteiro (40 min)

1. Por que HITL
2. `interrupt()` e `Command`
3. Demo: aprovação
4. O que automatizar e como medir

Depois: 15 min de discussão

</div>
</div>

---

<!-- _class: frase -->

Automatize o que dá para **desfazer**. Peça aprovação para o que **não dá**.

*Comece com mais revisão e vá soltando com dados.*

<!--
Frase da aula. Escreva no chat.
-->

---

<!-- _class: secao -->

# 1 · Por que HITL

Human-in-the-loop: humano no circuito

---

## Três motivos para chamar uma pessoa

<div class="cols-3">
<div class="card">

### Não volta atrás
Publicar, pagar, apagar, mandar mensagem ao cliente

</div>
<div class="card">

### Incerteza
Confiança **calibrada** (Aula 2) baixa → alguém olha

</div>
<div class="card">

### Responsabilidade
Negar um pedido, publicar em nome da empresa: alguém responde

</div>
</div>

<br>

**Piloto automático:** voa sozinho quase todo o tempo; decolagem, pouso e o imprevisto ficam com os pilotos.

<!--
0–4 min. Cada motivo com um exemplo do público. Pergunte: no seu trabalho, o que é irreversível?
-->

---

## O outro lado: viés de automação

<div class="cols">
<div>

A tendência de **aceitar a sugestão da máquina** e parar de procurar sinais contrários.

- Aparece em **iniciantes e especialistas**
- Em pessoas sozinhas e em **equipes**
- **Não some** com treinamento ou instruções

</div>
<div class="card">

### Então
- **Não** peça aprovação de tudo
- Mostre **por que** parou e a **evidência**
- **Meça** se a revisão é real

</div>
</div>

<p class="fonte">Parasuraman & Manzey (2010), Complacency and Bias in Human Use of Automation, Human Factors 52(3)</p>

<!--
4–7 min. Uma pessoa no circuito não é garantia. Se ela vê 100 itens por dia e a máquina quase sempre acerta, ela passa a aprovar sem olhar.
-->

---

## Cinco níveis de autonomia

| Nível | Papel da pessoa | O agente… |
|---|---|---|
| 1 | **Operadora** | ajuda quando é chamado |
| 2 | **Colaboradora** | planeja e executa junto |
| 3 | **Consultora** | toma a iniciativa e consulta nas decisões importantes |
| 4 | **Aprovadora** | trabalha sozinho; chama a pessoa num bloqueio ou para aprovar o que tem consequência |
| 5 | **Observadora** | é totalmente autônomo; a pessoa só acompanha |

**O nível é uma decisão de desenho**, separada da capacidade do modelo.

<p class="fonte">Feng, McDonald & Zhang (2025), Levels of Autonomy for AI Agents, arXiv:2506.12469</p>

<!--
7–10 min. No curador: itens incertos e a edição = nível 4. No exercício, o nível muda por pedido (R$ 40 → 5; R$ 350 → 4; R$ 5.000 → escala).
-->

---

<!-- _class: secao -->

# 2 · `interrupt()` e `Command`

<span class="demo">demo:armadilha</span>

---

## Pausar e retomar

<div class="cols">
<div>

```ts
.addNode("pedir_aprovacao", (estado) => {
  const resposta = interrupt({
    pedido: estado.pedido,
    analise: estado.analise,
  });            // ⏸ pausa e salva
  // … segue com a resposta
})
```

```ts
await grafo.invoke(
  new Command({ resume: { acao: "aprovar" } }),
  { configurable: { thread_id } })
```

</div>
<div class="card">

### O que acontece
1. O estado vai para o **checkpoint**
2. O valor da pausa aparece em `__interrupt__`
3. A resposta pode vir de **outro processo**, dias depois
4. `resume` vira o **retorno** do `interrupt()`

</div>
</div>

<!--
10–14 min. Ligar com a Aula 6: sem checkpointer não existe pausa longa. A "tela" pode ser o terminal, uma página ou um bot: só muda quem chama Command.
-->

---

## Aprovar, editar, rejeitar

| Resposta | No curador | No reembolso |
|---|---|---|
| **aprovar** | o item vai para a redação | paga o valor sugerido |
| **editar** | outra categoria ou título | paga outro valor |
| **rejeitar** | o item sai, com o motivo | nega o reembolso |

- **Valide a resposta com schema**, como a saída de um LLM: um "sim" solto não vira aprovação
- Resposta inválida → **pergunte de novo**, mostrando o erro
- **Registre** cada decisão: vira métrica e caso de avaliação

<!--
14–17 min. O exercício testa exatamente isso: editar com valor acima do pedido faz o grafo perguntar de novo.
-->

---

## As armadilhas da retomada

<div class="cols">
<div class="card">

### O nó roda de novo
Ao retomar, o nó reexecuta **desde o começo**. O que vem antes do `interrupt()` acontece outra vez.

`demo:armadilha`: **2 e-mails** no jeito errado, **1** no certo.

</div>
<div>

- Efeito externo e LLM caro: **depois** da pausa, ou num nó separado
- **Nada de `try/catch`** em volta do `interrupt()`
- Várias pausas em paralelo: responda com **`{ id: resposta }`**; dá para responder só algumas
- A ordem dos `interrupt()` num nó **importa**

</div>
</div>

<p class="fonte">docs.langchain.com/oss/javascript/langgraph/interrupts</p>

<!--
17–22 min. Rodar demo:armadilha (instantânea). No curador, a redação (LLM) do item revisado fica DEPOIS do interrupt; se ficasse antes, cada resposta a uma pausa refaria as redações das outras.
-->

---

<!-- _class: secao -->

# 3 · Demo: aprovação

<span class="demo">demo:aprovacao</span> · <span class="demo">m07:edicao</span>

---

## Três pedidos, três níveis

<div class="cols-3">
<div class="card">

### R$ 40
confiança 0,97

**automático**: paga sozinho

</div>
<div class="card">

### R$ 350
confiança 0,92

**aprovação**: ⏸ você decide

</div>
<div class="card">

### R$ 5.000
acima do limite

**escala**: ninguém paga aqui

</div>
</div>

<br>

A política é **código**: valor, confiança e sugestão → nível. Fácil de testar e de mudar.

<!--
22–25 min. Rodar demo:aprovacao e decidir ao vivo (edite para R$ 200, por exemplo). Mostre que o pagamento só acontece depois da resposta.
-->

---

## O curador pausado

```text
… selecionar ─┬─(Send)─► redigir ─────────────┐
              ├─(Send)─► revisao_humana ⏸ ────┼─► aprovar_edicao ⏸ ─► publicar → END
              └─ nada a fazer ────────────────┘
```

<div class="cols">
<div class="card">

### Antes da aula · `--nova`
~13 min de modelo até a 1ª pausa. Saí com **[s]**: o grafo ficou esperando no **arquivo**

</div>
<div class="card">

### Na aula · outro processo
**4 pausas** esperando: n40, n17, n13, n38 (todas por guardrail). Decidir → aprovar a edição → publicar

</div>
</div>

<!--
22–28 min. Rodar m07:edicao:solucao sem --nova. Mostrar o motivo de cada pausa: n40 tem link para endereço interno, n38 é a injeção da Aula 3, n13 a promessa sem detalhes da Aula 4, n17 confiança 0,65. Rejeitar os quatro (com motivo) e aprovar a edição. A retomada não chama o modelo para itens rejeitados: leva ~1 s.
-->

---

## Resultado da revisão

| Pausas | Intervenção | Override | Retomada |
|---|---|---|---|
| 5 (4 itens + a edição) | **13%** dos 32 avaliados | **80%** das decisões | **~1 s**, 0 chamadas ao modelo |

- 4 rejeitados com motivo; a edição de **9 itens** aprovada e publicada
- **Override de 80% é ruim?** Aqui, não: a pessoa **concordou com o guardrail** e discordou do classificador. Defina **contra qual proposta** você mede

<p class="fonte">qwen3:4b-instruct · m07:edicao:solucao · decisões do preparo da aula</p>

<!--
28–32 min. O ponto da métrica: os 4 itens pararam porque o guardrail desconfiou; o classificador queria publicar n40 com 0,98. Rejeitar = discordar do classificador, concordar com o guardrail. Uma métrica sem definição clara engana. E 87% passou direto sem ninguém olhar.
-->

---

<!-- _class: secao -->

# 4 · O que automatizar e como medir

---

## Três perguntas por etapa

1. **Dá para desfazer?** Rascunho, sugestão: sim. Pagamento, publicação: não
2. **Quanto custa um erro?** Um item fora do tema × um reembolso de R$ 5.000
3. **A confiança é calibrada e há histórico?** Sem dados, mais revisão; com dados, solte aos poucos

<br>

**Comece no nível 4 e suba com dados.** Cada decisão humana registrada vira histórico.

<!--
32–34 min. Volte à pergunta do relatório da M6: o que fica automático na versão agendada da Aula 8?
-->

---

## Três números

| Métrica | Conta | Indica |
|---|---|---|
| **Intervenção** | itens que precisaram de gente ÷ itens | o custo humano |
| **Override** | editou ou rejeitou ÷ decisões | quanto a pessoa discorda da máquina |
| **Tempo de decisão** | segundos por decisão | o custo de cada pausa |

- Intervenção alta + override baixo → hora de **automatizar mais**
- Override alto → a máquina erra; **melhore o modelo ou a política**
- Override ~0 + decisões em 2 s → **carimbo?** Teste com um caso que deveria ser rejeitado

<!--
34–37 min. Os números do relatório da demo estão no slide anterior.
-->

---

## Calibrar o limiar com dados

| Limiar | Cobertura (automático) | Precisão |
|---|---|---|
| 0,99 | 20% | 100% |
| 0,97 | 30% | 100% |
| 0,95 | 50% | **80%** |
| 0,90 | 70% | **86%** |
| 0,80 | 90% | 67% |

Precisão mínima de 85% → limiar **0,90**: 70% automático. **A precisão não cai em linha reta**: olhe a curva inteira.

<p class="fonte">Histórico fictício do desafio do exercício (10 pedidos)</p>

<!--
37–40 min. É o desafio do exercício. Ponte com a Aula 2: sem confiança calibrada, essa curva não vale nada.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos

---

## Para conversar

1. Que decisão do seu trabalho seria **100% automática**, qual pediria **aprovação** e qual **nunca** ficaria com uma máquina?
2. Quem aprova 99% sem mudar nada: o processo está bom ou a revisão virou **carimbo**? Como saber?
3. A pausa da edição inteira vale o tempo de alguém **toda semana**?
4. Quem define os limites da política (R$ 100, R$ 2.000, 0,9)? Com que dados?
5. Uma pausa pode durar **dias**. O que acontece com o mundo enquanto isso?

<!--
40–55 min. Respostas esperadas no guia do mentor.
-->

---

## Para a próxima aula

<div class="cols">
<div class="card">

### Exercício
Reembolso com níveis de autonomia

```bash
pnpm -F @mentoria/ex07-hitl test
```
Desafio: calibrar o limiar

</div>
<div class="card">

### Projeto final · M7
Revise e publique uma edição

```bash
pnpm -F @mentoria/curador m07:edicao
```
Traga as métricas de revisão

</div>
</div>

---

<!-- _class: capa -->
<!-- _paginate: false -->

Próxima aula · **Deploy e operação**

# E se o curador rodasse **sozinho**, toda semana, na nuvem?

Agendamento, rastreamento, custo por edição, evals no CI e rollback de prompt.

<!--
Gancho para a Aula 8.
-->
