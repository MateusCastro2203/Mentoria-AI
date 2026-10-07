---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 01 — Como LLMs funcionam
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 1 de 8**

# Como LLMs funcionam

Tokens, sampling, context window e alucinação

<!--
Abertura (30 s). Confirmar que todo mundo rodou o pnpm verificar. Quem não rodou acompanha pela tela hoje e resolve o setup até a próxima aula.
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- explicar **por que** o mesmo prompt dá respostas diferentes
- estimar **tokens e custo** de uma chamada
- dizer o que acontece quando a conversa **não cabe** no contexto
- explicar **por que** o modelo alucina

</div>
<div class="card">

### Roteiro (40 min)

1. Gancho
2. Tokens
3. Um token por vez + sampling
4. Contexto, custo e latência
5. Alucinação
6. Trailer da leitura de apoio

Depois: 15 min de discussão

</div>
</div>

<!--
Não ler a lista. Só dizer: "hoje a gente abre o capô; no fim, quatro coisas que pareciam mágica vão ter uma explicação mecânica".
-->

---

## Qual destas é a resposta certa? <span class="demo">demo:temperatura</span>

> *Escreva a primeira frase de uma newsletter semanal sobre IA.* — mesmo prompt, 5 execuções

1. Olá! Aqui está o destaque da semana sobre inteligência artificial.
2. O que a inteligência artificial está mudando nas suas rotinas na semana?
3. O que a inteligência artificial está inventando na semana que vem?
4. O que a inteligência artificial está inventando na semana?
5. A semana na era da inteligência artificial começou com grandes avanços…

<p class="mini">qwen3:4b-instruct, temperature 1.2. Rode ao vivo: o resultado muda a cada execução.</p>

<!--
0–4 min. Rodar ao vivo: pnpm -F @mentoria/ex01-llms demo:temperatura
Mostrar só o bloco de temperature 1.2 primeiro. Perguntar: "qual é a certa?". Deixar 2-3 pessoas responderem. Não explicar ainda; prometer a resposta em 15 min.
Se o modelo não estiver rodando, use as respostas deste slide (vieram de uma execução real).
-->

---

<!-- _class: frase -->

Um LLM é uma função que recebe **tokens** e devolve uma **distribuição de probabilidade** sobre o próximo token.

Todo o resto vem de *sortear dessa distribuição, um token por vez*.

<!--
Esta é a frase da aula. Escrever no quadro/chat. Tudo que vier depois volta para ela: variação = sorteio; custo = tokens; contexto = o que entra na função; alucinação = o sorteio favorece o plausível, não o verdadeiro.
-->

---

<!-- _class: secao -->

# 1 · Tokens

O que o modelo realmente enxerga

---

## O modelo não lê palavras <span class="demo">demo:tokens</span>

<div class="tokens"><span>O</span><span> modelo</span><span> prevê</span><span> o</span><span> próximo</span><span> token</span><span> com</span><span> base</span><span> no</span><span> contexto</span><span>.</span></div>

<p class="mini">11 tokens</p>

<div class="tokens"><span>Parcel</span><span>amento</span><span> sem</span><span> juros</span><span> no</span><span> cartão</span><span> de</span><span> crédito</span></div>

<p class="mini">8 tokens · em inglês, "Interest-free credit card installments" = 5</p>

<div class="tokens"><span>in</span><span>constit</span><span>ucional</span><span>issim</span><span>amente</span></div>

<p class="mini">1 palavra, 5 tokens</p>

<p class="fonte">Tokenizador o200k_base (família GPT-4o), via js-tiktoken. Outros modelos usam outros tokenizadores.</p>

<!--
4–11 min. Rodar: pnpm -F @mentoria/ex01-llms demo:tokens
Pontos: (1) token ≠ palavra; espaço costuma vir grudado no início do token. (2) palavra rara vira vários pedaços (BPE funde pares frequentes). (3) o mesmo conteúdo pode custar mais tokens num idioma do que em outro, mas depende do tokenizador e do texto: a primeira frase deu 11 nos dois idiomas.
Analogia: teclado com teclas para sílabas e palavras frequentes, além das letras.
-->

