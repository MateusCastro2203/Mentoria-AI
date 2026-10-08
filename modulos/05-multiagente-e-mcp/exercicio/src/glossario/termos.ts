// Fornecido: os dados do glossário (termos da mentoria).
export interface Termo {
  termo: string;
  definicao: string;
  modulo: number;
}

export const TERMOS: Termo[] = [
  { termo: "token", definicao: "Pedaço de texto que o modelo enxerga: uma palavra, parte de palavra ou pontuação.", modulo: 1 },
  { termo: "temperatura", definicao: "Parâmetro que controla o quanto o sorteio do próximo token favorece o mais provável.", modulo: 1 },
  { termo: "janela de contexto", definicao: "Máximo de tokens que o modelo considera numa chamada, somando entrada e saída.", modulo: 1 },
  { termo: "alucinação", definicao: "Afirmação falsa gerada com a mesma fluência de uma verdadeira.", modulo: 1 },
  { termo: "decisão estruturada", definicao: "Escolha tipada de um conjunto fechado de opções, acompanhada de confiança.", modulo: 2 },
  { termo: "calibração", definicao: "Quando a confiança informada acompanha a taxa de acerto real.", modulo: 2 },
  { termo: "eval", definicao: "Teste automatizado de um sistema com IA: casos, execução e métricas.", modulo: 3 },
  { termo: "guardrail", definicao: "Verificação no código que impede algo indesejado de entrar no modelo ou sair para o mundo.", modulo: 3 },
  { termo: "prompt injection", definicao: "Instruções escondidas em um texto que deveria ser só dado, e que o modelo acaba seguindo.", modulo: 3 },
  { termo: "skill", definicao: "Pasta reutilizável com instruções e referências para uma tarefa, no formato Agent Skills.", modulo: 4 },
  { termo: "agente", definicao: "Modelo num loop que escolhe a próxima ação, usa ferramentas e decide quando parar.", modulo: 4 },
  { termo: "mcp", definicao: "Model Context Protocol: padrão aberto para expor ferramentas, recursos e prompts a aplicações com LLM.", modulo: 5 },
];
