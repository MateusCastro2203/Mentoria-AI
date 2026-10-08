// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

export type Abordagem = "prompt" | "skill" | "agente" | "decisao-estruturada";

export interface Caso {
  saida: "texto" | "decisao";
  passos: "fixos" | "variaveis";
  precisaDeFerramentas: boolean;
  reuso: "pontual" | "recorrente";
  conhecimentoEspecifico: boolean;
  volumeAlto: boolean;
}

export function recomendarAbordagem(caso: Caso): { abordagem: Abordagem; motivos: string[] } {
  let abordagem: Abordagem;
  let motivo: string;
  if (caso.passos === "variaveis" && caso.precisaDeFerramentas) {
    abordagem = "agente";
    motivo = "passos variáveis com ferramentas: o próximo passo depende do que se descobre";
  } else if (caso.saida === "decisao" && caso.passos === "fixos") {
    abordagem = "decisao-estruturada";
    motivo = "saída é uma decisão de conjunto fechado, com passos fixos";
  } else if (caso.reuso === "recorrente" || caso.conhecimentoEspecifico) {
    abordagem = "skill";
    motivo = caso.reuso === "recorrente"
      ? "reuso recorrente: vale empacotar instruções e referências"
      : "conhecimento específico extenso: vale empacotar instruções e referências";
  } else {
    abordagem = "prompt";
    motivo = "tarefa pontual de texto, sem ferramentas nem conhecimento extenso";
  }
  const motivos = [motivo];
  if (caso.volumeAlto) motivos.push("alto volume: custo e latência por chamada pesam");
  return { abordagem, motivos };
}
