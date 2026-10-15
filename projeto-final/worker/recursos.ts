// Fornecido (M8): o que entra no pacote do Worker. No Workers não há disco: os feeds RSS e a lista de
// fontes viram texto dentro do bundle (wrangler.jsonc → rules "Text" para .xml e .md).
// Prepara também o AsyncLocalStorage do LangGraph: o wrangler empacota a entrada "browser" do
// @langchain/langgraph, que não o liga, e sem ele o interrupt() falha com
// "Called interrupt() outside the context of a graph".
import { AsyncLocalStorageProviderSingleton } from "@langchain/core/singletons";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Fonte } from "../src/noticia.js";
import fontes from "../../dados/fontes.json" with { type: "json" };
import anunciosELancamentos from "../../dados/rss/anuncios-e-lancamentos.xml";
import blogsDeEmpresas from "../../dados/rss/blogs-de-empresas.xml";
import engenhariaPragmatica from "../../dados/rss/engenharia-pragmatica.xml";
import fundacoesAbertas from "../../dados/rss/fundacoes-abertas.xml";
import labAurora from "../../dados/rss/lab-aurora.xml";
import negociosENuvem from "../../dados/rss/negocios-e-nuvem.xml";
import pesquisaAcademica from "../../dados/rss/pesquisa-academica.xml";
import regulatorio from "../../dados/rss/regulatorio.xml";
import repositoriosOss from "../../dados/rss/repositorios-oss.xml";
import variedades from "../../dados/rss/variedades.xml";

AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new AsyncLocalStorage());

export const FONTES = fontes as Fonte[];

export const FEEDS: Record<string, string> = {
  "anuncios-e-lancamentos": anunciosELancamentos,
  "blogs-de-empresas": blogsDeEmpresas,
  "engenharia-pragmatica": engenhariaPragmatica,
  "fundacoes-abertas": fundacoesAbertas,
  "lab-aurora": labAurora,
  "negocios-e-nuvem": negociosENuvem,
  "pesquisa-academica": pesquisaAcademica,
  regulatorio,
  "repositorios-oss": repositoriosOss,
  variedades,
};
