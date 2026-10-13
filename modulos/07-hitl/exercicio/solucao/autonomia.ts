// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
import { POLITICA_PADRAO, type Analise, type Nivel, type Pedido, type Politica } from "../src/estado.js";

export function nivelDeAutonomia(pedido: Pedido, analise: Analise, politica: Partial<Politica> = {}): Nivel {
  const p = { ...POLITICA_PADRAO, ...politica };
  if (pedido.valor > p.limiteAprovacao) return "bloqueado";
  if (analise.sugestao === "reembolsar" && pedido.valor <= p.limiteAutomatico && analise.confianca >= p.confiancaMinima) return "automatico";
  return "aprovacao";
}

export { POLITICA_PADRAO };
