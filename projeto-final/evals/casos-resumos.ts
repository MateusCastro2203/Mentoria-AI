// Um caso por notícia relevante com fonte válida (as que poderiam ir para a newsletter).
import { carregarNoticias } from "../src/noticia.js";

export default function gerarCasos() {
  return carregarNoticias()
    .filter((n) => n.rotulo.relevante && n.url.startsWith("https://"))
    .map((n) => ({ description: `${n.id} · ${n.titulo}`, vars: { id: n.id, titulo: n.titulo, resumo: n.resumo } }));
}
