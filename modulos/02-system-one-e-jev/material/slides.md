---
marp: true
theme: mentoria
paginate: true
lang: pt-BR
title: Módulo 02 — Além do chat: System One e Jev
---

<!-- _class: capa -->
<!-- _paginate: false -->

Mentoria de IA aplicada · **Aula 2 de 8**

# Além do chat: System One e o Jev

Decisões tipadas, confiança e calibração

<!--
Abertura (30 s). Hoje a pergunta muda: em vez de "como o modelo gera texto", vamos perguntar "e quando a gente não quer texto?".
-->

---

## Hoje

<div class="cols">
<div>

Ao final, você consegue:

- dizer se um problema pede **texto** ou só uma **decisão**
- obter uma decisão **tipada** de um LLM comum
- obter um sinal de **confiança** e **medir** se ele presta
- ler um anúncio de IA com **olhar crítico**

</div>
<div class="card">

### Roteiro (40 min)

1. Recap da M1
2. System One e o Jev
3. Strings × tipos
4. Livre × tipado, ao vivo
5. Leitura crítica
6. Gerativo ou decisão?

Depois: 15 min de discussão

</div>
</div>

<!--
Não ler a lista. Frase de abertura: "na aula passada o modelo escrevia; hoje ele vai decidir".
-->

---

## O que vocês trouxeram da M1

> Classificar a notícia em **texto livre**, com temperatura 1.5:

- Relevante. Categoria: ferramentas.
- Relevante**s →** Categoria: ferramentas
- Relevante. Categoria: ferramentas. **JUSTIFICATIVA:** …

<br>

**Quem tentou ler isso com código? Quantas respostas conseguiu interpretar?**

<!--
0–5 min. Abrir o m01-temperaturas.md de alguém da turma (ou o seu). Deixar 1 ou 2 pessoas contarem o que aconteceu ao tentar interpretar. Ponto: o programa que usa a resposta precisa adivinhar o formato.
-->

---

<!-- _class: frase -->

Muita "IA" em software não precisa gerar texto: precisa tomar uma **decisão** que o código consiga usar.

Uma decisão útil tem *tipo* e *confiança*. E confiança só vale se for **medida**.

<!--
Esta é a frase da aula. Escreva no chat. Tipo = o programa não adivinha o formato. Confiança = o programa sabe quando chamar um humano. Medida = o número precisa bater com a realidade.
-->

---

<!-- _class: secao -->

# 1 · System One e o Jev

---

## Sistema 1 e Sistema 2

<div class="cols">
<div class="card">

### Sistema 1
Rápido, automático, intuitivo.

*Reconhecer um rosto. Perceber que alguém está bravo.*

</div>
<div class="card">

### Sistema 2
Lento, deliberado, trabalhoso.

*Fazer uma conta de cabeça. Comparar dois planos de saúde.*

</div>
</div>

<br>

Muitas decisões dentro de software são de **Sistema 1**: olhar um texto e julgar rápido.

<p class="fonte">Kahneman, D. (2011). Thinking, Fast and Slow (Rápido e Devagar).</p>

<!--
5–7 min. Limite da analogia: no livro, o Sistema 1 é o que mais erra por vieses. A TypeSafe argumenta que, com o treino certo, um modelo rápido pode ser mais confiável. É uma afirmação deles, a ser testada.
-->

---

## O Jev, segundo o anúncio

- Lançado pela TypeSafe AI em **15/set/2026**, em *early access*
- **Não gera texto:** recebe um estado e perguntas tipadas, devolve **respostas tipadas com probabilidades**
- Gera **tudo de uma vez**, não um token por vez
- Treinado com **RLCD** (aprendizado por reforço para decisões calibradas), não RLHF/RLVR
- Pensado como um **"if inteligente"**: classificar, rotear, pontuar, extrair, guardrail, juiz

<p class="fonte">typesafe.ai/blog/introducing-system-one-models-and-jev</p>

