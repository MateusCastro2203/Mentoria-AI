// Fornecido: os casos da aula para a turma classificar (domínios diferentes do projeto final),
// com as respostas às perguntas do framework, a resposta esperada e a justificativa.
import type { Abordagem, Caso } from "./framework.js";

export interface CasoDaAula {
  id: string;
  titulo: string;
  descricao: string;
  caso: Caso;
  esperado: Abordagem;
  justificativa: string;
}

export const CASOS_DA_AULA: CasoDaAula[] = [
  {
    id: "comunicado",
    titulo: "Reescrever um comunicado",
    descricao:
      "O RH precisa reescrever, uma única vez, um comunicado interno sobre a mudança no horário do escritório, em linguagem mais simples e acolhedora.",
    caso: { saida: "texto", passos: "fixos", precisaDeFerramentas: false, reuso: "pontual", conhecimentoEspecifico: false, volumeAlto: false },
    esperado: "prompt",
    justificativa:
      "É texto para pessoas, uma vez, sem dados externos nem conhecimento especial. Um bom prompt num chat resolve; empacotar ou automatizar seria custo sem retorno.",
  },
  {
    id: "tickets",
    titulo: "Rotear tickets de suporte",
    descricao:
      "Uma loja on-line recebe cerca de 30 mil tickets por dia e precisa mandar cada um para uma de 8 filas (pagamento, entrega, troca…), com os duvidosos indo para uma pessoa.",
    caso: { saida: "decisao", passos: "fixos", precisaDeFerramentas: false, reuso: "recorrente", conhecimentoEspecifico: false, volumeAlto: true },
    esperado: "decisao-estruturada",
    justificativa:
      "A saída é uma escolha entre 8 opções que o código usa, sempre do mesmo jeito, em alto volume. Decisão tipada com confiança (LLM com schema ou um modelo de decisão) é mais barata, rápida e previsível, e a confiança decide o que vai para humano.",
  },
  {
    id: "contratos",
    titulo: "Revisar contratos com o checklist jurídico",
    descricao:
      "O jurídico tem um checklist de 40 itens e cláusulas-modelo. Times diferentes querem usar a mesma revisão no chat interno e no editor de código antes de mandar contratos de fornecedores para o jurídico.",
    caso: { saida: "texto", passos: "fixos", precisaDeFerramentas: false, reuso: "recorrente", conhecimentoEspecifico: true, volumeAlto: false },
    esperado: "skill",
    justificativa:
      "Os passos são fixos (seguir o checklist), mas o conhecimento é extenso e precisa ser o mesmo em vários lugares. Empacotar instruções, checklist e cláusulas-modelo como skill dá reuso e consistência sem dar autonomia a ninguém.",
  },
  {
    id: "incidente",
    titulo: "Investigar um incidente de produção",
    descricao:
      "O tempo de resposta de uma API subiu de repente. É preciso olhar logs, métricas e os últimos deploys, levantar hipóteses e testá-las até achar a causa provável.",
    caso: { saida: "texto", passos: "variaveis", precisaDeFerramentas: true, reuso: "recorrente", conhecimentoEspecifico: true, volumeAlto: false },
    esperado: "agente",
    justificativa:
      "Não dá para saber de antemão quais consultas serão necessárias: o próximo passo depende do que o anterior revelou, e cada passo usa uma ferramenta. É um loop com ferramentas, com limites (passos, custo) e com um humano aprovando qualquer ação que mude o sistema.",
  },
];
