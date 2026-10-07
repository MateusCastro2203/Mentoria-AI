# Módulo 00 — Setup do ambiente

> **Formato:** tarefa assíncrona, antes da Aula 1. Não há encontro ao vivo para este módulo.
> **Tempo estimado:** 30–60 min (a maior parte é download).

## Objetivos

Ao final, a pessoa consegue:

1. rodar `pnpm verificar` e ver **✔ Ambiente pronto.**;
2. explicar em uma frase o que é a camada `@mentoria/llm` e por que nenhum exercício chama um provedor diretamente;
3. trocar o modelo usado pelos exercícios mudando só o `.env`.

## Conceitos-chave

**Provedor de modelo.** É quem roda o LLM e expõe uma API: um serviço na nuvem ou um programa na sua máquina. Em toda a mentoria usamos o mesmo "idioma" de API, o formato de chat da OpenAI, que virou padrão de mercado e é falado por Ollama, vLLM, LM Studio e vários provedores remotos.

**Modelo local com Ollama.** O [Ollama](https://ollama.com) baixa e roda modelos abertos no seu notebook. Não exige conta, cartão nem token, e nenhum dado sai da sua máquina. Em troca, os modelos são menores (e mais "burros") que os de fronteira. Para aprender o que acontece por baixo, isso é uma vantagem: você vê os erros que modelos grandes escondem.

**Camada de abstração (`@mentoria/llm`).** Pense numa tomada universal: o exercício pluga em `gerarTexto()` ou `gerarObjeto()` e não sabe se do outro lado tem Ollama ou um provedor remoto. Quem decide é o `.env`. Por baixo usamos o [AI SDK](https://ai-sdk.dev) com o provedor [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers).

| Variável | Para que serve | Padrão |
|---|---|---|
| `LLM_BASE_URL` | endpoint compatível com a API da OpenAI | `http://localhost:11434/v1` (Ollama) |
| `LLM_MODEL` | nome do modelo no provedor | `qwen3:4b-instruct` |
| `LLM_API_KEY` | chave do provedor remoto (Ollama ignora) | vazio |
| `LLM_REASONING_EFFORT` | só para modelos remotos de raciocínio | vazio |

**Testes offline.** Os testes dos exercícios (Vitest) **não chamam modelo de verdade**: recebem um modelo falso (mock) que devolve respostas fixas. Assim o critério de "feito" é reprodutível, rápido e grátis. Chamadas reais aparecem em scripts de demo e nas evals (Módulo 3).

## Passo a passo

### 1. Node.js 24 (LTS)

Instale o Node 24, a versão LTS ativa ([calendário de versões](https://nodejs.org/en/about/previous-releases)). Recomendamos um gerenciador de versões, como [nvm](https://github.com/nvm-sh/nvm) ou [fnm](https://github.com/Schniz/fnm). Na raiz do repositório:

```bash
nvm install   # ou: fnm install  (lê o .nvmrc)
node -v       # v24.x
```

Versões ímpares (25, 27…) funcionam, mas não são LTS. O `pnpm verificar` avisa.

### 2. pnpm

O pnpm 12 é um executável nativo. Use um dos [métodos oficiais](https://pnpm.io/installation):

```bash
npx get-pnpm                                   # qualquer sistema com Node
# ou, macOS/Linux:
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

O `package.json` fixa a versão em `packageManager`, e o pnpm usa essa versão automaticamente dentro do repositório.

### 3. Dependências

```bash
pnpm install
```

### 4. Ollama + modelo

1. Instale o Ollama: https://ollama.com/download (macOS, Windows e Linux).
2. Garanta que ele está rodando (o app fica na barra de menus; no Linux, `ollama serve`).
3. Baixe o modelo padrão (~2,5 GB):

```bash
ollama pull qwen3:4b-instruct
```

> **Por que esse modelo?** É pequeno o bastante para notebooks com 8 GB de RAM e não é um modelo de "raciocínio". Modelos com *thinking* (como `qwen3:4b`) gastam centenas de tokens pensando antes de responder: mais lento e, em alguns casos, o raciocínio vaza para a resposta. Se a sua máquina aguenta mais, teste `qwen3:8b`.

### 5. `.env`

```bash
cp .env.example .env
```

Para o Ollama, não precisa mudar nada.

### 6. Verifique

```bash
pnpm verificar
```

## Critério de feito

`pnpm verificar` termina com **✔ Ambiente pronto.** e código de saída 0. As verificações obrigatórias:

- Node ≥ 24 e pnpm em uso;
- provedor respondendo em `LLM_BASE_URL` e modelo disponível;
- geração de texto funcionando;
- saída estruturada validada com Zod.

Linhas com **ℹ** são informativas. Uma delas diz se o provedor devolve *logprobs*, que serão usados no Módulo 2. A documentação do Ollama marca logprobs como não suportado no endpoint compatível ([docs](https://docs.ollama.com/api/openai-compatibility)), mas no Ollama 0.34.4 eles vieram na resposta. Se no seu ambiente não vierem, o Módulo 2 tem um caminho alternativo.

Confira também os testes da camada de provedor (offline, sem Ollama):

```bash
pnpm --filter @mentoria/llm test
```

## Desafio extra (para quem já tem experiência)

1. **Provedor remoto.** Aponte o `.env` para um provedor remoto compatível com a API da OpenAI (`LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`) e rode `pnpm verificar` de novo. Compare latência e tokens de saída com o modelo local.
2. **Por dentro da abstração.** Leia `packages/llm/src/modelo.ts` e explique como os logprobs, que não fazem parte da interface padrão do AI SDK, chegam até `gerarTexto()`.

## Troubleshooting

| Sintoma no `pnpm verificar` | O que fazer |
|---|---|
| `nada respondendo em http://localhost:11434/v1` | O Ollama não está rodando. Abra o app ou rode `ollama serve`. |
| `modelo "…" não está disponível` | `ollama pull <modelo>`, ou ajuste `LLM_MODEL` para um da lista mostrada. |
| `chave inválida ou ausente` | Confira `LLM_API_KEY` no `.env` (só para provedor remoto). |
| `o script não rodou via pnpm` | Rode `pnpm verificar`, não `npm run verificar`. |
| Resposta de texto lenta (> 30 s) | Pouca RAM ou modelo grande demais. Feche apps pesados ou use um modelo menor. |

> Atenção: `pnpm doctor` é um comando do próprio pnpm (diagnostica o pnpm, não a mentoria). O nosso é `pnpm verificar`.

## Armadilhas comuns

- **Rodar com Ollama fechado.** O erro aparece como `fetch failed`. Quase sempre é isso.
- **Usar modelo com *thinking* sem perceber.** A resposta fica lenta e às vezes traz o raciocínio misturado ao texto.
- **Commitar o `.env`.** Ele está no `.gitignore` porque pode conter chave de API. Nunca coloque chave em código.
- **Esperar que o modelo local acerte tudo.** Modelos de 4B erram com frequência, e é para isso mesmo: a trilha mostra como medir e conter esses erros.

## Perguntas para levar à Aula 1

1. Por que o mesmo prompt pode devolver respostas diferentes? (Rode `pnpm verificar` duas vezes e compare.)
2. O que você ganha e o que perde rodando o modelo localmente em vez de usar um provedor remoto?
3. Se a camada `@mentoria/llm` não existisse, o que mudaria nos exercícios quando a turma trocasse de modelo?

## Referências

- Node.js — calendário de versões: https://nodejs.org/en/about/previous-releases
- pnpm — instalação: https://pnpm.io/installation · workspaces: https://pnpm.io/workspaces
- Ollama — download: https://ollama.com/download · compatibilidade OpenAI: https://docs.ollama.com/api/openai-compatibility
- AI SDK — provedores OpenAI-compatible: https://ai-sdk.dev/providers/openai-compatible-providers · saída estruturada: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data · testes com mock: https://ai-sdk.dev/docs/ai-sdk-core/testing
- Zod: https://zod.dev
- Vitest: https://vitest.dev