<!--
7–10 min. Ligar com a Aula 1: lá, o LLM sorteava um token por vez. Aqui a promessa é outra classe de modelo. Deixar claro que tudo neste slide é o que o fornecedor afirma.
-->

---

## LLM × System One (tabela do post)

| | LLM | System One (Jev) |
|---|---|---|
| Treinado com | RLHF / RLVR | RLCD |
| Saída | texto | **valores tipados** |
| Como gera | um token por vez | **em paralelo** |
| Velocidade | 3 s a 329 s | **70 ms a 500 ms** |
| Confiança | "confiante demais, inconsistente" | "**calibrada**" |
| Bom para | humano no meio, demos | workflows, tempo real |

<p class="fonte">Números e adjetivos do próprio fornecedor. Voltamos a eles no bloco 4.</p>

<!--
10–12 min. Não discutir os números ainda; só apresentar. Avisar: "guarde esses números, a gente volta neles com lupa".
-->

---

## Três tipos de pergunta

<div class="cols-3">
<div class="card">

### Choice
Escolha uma opção da lista.

→ opção, probabilidade de cada uma, confiança

</div>
<div class="card">

### Score
Dê uma nota em níveis.

→ nota, probabilidade de cada nível, confiança

</div>
<div class="card">

### Noul
Sim ou não?

→ probabilidade de "sim" (0 a 1)

</div>
</div>

<br>

**Confiança ≠ probabilidade:** 88% entre 3 opções → confiança **0,82**. 50% entre 2 opções → confiança **0**.

<p class="fonte">docs.typesafe.ai/primitives · docs.typesafe.ai/confidence</p>

<!--
12–13 min. A fórmula está no exercício: (n × p_max − 1) / (n − 1). Intuição: 40% numa escolha entre 10 opções é muito mais "decidido" do que 40% entre 2.
-->

---

<!-- _class: secao -->

# 2 · Strings × tipos

Dá para fazer com um LLM comum?

---

## Saída estruturada: como funciona por dentro

- Você manda um **schema** (Zod → JSON Schema) e o provedor garante o formato
- A cada token, o provedor **zera a probabilidade** do que quebraria o schema e sorteia entre o resto
- Parecido com o top-p da Aula 1, mas o filtro é "o que é válido", não "o que é provável"

> O schema **não muda o que o modelo pensa**. Ele só **proíbe tokens**.

<!--
13–15 min. Ligar com a Aula 1: distribuição → filtro → sorteio. Aqui o filtro é o schema. Consequência: o formato fica garantido, o conteúdo não.
-->

---

## A armadilha do rótulo <span class="demo">demo:armadilha-do-rotulo</span>

Schema `{ "rotulo": modelos | ferramentas | pesquisa | regulacao | mercado | irrelevante }`

| Notícia | Esperado | O que o modelo queria escrever | Escolhido |
|---|---|---|---|
| n02 | ferramentas | `"IA"` **71,7%** · `"re"` 15,5% | **regulacao** |
| n03 | pesquisa | `"IA"` **72,5%** · `"re"` 20,5% | **regulacao** |

O modelo queria escrever "IA" ou "**re**levante". A única opção que começa com "re" é **regulacao**.

<p class="fonte">qwen3:4b-instruct, temperature 0. Nas 12 primeiras notícias, as 8 relevantes viraram "regulacao".</p>

<!--
15–20 min. Rodar a demo ao vivo. Explicar devagar: o primeiro token do valor é sorteado só entre tokens que começam alguma opção válida. "IA" não começa nenhuma; "re" começa "regulacao". Conserto: separar relevante (booleano) de categoria, e dar nomes que digam o que significam. Com o schema da M2 o problema some.
-->

---

<!-- _class: secao -->

# 3 · Livre × tipado, ao vivo

---

## A mesma notícia, dois jeitos <span class="demo">demo:livre-vs-tipado</span>

<div class="cols">
<div class="card">

