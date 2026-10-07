import { createOpenAICompatible, type MetadataExtractor } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { lerConfig, type ConfigLlm } from "./config.js";

/** Nome do provedor: é a chave usada em `providerOptions` e `providerMetadata`. */
export const NOME_PROVEDOR = "llm";

export interface OpcoesModelo {
  /** Pede ao provedor as log-probabilities de cada token gerado (nem todo provedor suporta). */
  logprobs?: boolean;
  /** Quantas alternativas por token devolver junto com os logprobs. */
  topLogprobs?: number;
}

/**
 * Cria o modelo a partir da configuração. É o único ponto do repositório que conhece o provedor:
 * trocar Ollama por um endpoint remoto é só mudar o `.env`.
 */
export function criarModelo(config: ConfigLlm = lerConfig(), opcoes: OpcoesModelo = {}): LanguageModel {
  const provedor = createOpenAICompatible({
    name: NOME_PROVEDOR,
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    supportsStructuredOutputs: true,
    transformRequestBody: opcoes.logprobs
      ? (body) => ({ ...body, logprobs: true, top_logprobs: opcoes.topLogprobs ?? 5 })
      : undefined,
    metadataExtractor: opcoes.logprobs ? extratorLogprobs : undefined,
  });
  return provedor.chatModel(config.modelo);
}

// Os logprobs vêm fora do formato padrão do AI SDK; copiamos para providerMetadata.llm.logprobs.
const extratorLogprobs: MetadataExtractor = {
  async extractMetadata({ parsedBody }: { parsedBody: unknown }) {
    const conteudo = (parsedBody as RespostaChat)?.choices?.[0]?.logprobs?.content;
    return conteudo ? { [NOME_PROVEDOR]: { logprobs: conteudo } } : undefined;
  },
  createStreamExtractor() {
    const tokens: TokenBruto[] = [];
    return {
      processChunk(chunk: unknown) {
        tokens.push(...((chunk as RespostaChat)?.choices?.[0]?.logprobs?.content ?? []));
      },
      buildMetadata: () => (tokens.length ? { [NOME_PROVEDOR]: { logprobs: tokens } } : undefined),
    };
  },
};

// `type` (e não `interface`) para ser atribuível a JSONValue no providerMetadata.
export type TokenBruto = {
  token: string;
  logprob: number;
  top_logprobs?: { token: string; logprob: number }[];
};

interface RespostaChat {
  choices?: { logprobs?: { content?: TokenBruto[] } }[];
}