---

## Por que isso importa

<div class="cols-3">
<div class="card">

### Custo
Você paga **por token**, não por palavra.

</div>
<div class="card">

### Limite
A janela de contexto é medida em **tokens**.

</div>
<div class="card">

### Idioma
O mesmo texto pode virar **até 15×** mais tokens em alguns idiomas.

</div>
</div>

<br>

> Contar letras ou inverter uma palavra é difícil para quem enxerga `[Parcel][amento]`.

<p class="fonte">Petrov et al. (2023), Language Model Tokenizers Introduce Unfairness Between Languages, arxiv.org/abs/2305.15425</p>

<!--
O "até 15×" é o máximo encontrado no artigo, para alguns pares de idiomas e tokenizadores. Não é a regra para PT vs EN.
-->

---

<!-- _class: secao -->

# 2 · Um token por vez

Geração autoregressiva e sampling

---

## Geração autoregressiva

```text
contexto ──► [ modelo ] ──► probabilidades do próximo token
   ▲                                  │
   │                              sorteia 1
   └──────── contexto + token ◄───────┘
```

- O texto aparece aos poucos (**streaming**) porque é gerado aos poucos
- Não há "plano": cada token olha só o que **já foi escrito**
- Uma escolha ruim no começo **puxa** as seguintes

<!--
11–15 min. Desenhar o loop. Reforçar: o modelo não "pensa a frase inteira e depois escreve". Ele escolhe o próximo token, e esse token passa a fazer parte do contexto.
-->

---

## O próximo token, ao vivo <span class="demo">demo:proximo-token</span>

> *Complete a frase com poucas palavras: A capital do Brasil é*

| Token escolhido | Alternativas (probabilidade) |
|---|---|
| `" é"` | `" é"` 100% |
| `" Bras"` | `" Bras"` **50,4%** · `" **"` **49,3%** · `" Rio"` 0,3% |
| `"ília"` | `"ília"` 100% |

<p class="mini">A dúvida do modelo não estava no fato: estava em abrir ou não um negrito em markdown.</p>

<p class="fonte">qwen3:4b-instruct via Ollama, temperature 0, logprobs. Rode antes da aula: os números mudam com modelo e versão.</p>

<!--
Rodar: pnpm -F @mentoria/ex01-llms demo:proximo-token
Se quiser variar: pnpm -F @mentoria/ex01-llms demo:proximo-token "Complete: O melhor framework de agentes é"
Ponto: o modelo SEMPRE tem uma distribuição. Às vezes concentrada (100%), às vezes dividida. O sorteio acontece em cada passo.
-->

---

## Temperatura: o quanto confiar no favorito

<div class="cols">
<div>

Logits `[1, 2, 3]` → softmax

**T = 0,5** (concentra)
<div class="barra"><b style="width:9px"></b> 1,6%</div>
<div class="barra"><b style="width:70px"></b> 11,7%</div>
<div class="barra top"><b style="width:520px"></b> 86,7%</div>

**T = 1**
<div class="barra"><b style="width:54px"></b> 9,0%</div>
<div class="barra"><b style="width:147px"></b> 24,5%</div>
<div class="barra top"><b style="width:399px"></b> 66,5%</div>

</div>
<div>

**T → 0** = sempre o favorito (*greedy*)

**T alto** = distribuição achatada, azarões ganham chance

```text
p_i = exp(z_i / T) / Σ exp(z_j / T)
```

Você implementa isso no exercício.

</div>
</div>

<!--
15–18 min. Não precisa explicar a fórmula em detalhe; a intuição basta. Os números do slide são exatos (softmax de [1,2,3]).
-->

---

## Top-p: corta a cauda

- Mantém o **menor grupo** de tokens mais prováveis que soma pelo menos *p*
- Sorteia **só entre eles**
- Remove os tokens improváveis, onde mora o texto sem sentido

