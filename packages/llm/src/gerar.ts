import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";
import { lerConfig, type ConfigLlm } from "./config.js";
import { criarModelo, NOME_PROVEDOR, type TokenBruto } from "./modelo.js";

export interface OpcoesGeracao {
  prompt: string;
  system?: string;
  temperature?: number;
  /** Pede logprobs ao provedor. Vem `undefined` no resultado se ele não suportar. */
  logprobs?: boolean;
  /** Injeta um modelo pronto (ex.: mock nos testes). Se omitido, usa `criarModelo(config)`. */
  modelo?: LanguageModel;
  config?: ConfigLlm;
}

export interface Uso {
  tokensEntrada?: number;
  tokensSaida?: number;
  latenciaMs: number;
}

export interface LogprobToken {
  token: string;
  logprob: number;
  alternativas: { token: string; logprob: number }[];
}

export interface Resultado {
  uso: Uso;
  logprobs?: LogprobToken[];
}

export async function gerarTexto(opcoes: OpcoesGeracao): Promise<Resultado & { texto: string }> {
  const { resultado, uso } = await chamar(opcoes);
  return { texto: resultado.text, uso, logprobs: extrairLogprobs(resultado.providerMetadata) };
}

/** Gera um objeto validado pelo schema Zod. Lança `NoObjectGeneratedError` se o modelo não respeitar o schema. */
export async function gerarObjeto<S extends z.ZodType>(
  opcoes: OpcoesGeracao & { schema: S },
): Promise<Resultado & { objeto: z.infer<S> }> {
  const { resultado, uso } = await chamar(opcoes, Output.object({ schema: opcoes.schema }));
  return { objeto: resultado.output as z.infer<S>, uso, logprobs: extrairLogprobs(resultado.providerMetadata) };
}

async function chamar(opcoes: OpcoesGeracao, output?: Output.Output) {
  const config = opcoes.config ?? lerConfig();
  const modelo = opcoes.modelo ?? criarModelo(config, { logprobs: opcoes.logprobs });
  const inicio = performance.now();
  const resultado = await generateText({
    model: modelo,
    system: opcoes.system,
    prompt: opcoes.prompt,
    temperature: opcoes.temperature,
    ...(output ? { output } : {}),
    providerOptions: config.reasoningEffort
      ? { [NOME_PROVEDOR]: { reasoningEffort: config.reasoningEffort } }
      : undefined,
  });
  const uso: Uso = {
    tokensEntrada: resultado.usage.inputTokens,
    tokensSaida: resultado.usage.outputTokens,
    latenciaMs: Math.round(performance.now() - inicio),
  };
  return { resultado, uso };
}

function extrairLogprobs(metadata: unknown): LogprobToken[] | undefined {
  const brutos = (metadata as Record<string, { logprobs?: TokenBruto[] }> | undefined)?.[NOME_PROVEDOR]?.logprobs;
  return brutos?.map((t) => ({
    token: t.token,
    logprob: t.logprob,
    alternativas: t.top_logprobs ?? [],
  }));
}
