// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

import type { Decisor, Evento, Ferramentas } from "../../src/loop.js";

export interface ResultadoProtegido {
  resposta: string | null;
  motivo: "respondeu" | "limite-de-passos" | "repeticao" | "orcamento";
  historico: Evento[];
  passos: number;
  custo: number;
}

export async function executarAgenteProtegido(opcoes: {
  decidir: Decisor;
  ferramentas: Ferramentas;
  maxPassos: number;
  maxRepeticoes: number;
  orcamento: number;
  custos?: Record<string, number>;
}): Promise<ResultadoProtegido> {
  const historico: Evento[] = [];
  let custo = 0;
  let ultima = "";
  let repeticoes = 0;
  for (let passos = 1; passos <= opcoes.maxPassos; passos++) {
    const acao = await opcoes.decidir(historico);
    if (acao.tipo === "resposta") return { resposta: acao.texto, motivo: "respondeu", historico, passos, custo };

    const chave = JSON.stringify([acao.nome, acao.entrada]);
    repeticoes = chave === ultima ? repeticoes + 1 : 1;
    ultima = chave;
    if (repeticoes >= opcoes.maxRepeticoes) return { resposta: null, motivo: "repeticao", historico, passos, custo };

    const ferramenta = opcoes.ferramentas[acao.nome];
    if (!ferramenta) {
      historico.push({ tipo: "erro", nome: acao.nome, entrada: acao.entrada, mensagem: `ferramenta desconhecida: ${acao.nome}` });
      continue;
    }
    const preco = opcoes.custos?.[acao.nome] ?? 1;
    if (custo + preco > opcoes.orcamento) return { resposta: null, motivo: "orcamento", historico, passos, custo };
    custo += preco;
    try {
      historico.push({ tipo: "ferramenta", nome: acao.nome, entrada: acao.entrada, saida: await ferramenta(acao.entrada) });
    } catch (erro) {
      historico.push({ tipo: "erro", nome: acao.nome, entrada: acao.entrada, mensagem: (erro as Error).message });
    }
  }
  return { resposta: null, motivo: "limite-de-passos", historico, passos: opcoes.maxPassos, custo };
}
