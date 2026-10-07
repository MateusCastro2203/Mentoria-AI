# Módulo 01 — Como LLMs funcionam

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** [00-setup](../00-setup/README.md) com `pnpm verificar` verde
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. explicar por que o mesmo prompt pode dar respostas diferentes, usando *geração autoregressiva* e *sampling* (temperature, top-p);
2. estimar quantos tokens um texto ocupa e quanto custa uma chamada, sabendo que entrada e saída têm preços diferentes;
3. dizer o que acontece quando uma conversa passa da *context window* e escolher o que descartar;
4. explicar por que o modelo alucina: ele prevê o texto mais plausível, não consulta fatos;
5. implementar softmax com temperatura e top-p, e ver na prática que um gerador de "próxima palavra" inventa frases plausíveis.

## Mensagem central

> Um LLM é uma função que recebe tokens e devolve uma **distribuição de probabilidade** sobre o próximo token. Todo o resto (o texto, a variação, o custo, a alucinação) vem de **sortear dessa distribuição, um token por vez**.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–4 | **Gancho** | Rode a demo de temperatura com `1.2` e pergunte: "qual das 5 é a resposta certa?". Volte a ela no fim. | `demo:temperatura` |
| 4–11 | **Tokenização** | O modelo não vê letras nem palavras; vê *tokens* (pedaços de texto com um id). Palavra rara vira vários pedaços. O mesmo conteúdo pode custar mais tokens em um idioma do que em outro. | `demo:tokens` |
| 11–20 | **Geração autoregressiva + sampling** | O modelo devolve probabilidades para o próximo token; um é sorteado, entra no contexto, e repete. Temperature achata ou concentra a distribuição; top-p corta a cauda. `temperature 0` ≈ sempre o favorito. | `demo:proximo-token` e de novo `demo:temperatura` |
| 20–27 | **Context window, custo e latência** | Tudo que o modelo "lembra" está no prompt; a janela tem limite em tokens. Você paga por token de entrada e de saída (saída costuma custar mais), e a latência cresce com os tokens gerados, porque é um token por vez. | quadro: fórmula de custo |
| 27–37 | **Alucinação** | Se o próximo token mais plausível forma uma frase falsa, o modelo gera a frase falsa com o mesmo tom confiante. Mostre os três casos da demo: invenção total, invenção parcial e "não existe" + detalhe inventado. | `demo:alucinacao` |
| 37–40 | **Trailer da leitura de apoio** | Embeddings (como o modelo representa significado), atenção (como cada token "olha" os outros) e pré-treino vs. RLHF/RLVR (por que o modelo segue instruções). Uma frase de cada; o resto está em `conceitos.md`. | — |
| 40–55 | **Discussão** | Perguntas abaixo. | — |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M1 do projeto final. | — |

### Comandos das demos

Todos rodam da raiz do repositório. Só `demo:tokens` é offline; as outras usam o modelo do `.env`.

```bash
pnpm --filter @mentoria/ex01-llms demo:tokens
pnpm --filter @mentoria/ex01-llms demo:temperatura
pnpm --filter @mentoria/ex01-llms demo:proximo-token
pnpm --filter @mentoria/ex01-llms demo:proximo-token "Complete: O melhor framework de agentes é"
pnpm --filter @mentoria/ex01-llms demo:alucinacao
```

### Notas para o mentor

Rodei com `qwen3:4b-instruct` (Ollama 0.34.4) ao preparar o material. Modelo e versão mudam o resultado, então **rode as demos antes da aula**. O que observei:

- **Tokens:** com o tokenizador `o200k_base`, a frase técnica deu 11 tokens em PT e em EN; "Parcelamento sem juros no cartão de crédito" deu 8, contra 5 da versão em inglês. Use isso para mostrar que a diferença entre idiomas existe, mas depende do tokenizador e do texto. Não é uma regra fixa.
- **Temperatura:** com `temperature 0`, as 5 respostas saíram idênticas; com `1.2`, as 5 saíram diferentes. Prompts muito fechados ("só o nome") podem dar a mesma resposta até com temperatura alta, porque a distribuição está muito concentrada. Isso também é um bom ponto de discussão.
- **Próximo token:** em "A capital do Brasil é", o token seguinte ficou dividido entre `" Bras"` (~50%) e `" **"` (~49%, o modelo querendo abrir negrito em markdown). A maior incerteza estava no formato, não no fato.
- **Alucinação:** o artigo inventado foi resumido com detalhes. O framework inventado foi negado como ferramenta de agentes, mas descrito como "framework web" (também inventado). A cidade inventada foi negada, mas a resposta acrescentou um "complexo turístico em Pernambuco" sem fonte. Use os três para mostrar que alucinação não é tudo-ou-nada.
- **Etapa M1 (solução de referência, 3 notícias × 3 temperaturas × 5 execuções):** em `0` as respostas saíram idênticas; em `0.7` mudou só a justificativa; em `1.5` o *formato* começou a variar ("Relevantes →", "JUSTIFICATIVA:"). Esse é o gancho da Aula 2: um programa que lê essa saída com regex quebra justamente nesses casos. O modelo também classificou a n11 como `ferramentas` (o rótulo é `mercado`). Vale discutir se o erro é do modelo ou se o rótulo é ambíguo, assunto do Módulo 3.
- **Logprobs:** a demo `proximo-token` precisa de um provedor que devolva logprobs (`pnpm verificar` informa se o seu devolve). Se o seu não devolver, mostre a distribuição com o exercício de sampling (`softmax` de logits de exemplo).

