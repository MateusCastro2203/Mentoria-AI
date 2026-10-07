// ⚠️ SOLUÇÃO DE REFERÊNCIA — tente resolver em src/ antes de ler.
// Os mesmos testes rodam contra este arquivo com: pnpm --filter <pacote> test:solucao

// DESAFIO EXTRA — um "mini modelo de linguagem" de bigramas.
// Ele prevê a próxima palavra olhando só a anterior. Um LLM faz o mesmo jogo
// (prever o próximo token), só que olhando o contexto inteiro e com bilhões de parâmetros.
import { amostrar, type OpcoesAmostragem } from "../sampling.js";

export const INICIO = "<s>";
export const FIM = "</s>";

/** Para cada palavra, quantas vezes cada palavra seguinte apareceu no corpus. */
export type ModeloBigrama = Map<string, Map<string, number>>;

/**
 * Conta os bigramas do corpus. Cada frase: minúsculas, quebra por espaços,
 * com INICIO antes da primeira palavra e FIM depois da última.
 * Ex.: "O gato" → (<s>, o), (o, gato), (gato, </s>).
 */
export function treinarBigrama(corpus: string[]): ModeloBigrama {
  const modelo: ModeloBigrama = new Map();
  for (const frase of corpus) {
    const palavras = [INICIO, ...frase.toLowerCase().split(/\s+/).filter(Boolean), FIM];
    for (let i = 1; i < palavras.length; i++) {
      const seguintes = modelo.get(palavras[i - 1]!) ?? new Map<string, number>();
      seguintes.set(palavras[i]!, (seguintes.get(palavras[i]!) ?? 0) + 1);
      modelo.set(palavras[i - 1]!, seguintes);
    }
  }
  return modelo;
}

/**
 * Candidatos a próxima palavra depois de `anterior`, com logit = ln(contagem).
 * A ordem dos candidatos é a ordem em que apareceram pela primeira vez no corpus.
 */
export function logitsDoProximo(
  modelo: ModeloBigrama,
  anterior: string,
): { candidatos: string[]; logits: number[] } {
  const seguintes = modelo.get(anterior) ?? new Map<string, number>();
  return { candidatos: [...seguintes.keys()], logits: [...seguintes.values()].map(Math.log) };
}

/**
 * Gera uma frase token a token (autoregressivo): começa em INICIO, amostra a próxima palavra
 * com `amostrar`, repete até sair FIM ou atingir `maxPalavras`. Devolve as palavras unidas por espaço,
 * sem INICIO/FIM.
 */
export function gerarFrase(
  modelo: ModeloBigrama,
  opcoes: OpcoesAmostragem & { maxPalavras?: number } = {},
  aleatorio: () => number = Math.random,
): string {
  const { maxPalavras = 30, ...amostragem } = opcoes;
  const palavras: string[] = [];
  let anterior = INICIO;
  while (palavras.length < maxPalavras) {
    const { candidatos, logits } = logitsDoProximo(modelo, anterior);
    if (candidatos.length === 0) break;
    const proxima = candidatos[amostrar(logits, amostragem, aleatorio)]!;
    if (proxima === FIM) break;
    palavras.push(proxima);
    anterior = proxima;
  }
  return palavras.join(" ");
}