### Texto livre (3×, temperature 0.7)
*"Relevante. Categoria: ferramentas. Justificativa: A mudança na cobrança por tokens em cache afeta diretamente…"*

**71–79 tokens · 3,6–4,6 s**

</div>
<div class="card">

### Decisão tipada (Zod)
```json
{ "relevante": true,
  "categoria": "ferramentas",
  "confianca": 0.99 }
```
**33 tokens · 2,2 s**

</div>
</div>

<p class="mini">Notícia n06 (rótulo humano: <b>mercado</b>). Os dois erraram do mesmo jeito.</p>

<!--
20–24 min. Rodar a demo. Pontos: o tipado é menor e mais rápido (menos tokens de saída, Aula 1), e o programa não precisa de parser. Mas os dois erraram igual: a saída estruturada não deixa o modelo mais esperto.
-->

---

## Nas 20 notícias do projeto

| | Texto livre (M1) | Decisão tipada (M2) |
|---|---|---|
| Saídas que o código consegue usar | 20/20, **com um parser cuidadoso** | 20/20, **sem parser** |
| Acertos | **15/20 (75%)** | **15/20 (75%)** |
| Latência média | ~4,8 s | **~2,5 s** |

<br>

> Mesma acurácia. O ganho do tipado é **contrato, custo e latência**, não inteligência.

<p class="fonte">pnpm -F @mentoria/curador m02:comparar:solucao · qwen3:4b-instruct</p>

<!--
24–26 min. Contar a história honesta: na primeira versão do parser de texto livre, eu procurava a categoria no texto inteiro e a justificativa citava outras categorias. Ele dizia "100% interpretável" e errava calado. Esse é o risco real do texto livre: o erro silencioso.
-->

---

## A confiança acompanha o acerto? <span class="demo">demo:calibracao</span>

<div class="cols">
<div>

**Confiança média**
<div class="barra top"><b style="width:485px"></b> 97%</div>

**Acurácia**
<div class="barra"><b style="width:375px"></b> 75%</div>

<br>

Os **5 erros** vieram com confiança de **0,90 a 0,99**.

</div>
<div>

| Aceitar só se confiança ≥ | Cobre | Acerta |
|---|---|---|
| 0,90 | 100% | 75% |
| 0,95 | 95% | 79% |
| 0,99 | 60% | **92%** |

ECE ≈ **0,22** (0 = calibrado)

</div>
</div>

<!--
26–30 min. Rodar a demo (precisa do m02:comparar:solucao antes). Pontos: (1) descalibrada: diz 97%, acerta 75%. (2) Mesmo assim ordena um pouco: só ≥ 0,99 acerta 92%. (3) Com 20 exemplos, tudo isso é instável: uma notícia muda 5 pontos.
-->

---

## Três jeitos de pedir confiança a um LLM

<div class="cols-3">
<div class="card">

### Logprobs
Probabilidade dos tokens.

Aqui: **~100%** no booleano em todas. Não serviu.

</div>
<div class="card">

### Autoavaliação
Campo `confianca` no JSON.

Aqui: 0,90–0,99 em tudo, inclusive nos erros.

</div>
<div class="card">

### Autoconsistência
Rodar 5× e contar votos.

Aqui: **5 de 5** também nos erros.

</div>
</div>

<br>

Modelos pós-treinados tendem a ficar **confiantes demais**. Confiança só vale **depois de medida**.

<p class="fonte">OpenAI (2023) GPT-4 Technical Report · Tian et al. (2023) · Xiong et al. (2023)</p>

<!--
Ainda no bloco 26–30. Autoconsistência não pega erro de interpretação: se o modelo acha que "caso de empresa" é ferramentas, ele acha isso todas as vezes.
-->

---

<!-- _class: secao -->

# 4 · Leitura crítica

Números de fornecedor

---

## O que o próprio post ressalva