## Perguntas para discussão (15 min)

1. Se `temperature 0` dá sempre a mesma resposta, por que não usar 0 sempre? Em que tarefa do seu dia a dia você quer variação?
2. O projeto final vai classificar notícias. Que temperatura você usaria? Por quê?
3. Um chatbot de atendimento "esqueceu" o que o cliente disse no começo da conversa. Quais são as explicações possíveis, à luz da context window?
4. "O modelo mentiu." Essa frase faz sentido? Qual seria uma descrição mais precisa do que aconteceu?
5. Se saída custa mais que entrada e é gerada um token por vez, o que muda no design de um prompt para uma tarefa de alto volume?

## Armadilhas comuns

- **Achar que `temperature 0` é determinístico em qualquer provedor.** Em muitos é *quase*: detalhes de hardware, batching e versão do modelo podem mudar o resultado. Não use isso como garantia em teste.
- **Contar palavras em vez de tokens** para estimar custo ou limite de contexto.
- **Usar o tokenizador errado:** cada família de modelos tem o seu, e a contagem muda.
- **Esquecer que o histórico da conversa é reenviado a cada chamada:** o custo de entrada cresce a cada turno.
- **Tratar alucinação como bug raro.** É consequência direta do mecanismo; a mitigação vem de fora do modelo (fontes, validação, evals), assunto dos Módulos 2 e 3.
- **Mexer em temperature e top-p ao mesmo tempo** sem saber qual efeito veio de qual.

## Exercício (assíncrono, até a próxima aula)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** implementar contagem de tokens e custo, `softmax` com temperatura, filtro top-p, sorteio e o corte de histórico para caber na context window. Feito = `pnpm --filter @mentoria/ex01-llms test` verde.
- **Desafio extra:** um mini modelo de bigramas que gera frases token a token com o seu `amostrar`, e um teste mostrando que ele inventa frases que nunca viu. Feito = `pnpm --filter @mentoria/ex01-llms test:desafio` verde.

## Projeto final — etapa M1

Em [`projeto-final/`](../../projeto-final/README.md): implementar `montarPromptClassificacao` e `classificarLivre`, que pedem ao modelo, em texto livre, se uma notícia é relevante e em que categoria entra.

- Feito = `pnpm --filter @mentoria/curador exec vitest run test/m01.test.ts` verde **e** `pnpm --filter @mentoria/curador m01:temperaturas` gerando `projeto-final/saidas/m01-temperaturas.md`.
- Traga para a Aula 2 o arquivo gerado. Vamos olhar juntos como as respostas variam de formato e o que seria preciso para um programa *usar* essa saída.

## Referências

- Sennrich, Haddow, Birch (2015). *Neural Machine Translation of Rare Words with Subword Units* (BPE). https://arxiv.org/abs/1508.07909
- Petrov et al. (2023). *Language Model Tokenizers Introduce Unfairness Between Languages*. https://arxiv.org/abs/2305.15425
- Karpathy. *Let's build the GPT Tokenizer* (vídeo). https://www.youtube.com/watch?v=zduSFxRajkE
- Tiktokenizer (visualizador de tokens no navegador): https://tiktokenizer.vercel.app
- Holtzman et al. (2019). *The Curious Case of Neural Text Degeneration* (nucleus/top-p sampling). https://arxiv.org/abs/1904.09751
- Liu et al. (2023). *Lost in the Middle: How Language Models Use Long Contexts*. https://arxiv.org/abs/2307.03172
- Kalai et al. (2025). *Why Language Models Hallucinate*. https://arxiv.org/abs/2509.04664 · resumo da OpenAI: https://openai.com/index/why-language-models-hallucinate/
- Leitura de apoio (embeddings, atenção, pré-treino, RLHF/RLVR): veja [`conceitos.md`](conceitos.md).
