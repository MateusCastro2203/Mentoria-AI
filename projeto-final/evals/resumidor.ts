// Provider do promptfoo que gera o resumo da notícia {{id}} com resumir() (etapa M3).
import { carregarNoticias } from "../src/noticia.js";
import { resumir } from "./modulos.js";

const noticias = carregarNoticias();

export default class Resumidor {
  id = () => "resumidor";

  callApi = async (_prompt: string, contexto: { vars: Record<string, unknown> }) => {
    const noticia = noticias.find((n) => n.id === contexto.vars.id);
    if (!noticia) return { error: `notícia ${String(contexto.vars.id)} não encontrada` };
    return { output: await resumir(noticia) };
  };
}
