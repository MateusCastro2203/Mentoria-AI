// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao
import { chaveDoDia, ErroTransitorio, type Chamado, type Dependencias, type Politica, type Registro } from "../src/estado.js";
import { custo, estimarTokens } from "./custo.js";

export function textoDosChamados(chamados: Chamado[]): string {
  return chamados.map((c) => `[${c.prioridade}] ${c.titulo}: ${c.texto}`).join("\n");
}

export async function executarDia(deps: Dependencias, data: string, chamados: Chamado[], politica: Politica): Promise<Registro> {
  const anterior = await deps.armazenamento.get(chaveDoDia(data));
  if (anterior) {
    const registro = JSON.parse(anterior) as Registro;
    if (registro.status === "ok") return registro;
  }

  const doDia = chamados.filter((c) => c.aberto === data);
  const base = { data, chamados: doDia.length, tentativas: 0, tokensEntrada: 0, tokensSaida: 0, custo: 0 };
  const gravar = async (r: Omit<Registro, "em">) => {
    const registro: Registro = { ...r, em: deps.agora().toISOString() };
    await deps.armazenamento.put(chaveDoDia(data), JSON.stringify(registro));
    return registro;
  };

  if (!doDia.length) return gravar({ ...base, status: "sem-chamados" });

  const estimado = custo({ tokensEntrada: estimarTokens(textoDosChamados(doDia)) }, politica.precos);
  if (estimado > politica.orcamento) return gravar({ ...base, status: "orcamento" });

  let tentativas = 0;
  for (;;) {
    tentativas++;
    try {
      const { texto, uso } = await deps.resumir(doDia);
      return gravar({
        ...base,
        status: "ok",
        tentativas,
        tokensEntrada: uso.tokensEntrada ?? 0,
        tokensSaida: uso.tokensSaida ?? 0,
        custo: custo(uso, politica.precos),
        resumo: texto,
      });
    } catch (e) {
      const erro = e instanceof Error ? e.message : String(e);
      if (!(e instanceof ErroTransitorio) || tentativas >= politica.maxTentativas) {
        return gravar({ ...base, status: "falhou", tentativas, erro });
      }
      await deps.esperar(politica.esperaInicialMs * 2 ** (tentativas - 1));
    }
  }
}
