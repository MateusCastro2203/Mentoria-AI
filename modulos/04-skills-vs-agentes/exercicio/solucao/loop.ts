// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export type Acao =
  | { tipo: "ferramenta"; nome: string; entrada: unknown }
  | { tipo: "resposta"; texto: string };

export type Evento =
  | { tipo: "ferramenta"; nome: string; entrada: unknown; saida: unknown }
  | { tipo: "erro"; nome: string; entrada: unknown; mensagem: string };

export type Decisor = (historico: Evento[]) => Promise<Acao> | Acao;

export type Ferramentas = Record<string, (entrada: any) => Promise<unknown> | unknown>;

export interface ResultadoDoLoop {
  resposta: string | null;
  motivo: "respondeu" | "limite-de-passos";
  historico: Evento[];
  passos: number;
}

export async function executarAgente(opcoes: {
  decidir: Decisor;
  ferramentas: Ferramentas;
  maxPassos: number;
}): Promise<ResultadoDoLoop> {
  const historico: Evento[] = [];
  for (let passos = 1; passos <= opcoes.maxPassos; passos++) {
    const acao = await opcoes.decidir(historico);
    if (acao.tipo === "resposta") return { resposta: acao.texto, motivo: "respondeu", historico, passos };
    const ferramenta = opcoes.ferramentas[acao.nome];
    if (!ferramenta) {
      historico.push({ tipo: "erro", nome: acao.nome, entrada: acao.entrada, mensagem: `ferramenta desconhecida: ${acao.nome}` });
      continue;
    }
    try {
      historico.push({ tipo: "ferramenta", nome: acao.nome, entrada: acao.entrada, saida: await ferramenta(acao.entrada) });
    } catch (erro) {
      historico.push({ tipo: "erro", nome: acao.nome, entrada: acao.entrada, mensagem: (erro as Error).message });
    }
  }
  return { resposta: null, motivo: "limite-de-passos", historico, passos: opcoes.maxPassos };
}
