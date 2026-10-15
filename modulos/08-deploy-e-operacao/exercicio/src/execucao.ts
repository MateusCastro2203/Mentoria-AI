// EXERCÍCIO 08 — a execução diária de um job agendado, do jeito que ela precisa ser em produção.
import { custo, estimarTokens } from "./custo.js";
import { chaveDoDia, ErroTransitorio, type Chamado, type Dependencias, type Politica, type Registro } from "./estado.js";

/** O texto que vai para o modelo (fornecido): os chamados do dia, um por linha. */
export function textoDosChamados(chamados: Chamado[]): string {
  return chamados.map((c) => `[${c.prioridade}] ${c.titulo}: ${c.texto}`).join("\n");
}

/**
 * Resume os chamados abertos em `data` (AAAA-MM-DD). Regras, nesta ordem:
 *
 * 1. IDEMPOTÊNCIA: se já existe um registro com status "ok" em chaveDoDia(data), devolva-o como está,
 *    sem chamar o modelo e sem gravar nada (o cron pode disparar duas vezes; o resumo não pode sair duas vezes).
 *    Registro com outro status ("falhou", "orcamento"…) não conta: rode de novo.
 * 2. Sem chamados naquele dia → status "sem-chamados" (sem chamar o modelo).
 * 3. ORÇAMENTO: custo estimado = custo({ tokensEntrada: estimarTokens(textoDosChamados(doDia)) }, politica.precos).
 *    Se passar de politica.orcamento → status "orcamento" (sem chamar o modelo).
 * 4. RETRY: chame deps.resumir(doDia). Se lançar ErroTransitorio e ainda houver tentativas
 *    (politica.maxTentativas no total), espere com deps.esperar(esperaInicialMs × 2^(n−1)) — n = tentativas
 *    que já falharam — e tente de novo. Qualquer outro erro: não tente de novo (não vai melhorar).
 *    Sucesso → status "ok" com resumo, tokens e custo (custo(uso, precos)). Desistiu → status "falhou" com erro
 *    (a mensagem do último erro).
 *
 * Em todos os casos (menos o 1), grave o registro em chaveDoDia(data) como JSON e devolva-o:
 * { data, status, chamados: <quantos do dia>, tentativas: <chamadas feitas a resumir>, tokensEntrada, tokensSaida,
 *   custo, resumo?, erro?, em: deps.agora().toISOString() } — tokens e custo 0 quando não houve resposta.
 */
export async function executarDia(deps: Dependencias, data: string, chamados: Chamado[], politica: Politica): Promise<Registro> {
  throw new Error("TODO: implemente executarDia");
}
