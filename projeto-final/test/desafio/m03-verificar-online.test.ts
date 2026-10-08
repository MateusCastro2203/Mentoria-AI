import { describe, expect, it, vi } from "vitest";
import { verificarFonteOnline } from "../../src/m03/desafio/verificar-online.js";

const resposta = (status: number) => vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status }));

describe("desafio M3 · verificarFonteOnline", () => {
  it("faz HEAD seguindo redirecionamentos e aceita 2xx/3xx", async () => {
    const f = resposta(200);
    expect(await verificarFonteOnline("https://example.com", { fetch: f as any })).toEqual({ ok: true, status: 200 });
    expect(f.mock.calls[0]![1]).toMatchObject({ method: "HEAD", redirect: "follow" });
    expect(await verificarFonteOnline("https://example.com", { fetch: resposta(301) as any })).toEqual({ ok: true, status: 301 });
  });

  it("recusa 4xx e 5xx", async () => {
    expect(await verificarFonteOnline("https://example.com", { fetch: resposta(404) as any })).toEqual({ ok: false, status: 404 });
    expect(await verificarFonteOnline("https://example.com", { fetch: resposta(503) as any })).toEqual({ ok: false, status: 503 });
  });

  it("diferencia timeout de erro de rede", async () => {
    const lento = vi.fn(
      (_u: string, init: RequestInit) =>
        new Promise<Response>((_, rejeitar) => init.signal!.addEventListener("abort", () => rejeitar(init.signal!.reason))),
    );
    expect(await verificarFonteOnline("https://example.com", { fetch: lento as any, timeoutMs: 20 })).toEqual({
      ok: false,
      erro: "timeout",
    });
    const quebrado = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await verificarFonteOnline("https://example.com", { fetch: quebrado as any })).toEqual({ ok: false, erro: "rede" });
  });
});
