# Módulo 02 — Além do chat: System One Models e o Jev

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** Módulo 01 e a saída da etapa M1 (`projeto-final/saidas/m01-temperaturas.md`)
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. dizer, para um problema concreto, se ele pede **texto gerado** ou só uma **decisão** (classificar, rotear, pontuar, extrair, aprovar);
2. contrastar um LLM gerativo com um modelo de decisão estilo System One: **strings vs. valores tipados**, **um token por vez vs. tudo de uma vez**, **confiança implícita vs. explícita**;
3. obter uma decisão tipada de um LLM comum com Zod e explicar o que a saída restrita a um schema faz e o que ela **não** faz;
4. obter um sinal de confiança por três caminhos (logprobs, autoavaliação, autoconsistência) e **medir** se ele acompanha o acerto (calibração);
5. ler com olhar crítico o anúncio de um produto de IA: separar o que é afirmação do fornecedor, o que é medido e quais ressalvas os próprios autores fazem.

## Mensagem central

> Muita "IA" em software não precisa gerar texto: precisa **tomar uma decisão que o código consiga usar**. Uma decisão útil tem **tipo** (o programa não precisa adivinhar o formato) e **confiança** (o programa sabe quando chamar um humano). E confiança só vale se for **medida**.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–5 | **Recap da M1** | Abra o `m01-temperaturas.md` de alguém da turma. Em temperatura alta, o formato da resposta variou ("Relevantes →", "JUSTIFICATIVA:"). Pergunte: quem tentou ler isso com código? Quantas respostas conseguiu interpretar? | — |
| 5–13 | **System One e o Jev** | Kahneman: Sistema 1 (rápido, intuitivo) × Sistema 2 (lento, deliberado). A TypeSafe AI lançou em 15/set/2026 uma classe de modelos "System One": recebem estado não estruturado e devolvem **decisões tipadas com probabilidades**, geradas em paralelo, não token a token. O primeiro é o **Jev**. Funciona como um "if inteligente". Mostre a tabela LLM × System One do post e as três primitivas (Choice, Score, Noul). | — |
| 13–20 | **Strings × tipos com um LLM comum** | Dá para pedir JSON validado por schema a um LLM comum (saída estruturada). Mas o schema não muda o que o modelo "pensa"; ele só **proíbe tokens**. Mostre a armadilha: com o campo `rotulo` e a opção `regulacao`, o modelo queria escrever "relevante" ou "IA" e a decodificação restrita transformou isso em `regulacao`. | `demo:armadilha-do-rotulo` |
| 20–30 | **Livre × tipado, ao vivo** | Mesma notícia em texto livre (3 execuções) e como decisão tipada. Compare formato, tamanho, latência. Depois, a pergunta que importa: **a confiança acompanha o acerto?** No nosso teste, a confiança média foi 97% e a acurácia 75%. | `demo:livre-vs-tipado` e `demo:calibracao` |
| 30–37 | **Leitura crítica** | Os números do Jev (70–500 ms, custo muito menor, "zero erro de tipo") são **do fornecedor**, o produto está em early access, e o próprio post lista ressalvas (query simplificada, avaliações feitas pelo time do produto, referência enviesada). A documentação lista onde ele falha (contas, datas, geração de texto). Regra: **meça no seu caso** antes de acreditar, inclusive no do Jev. | slide com as ressalvas |
| 37–40 | **Gerativo ou decisão?** | Tabela de bolso: se a saída é texto para um humano ler → gerativo; se a saída é um valor de um conjunto fechado que o código vai usar → decisão. | — |
| 40–55 | **Discussão** | Perguntas abaixo. | — |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M2. | — |

### Comandos das demos

Da raiz do repositório, com o modelo do `.env` rodando:

```bash
pnpm -F @mentoria/ex02-decisoes demo:armadilha-do-rotulo
pnpm -F @mentoria/ex02-decisoes demo:livre-vs-tipado          # opcional: id da notícia, ex. n09
pnpm -F @mentoria/curador m02:comparar:solucao                 # gera saidas/m02-previsoes.json (~2 min)
pnpm -F @mentoria/ex02-decisoes demo:calibracao                # lê o arquivo acima
pnpm -F @mentoria/ex02-decisoes demo:jev                       # opcional, precisa de TYPESAFE_API_KEY
```

Rode o `m02:comparar:solucao` **antes da aula**: ele faz 40 chamadas ao modelo.

### Notas para o mentor

Rodei tudo com `qwen3:4b-instruct` (Ollama 0.34.4) e o dataset de 20 notícias sintéticas. Modelo e versão mudam o resultado, então rode antes da aula.

