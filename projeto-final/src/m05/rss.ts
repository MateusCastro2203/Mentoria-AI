// Fornecido: lê um feed RSS 2.0 e devolve os itens. O servidor MCP de fontes usa isto.
import { XMLParser } from "fast-xml-parser";

export interface ItemRss {
  id: string;
  titulo: string;
  url: string;
  resumo: string;
  fonte: string;
  publicadaEm: string;
}

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

export function lerRss(xml: string): ItemRss[] {
  const canal = parser.parse(xml)?.rss?.channel;
  const itens = canal?.item ? (Array.isArray(canal.item) ? canal.item : [canal.item]) : [];
  return itens.map((i: Record<string, string>) => ({
    id: String(i.guid),
    titulo: String(i.title ?? ""),
    url: String(i.link ?? ""),
    resumo: String(i.description ?? ""),
    fonte: String(i.author ?? ""),
    publicadaEm: new Date(String(i.pubDate)).toISOString().slice(0, 10),
  }));
}
