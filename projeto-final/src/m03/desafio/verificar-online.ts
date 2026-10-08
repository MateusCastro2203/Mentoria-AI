// DESAFIO EXTRA (M3) — "verificável" de verdade: a URL responde?
// Testes offline: o `fetch` é injetado.

/**
 * Faz uma requisição HEAD para a URL (com o `fetch` recebido) e devolve:
 * - { ok: true, status } se a resposta for 2xx ou 3xx;
 * - { ok: false, status } se for 4xx ou 5xx;
 * - { ok: false, erro: "timeout" } se não responder em `timeoutMs` (padrão 5000) — use AbortSignal.timeout;
 * - { ok: false, erro: "rede" } para qualquer outro erro de rede.
 * Use { method: "HEAD", redirect: "follow" }.
 */
export async function verificarFonteOnline(
  url: string,
  opcoes: { fetch?: typeof fetch; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status?: number; erro?: "timeout" | "rede" }> {
  throw new Error("TODO (desafio M3): implemente verificarFonteOnline");
}