- A consulta de demonstração é **muito simplificada**; a entrada curta **favorece** o modelo deles
- Os ganhos nos workflows devem estar **no topo** do que se vê no mundo real
- Os workflows foram montados pelo **time do próprio produto**: "pode haver viés"
- Os LLMs comparados passaram por um **wrapper deles**, que os deixa mais lentos e caros
- "0% de erro de tipo" **não é medido**: é garantido por construção

<p class="fonte">Ressalvas traduzidas de typesafe.ai/blog/introducing-system-one-models-and-jev</p>

<!--
30–34 min. Elogie a transparência: é raro um fornecedor listar as próprias ressalvas. Mas são ressalvas importantes. Lembre também que é early access.
-->

---

## Onde a própria documentação diz que ele falha

<div class="cols">
<div>

- Leitura **literal** das instruções
- **Contas** e contagens
- Comparação de **datas**
- Perguntas com várias indireções

</div>
<div>

- Estado grande com muito detalhe irrelevante
- Conteúdo adversarial
- **Ordem** das opções numa Choice
- **Gerar texto** ("use um modelo gerativo")

</div>
</div>

<br>

> "Tipo sempre válido" ≠ "decisão certa". **Meça no seu caso** — inclusive o do Jev.

<p class="fonte">docs.typesafe.ai/model-jaggedness/jev-1.13 (revisado em 02/out/2026)</p>

<!--
34–37 min. Checklist rápido: quem mediu? em que tarefa? com que comparação? os autores listam ressalvas? dá para reproduzir? O resultado se repete com os SEUS dados? Esta última é a única que decide.
-->

---

## Gerativo ou decisão?

| A saída é… | Exemplo | Use |
|---|---|---|
| texto para uma pessoa ler | resumo, e-mail, resposta de chat | **LLM gerativo** |
| um valor de um conjunto fechado que o código usa | categoria, sim/não, nota | **decisão tipada** |
| as duas coisas | classificar **e** justificar | decisão + texto, em **campos separados** |

<!--
37–40 min. Pedir um exemplo de cada linha à turma, rapidamente. O framework completo (prompt, skill, agente, decisão) é o assunto da Aula 4.
-->

---

<!-- _class: secao -->

# Discussão

15 minutos

---

## Para conversar

1. Um sistema do seu dia a dia com IA: a saída é texto para uma pessoa ou uma decisão que o código usa?
2. Se o tipado acertou o mesmo tanto que o texto livre, o que ganhamos com ele?
3. O modelo disse 0,99 e errou. O que você faria antes de usar essa confiança para automatizar algo?
4. Por que "nunca erra o tipo" é verdade por construção e não é o mesmo que acertar?
5. Que evidência você pediria antes de trocar um LLM por um modelo de decisão como o Jev?

<!--
40–55 min. Se o tempo apertar: 2, 3 e 5. Respostas esperadas no guia do mentor.
-->

---

## Para a próxima aula

<div class="cols">
<div class="card">

### Exercício
Confiança (logprobs, escolha, votação) e calibração (Brier, ECE, cobertura)

```bash
pnpm -F @mentoria/ex02-decisoes test
```
Desafio: *temperature scaling*

</div>
<div class="card">

### Projeto final · M2
`classificarTipado`: Zod + confiança + regras no código

```bash
pnpm -F @mentoria/curador m02:comparar
```
Traga a tabela "A confiança acompanha o acerto?"

</div>
</div>

<!--
55–60 min. Mostrar onde estão os enunciados. Lembrar das soluções em solucao/.
-->

---

<!-- _class: capa -->
<!-- _paginate: false -->

Próxima aula · **Prompt, Evals e Guardrails**

# 20 notícias não bastam. Como saber se o seu prompt **melhorou** de verdade?

Datasets rotulados, métricas, LLM-as-judge, regressão e guardrails que impedem publicar sem fonte.

<!--
Gancho para a Aula 3. Os erros de hoje (mercado × ferramentas, anúncios sem conteúdo) e a instabilidade de medir com 20 exemplos são o ponto de partida.
-->
