// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export type RespostaDoAgente = { resposta: string } | { transferirPara: string; mensagem: string };

export async function executarHandoffs(opcoes: {
  agentes: Record<string, (mensagem: string) => Promise<RespostaDoAgente>>;
  inicial: string;
  mensagem: string;
  maxTransferencias: number;
}): Promise<{ resposta: string | null; caminho: string[]; motivo: "respondeu" | "desconhecido" | "ciclo" | "limite" }> {
  const caminho = [opcoes.inicial];
  let atual = opcoes.inicial;
  let mensagem = opcoes.mensagem;
  let transferencias = 0;
  for (;;) {
    const agente = opcoes.agentes[atual];
    if (!agente) return { resposta: null, caminho, motivo: "desconhecido" };
    const r = await agente(mensagem);
    if ("resposta" in r) return { resposta: r.resposta, caminho, motivo: "respondeu" };
    if (!opcoes.agentes[r.transferirPara]) return { resposta: null, caminho, motivo: "desconhecido" };
    if (caminho.includes(r.transferirPara)) return { resposta: null, caminho, motivo: "ciclo" };
    if (++transferencias > opcoes.maxTransferencias) return { resposta: null, caminho, motivo: "limite" };
    caminho.push(r.transferirPara);
    atual = r.transferirPara;
    mensagem = r.mensagem;
  }
}