- **Armadilha do rótulo:** com o schema `{ rotulo: enum[modelos, ferramentas, pesquisa, regulacao, mercado, irrelevante] }`, as 8 notícias relevantes entre as 12 primeiras viraram `regulacao` (só uma delas, a n04, era mesmo de regulação). No token de decisão, o modelo dava ~70% para `"IA"` e ~15–20% para `"re"` (de "relevante"). Como só `regulacao` começa com "re", a decodificação restrita completou para ela. Com o schema da M2 (`relevante` booleano primeiro, depois `categoria`), o problema some.
- **Livre × tipado (n06):** texto livre com 71–79 tokens de saída e 3,6–4,6 s por chamada; tipado com 33 tokens e 2,2 s. Os dois erraram do mesmo jeito (`ferramentas` em vez de `mercado`). **A saída estruturada não deixou o modelo mais esperto**: na comparação completa, os dois acertaram 15 de 20 (com um parser cuidadoso para o texto livre).
- **Calibração:** confiança verbalizada entre 0,90 e 0,99 em todas as 20 notícias; acurácia 75%; ECE ≈ 0,22. Os 5 erros vieram com confiança de 0,90 a 0,99. Mesmo descalibrada, a confiança ordenou um pouco: aceitando só ≥ 0,99, a acurácia subiu para 92% com 60% de cobertura.
- **Logprobs do booleano** (`relevante`) ficaram saturados em ~100% em todos os casos: não serviram como sinal.
- **Erros sistemáticos:** `mercado` × `ferramentas` (casos de empresas que descrevem práticas técnicas: n06, n11, n19) e anúncios sem conteúdo (n09, n13). Parte disso é ambiguidade do próprio rótulo; deixe para o Módulo 3.
- **Jev:** não testei a demo real (sem chave). A demo sem chave mostra a requisição no formato da documentação. Se você tiver acesso early access, rode com `TYPESAFE_API_KEY` e compare com o resultado do LLM; caso contrário, apresente pelo post e pela documentação.

## Perguntas para discussão (15 min)

1. Pense num sistema do seu dia a dia que usa (ou poderia usar) IA. A saída é texto para uma pessoa ler ou uma decisão que o código usa?
2. Se a decisão tipada acertou o mesmo tanto que o texto livre, o que ganhamos com ela?
3. O modelo disse 0,99 de confiança e errou. De quem é a culpa e o que você faria antes de usar essa confiança para automatizar algo?
4. O post do Jev diz que o modelo "nunca erra o tipo". Por que isso é verdade por construção e por que não é a mesma coisa que acertar a decisão?
5. Que evidência você pediria antes de trocar um LLM por um modelo de decisão como o Jev no seu sistema?

## Armadilhas comuns

- **Achar que saída estruturada deixa o modelo mais inteligente.** Ela garante o formato, não o conteúdo.
- **Nomes de opções que colidem com o que o modelo quer escrever.** O schema só proíbe tokens; se o começo de uma palavra que o modelo quer bate com o começo de uma opção, ele "cai" nela. Use nomes descritivos e campos separados (ex.: `relevante` antes de `categoria`).
- **Tratar a confiança verbalizada como probabilidade.** O número que o modelo escreve é texto gerado, como qualquer outro. Pode ser útil, mas só depois de medido.
- **Usar logprobs de um token "saturado".** Depois do pós-treino, muitos modelos dão ~100% para o token escolhido; isso não diz nada sobre acerto.
- **Pôr regra de negócio no prompt** quando ela pode ficar no código (ex.: "se não é relevante, a categoria é nula").
- **Engolir todo erro como "saída inválida".** Erro de rede não é erro de schema; trate separado.
- **Aceitar número de fornecedor sem ler as ressalvas.**

## Exercício (assíncrono, até a próxima aula)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** três sinais de confiança (probabilidade das opções a partir de logprobs, confiança de uma escolha, votação por autoconsistência) e as métricas de calibração (acurácia, Brier, tabela de calibração, ECE, cobertura × acurácia). Feito = `pnpm -F @mentoria/ex02-decisoes test` verde.
- **Desafio extra:** *temperature scaling*. Usar a temperatura do Módulo 1 para calibrar um modelo confiante demais. Feito = `pnpm -F @mentoria/ex02-decisoes test:desafio` verde.

## Projeto final — etapa M2

Em [`projeto-final/`](../../projeto-final/README.md): `classificarTipado(noticia)` devolve `{ relevante, categoria, confianca }` validado por Zod, com regras de consistência no código e tratamento de saída inválida.

- Feito = `pnpm -F @mentoria/curador exec vitest run test/m02.test.ts` verde **e** `pnpm -F @mentoria/curador m02:comparar` gerando `saidas/m02-comparacao.md`.
- Traga para a Aula 3 a tabela "A confiança acompanha o acerto?" do relatório. Vamos usá-la para montar as evals.

## Referências

- TypeSafe AI. *Introducing System One Models and Jev* (15/set/2026). https://typesafe.ai/blog/introducing-system-one-models-and-jev
- Documentação da TypeSafe: primitivas (https://docs.typesafe.ai/primitives), confiança (https://docs.typesafe.ai/confidence), API (https://docs.typesafe.ai/api) e limitações conhecidas do jev-1.13 (https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.
- Guo et al. (2017). *On Calibration of Modern Neural Networks*. https://arxiv.org/abs/1706.04599
- Kadavath et al. (2022). *Language Models (Mostly) Know What They Know*. https://arxiv.org/abs/2207.05221
- OpenAI (2023). *GPT-4 Technical Report* (seção sobre calibração antes e depois do pós-treino). https://arxiv.org/abs/2303.08774
- Tian et al. (2023). *Just Ask for Calibration*. https://arxiv.org/abs/2305.14975
- Xiong et al. (2023). *Can LLMs Express Their Uncertainty?* https://arxiv.org/abs/2306.13063
- Wang et al. (2022). *Self-Consistency Improves Chain of Thought Reasoning in Language Models*. https://arxiv.org/abs/2203.11171
- Tam et al. (2024). *Let Me Speak Freely? A Study on the Impact of Format Restrictions on Performance of Large Language Models*. https://arxiv.org/abs/2408.02442
- AI SDK — saída estruturada: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data · Zod: https://zod.dev
