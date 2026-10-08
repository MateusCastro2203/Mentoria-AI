// Carrega o código do curador: o seu (src/) ou a solução de referência (solucao/) se SOLUCAO=1.
const usarSolucao = Boolean(process.env.SOLUCAO);

export const { classificarTipado }: typeof import("../src/m02/classificar-tipado.js") = usarSolucao
  ? await import("../solucao/m02/classificar-tipado.js")
  : await import("../src/m02/classificar-tipado.js");
export const { montarPromptV2 }: typeof import("../src/m03/prompt-v2.js") = usarSolucao
  ? await import("../solucao/m03/prompt-v2.js")
  : await import("../src/m03/prompt-v2.js");
export const { decidirPublicacao }: typeof import("../src/m03/guardrails.js") = usarSolucao
  ? await import("../solucao/m03/guardrails.js")
  : await import("../src/m03/guardrails.js");
export const { resumir }: typeof import("../src/m03/resumir.js") = usarSolucao
  ? await import("../solucao/m03/resumir.js")
  : await import("../src/m03/resumir.js");