> Escolher sempre o mais provável gera texto "sem graça e estranhamente repetitivo"; sortear da distribuição inteira gera lixo. Top-p fica no meio.

<p class="fonte">Holtzman et al. (2019), The Curious Case of Neural Text Degeneration, arxiv.org/abs/1904.09751</p>

<!--
18–19 min. Regra prática: ajuste temperature OU top-p, não os dois ao mesmo tempo.
-->

---

## Voltando ao gancho <span class="demo">demo:temperatura</span>

<div class="cols">
<div class="card">

### temperature 0
5 de 5 iguais:

*"Olá, seja bem-vindo à sua newsletter semanal sobre Inteligência Artificial!"*

</div>
<div class="card">

### temperature 1.2
5 de 5 diferentes.

Nenhuma é "a certa": são **sorteios** da mesma distribuição.

</div>
</div>

<br>

**Classificar, extrair, gerar código** → temperatura baixa · **Brainstorm** → mais alta

<p class="mini">⚠️ temperature 0 reduz a variação, mas não garante saída idêntica em todo provedor.</p>

<!--
19–20 min. Fechar o gancho: "qual era a certa?" → nenhuma; o modelo não tem uma resposta, tem uma distribuição.
-->

---

<!-- _class: secao -->

# 3 · Contexto, custo e latência

---

## Context window

- O modelo **não tem memória** entre chamadas: tudo que ele "sabe" da conversa está no prompt
- Num chat, o **histórico inteiro** é reenviado a cada mensagem
- Quando não cabe, **alguém corta**: o provedor recusa, a biblioteca corta ou você corta
- Caber não é o mesmo que ser bem usado: o desempenho **cai** quando a informação relevante está no **meio** de contextos longos

<p class="fonte">Liu et al. (2023), Lost in the Middle: How Language Models Use Long Contexts, arxiv.org/abs/2307.03172</p>

<!--
20–23 min. Conectar com o exercício: ajustarAoContexto mantém o system e as mensagens mais recentes. Perguntar: o que mais daria para fazer? (resumir o antigo, buscar só o relevante = RAG).
-->

---

## Custo e latência

<div class="cols">
<div>

### Custo
```text
custo = entrada × preço_entrada
      + saída   × preço_saída
        (por milhão de tokens)
```

Exemplo com preços **hipotéticos** (US$ 2 / US$ 8 por milhão):
1.500 tokens de entrada + 300 de saída = **US$ 0,0054**

</div>
<div>

### Latência
- **Entrada:** processada em paralelo → afeta o tempo até o 1º token
- **Saída:** um token por vez → resposta longa = resposta lenta

**Para alto volume:** peça respostas **curtas e estruturadas**

</div>
</div>

<p class="fonte">Preços mudam com frequência: consulte sempre a página oficial do provedor.</p>

<!--
23–27 min. Os preços do slide são inventados, só para o cálculo. Saída costuma custar mais que entrada. A conclusão "respostas curtas e estruturadas" é o gancho para a Aula 2.
-->

---

<!-- _class: secao -->

# 4 · Alucinação

Plausível não é verdadeiro

---

## Por que o modelo inventa

- O modelo gera o **texto mais plausível** dado o contexto
- Se a pergunta cita um artigo que **não existe**, a continuação mais plausível de "resuma o artigo X" é… **um resumo**
- A resposta falsa sai com o **mesmo tom confiante** da verdadeira

> "O modelo mentiu" é impreciso. Ele **completou** o texto, e não havia nada no mecanismo que o obrigasse a checar fatos.

<!--
27–30 min. Ligar com a frase da aula: distribuição sobre o próximo token. Não existe um passo de "consultar fatos".
-->

---

## Três perguntas sobre coisas que não existem <span class="demo">demo:alucinacao</span>

<div class="cols-3">
<div class="card">

### Artigo inventado
Resumiu "Gradientes Tropicais" (NeurIPS 2019) com detalhes técnicos.

**Invenção total**

</div>
<div class="card">

### Framework inventado
Negou que "Jabuticaba.js" orquestre agentes… e descreveu um framework web.

