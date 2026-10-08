// Gera dados/rss/<fonte>.xml (RSS 2.0) a partir de dados/fontes.json e dados/noticias.json.
// Os feeds são o que o servidor MCP de fontes lê (Módulo 5). Rode de novo se mudar o dataset:
//   pnpm gerar-rss
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const raiz = new URL("../dados/", import.meta.url);
const fontes: { nome: string; descricao: string; noticias: string[] }[] = JSON.parse(readFileSync(new URL("fontes.json", raiz), "utf8"));
const noticias: { id: string; titulo: string; resumo: string; fonte: string; url: string; publicadaEm: string }[] = JSON.parse(
  readFileSync(new URL("noticias.json", raiz), "utf8"),
);
const porId = new Map(noticias.map((n) => [n.id, n]));
const xml = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

mkdirSync(new URL("rss/", raiz), { recursive: true });
for (const f of fontes) {
  const itens = f.noticias.map((id) => {
    const n = porId.get(id)!;
    return [
      "    <item>",
      `      <guid isPermaLink="false">${n.id}</guid>`,
      `      <title>${xml(n.titulo)}</title>`,
      `      <link>${xml(n.url)}</link>`,
      `      <description>${xml(n.resumo)}</description>`,
      `      <author>${xml(n.fonte)}</author>`,
      `      <pubDate>${new Date(`${n.publicadaEm}T12:00:00Z`).toUTCString()}</pubDate>`,
      "    </item>",
    ].join("\n");
  });
  const doc = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${xml(f.nome)}</title>`,
    `    <description>${xml(f.descricao)}</description>`,
    `    <link>https://example.com/feeds/${f.nome}</link>`,
    ...itens,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
  writeFileSync(new URL(`rss/${f.nome}.xml`, raiz), doc);
}
console.log(`${fontes.length} feeds gravados em dados/rss/`);
