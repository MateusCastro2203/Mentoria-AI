// Provider usado como JUIZ nas asserções llm-rubric: o mesmo modelo do .env, via @mentoria/llm.
// Atenção: juiz = mesmo modelo que gerou o resumo. Isso tende a inflar as notas (veja conceitos.md).
import { gerarTexto } from "@mentoria/llm";

export default class Juiz {
  id = () => "juiz";

  callApi = async (prompt: string) => {
    const { texto, uso } = await gerarTexto({ prompt, temperature: 0 });
    return {
      output: texto,
      tokenUsage: { prompt: uso.tokensEntrada, completion: uso.tokensSaida, total: (uso.tokensEntrada ?? 0) + (uso.tokensSaida ?? 0) },
    };
  };
}