**Invenção parcial**

</div>
<div class="card">

### Cidade inventada
Disse que "Porto Esmeralda do Norte" não existe… e citou um complexo turístico em Pernambuco.

**Negou + inventou detalhe**

</div>
</div>

<p class="fonte">qwen3:4b-instruct, temperature 0. Os três itens foram inventados para a demo.</p>

<!--
30–35 min. Rodar ao vivo se der tempo (as respostas são longas). Ponto principal: alucinação não é tudo-ou-nada. Mesmo quando o modelo "acerta" que algo não existe, ele pode inventar o entorno.
-->

---

## Por que ela persiste

- **No pré-treino:** se o modelo não distingue afirmações incorretas de fatos, erros surgem por pressão estatística
- **Nas avaliações:** a maioria dos benchmarks **premia chutar** em vez de admitir incerteza, como prova sem desconto por erro

### O que fazer (o resto da trilha)

Fornecer a fonte no contexto · validar a saída (**M2–M3**) · usar a incerteza para mandar casos duvidosos a um humano (**M7**)

<p class="fonte">Kalai et al. (2025), Why Language Models Hallucinate, arxiv.org/abs/2509.04664</p>

<!--
35–37 min. Não aprofundar no artigo; a ideia de "prova que premia chute" já basta.
-->

---

## Na leitura de apoio

<div class="cols-3">
<div class="card">

### Embeddings
Tokens viram **vetores**; significados parecidos ficam perto.

</div>
<div class="card">

### Atenção
Cada token **olha os outros** do contexto para se entender.

</div>
<div class="card">

### Pré-treino → RLHF → RLVR
Como um "completador de texto" vira um modelo que **segue instruções**.

</div>
</div>

<br>

Tudo em `conceitos.md` e na **apostila** do módulo.

<!--
37–40 min. Uma frase de cada. Não entrar em detalhe. Analogias rápidas: endereço num mapa de significados; reunião em que cada pessoa decide quanto ouvir de cada colega; ler a biblioteca → exemplos resolvidos → professor comparando redações → lista com gabarito.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos

---

## Para conversar

1. Se `temperature 0` dá sempre a mesma resposta, por que não usar 0 sempre?
2. O projeto final vai classificar notícias. Que temperatura você usaria?
3. Um chatbot "esqueceu" o começo da conversa. Quais são as explicações possíveis?
4. "O modelo mentiu." Qual seria uma descrição mais precisa?
5. Se a saída custa mais e sai um token por vez, o que muda no seu prompt para uma tarefa de alto volume?

<!--
40–55 min. Escolher 3 das 5 se o tempo apertar. A 2 e a 5 preparam a Aula 2 (saída curta, estruturada, previsível).
-->

---

## Para a próxima aula

<div class="cols">
<div class="card">

### Exercício
`softmax`, top-p, `amostrar`, corte de contexto

```bash
pnpm --filter @mentoria/ex01-llms test
```
Desafio: mini modelo de bigramas que **alucina**

</div>
<div class="card">

### Projeto final · M1
Classificar notícias em **texto livre**

```bash
pnpm --filter @mentoria/curador m01:temperaturas
```
Traga o arquivo `saidas/m01-temperaturas.md`

</div>
</div>

<!--
55–60 min. Mostrar onde está o enunciado (exercicio/README.md e projeto-final/README.md). Lembrar que as soluções estão em solucao/, mas que a graça é tentar antes.
-->

---

<!-- _class: capa -->
<!-- _paginate: false -->

Próxima aula · **Além do chat: System One e Jev**

# E se, em vez de texto, o modelo devolvesse uma **decisão tipada** com **confiança**?

Na M1, com temperature 1.5, o formato da resposta já começa a variar: *"Relevantes →"*, *"JUSTIFICATIVA:"*. Um programa que lê isso com regex quebra.

<!--
Gancho para a Aula 2. Pedir para todos trazerem o arquivo de saída da M1 e, quem fizer o desafio, o número de respostas que conseguiu interpretar com regex.
-->
