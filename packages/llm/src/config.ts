/** Configuração do provedor de modelo, lida de variáveis de ambiente. */
export interface ConfigLlm {
  /** Endpoint compatível com a API da OpenAI (Ollama expõe um em /v1). */
  baseURL: string;
  modelo: string;
  apiKey?: string;
  /** Repassado como `reasoning_effort`. Em modelos com "thinking" (ex.: qwen3), `none` desliga o raciocínio e acelera a resposta. */
  reasoningEffort?: string;
}

export const CONFIG_PADRAO = {
  baseURL: "http://localhost:11434/v1",
  modelo: "qwen3:4b-instruct",
} as const;

export function lerConfig(env: NodeJS.ProcessEnv = process.env): ConfigLlm {
  return {
    baseURL: env.LLM_BASE_URL || CONFIG_PADRAO.baseURL,
    modelo: env.LLM_MODEL || CONFIG_PADRAO.modelo,
    apiKey: env.LLM_API_KEY || undefined,
    reasoningEffort: env.LLM_REASONING_EFFORT || undefined,
  };
}
