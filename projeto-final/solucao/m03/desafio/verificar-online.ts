// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export async function verificarFonteOnline(
  url: string,
  opcoes: { fetch?: typeof fetch; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status?: number; erro?: "timeout" | "rede" }> {
  const buscar = opcoes.fetch ?? fetch;
  try {
    const resposta = await buscar(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(opcoes.timeoutMs ?? 5000),
    });
    return { ok: resposta.status < 400, status: resposta.status };
  } catch (erro) {
    const nome = (erro as Error)?.name;
    return { ok: false, erro: nome === "TimeoutError" || nome === "AbortError" ? "timeout" : "rede" };
  }
}
