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
  throw new Error("TODO (desafio): implemente treinarBigrama");
}

/**
 * Candidatos a próxima palavra depois de `anterior`, com logit = ln(contagem).
 * A ordem dos candidatos é a ordem em que apareceram pela primeira vez no corpus.
 */
export function logitsDoProximo(
  modelo: ModeloBigrama,
  anterior: string,
): { candidatos: string[]; logits: number[] } {
  throw new Error("TODO (desafio): implemente logitsDoProximo");
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
  throw new Error("TODO (desafio): implemente gerarFrase");
}
