// Fornecido (M8): o checkpointer do LangGraph guardado num armazenamento chave → valor (Workers KV).
// Mesma ideia do CheckpointEmArquivo (M6): é o MemorySaver + ler/gravar tudo como JSON.
// Diferença importante: o KV aceita no máximo 1 escrita por segundo na mesma chave, e o grafo grava
// checkpoints várias vezes por segundo. Então aqui NÃO gravamos a cada passo: o Worker chama `salvar()`
// uma vez, quando o grafo termina ou pausa. Se o Worker cair no meio, perde o trabalho daquela execução.
// Em produção, prefira um checkpointer de banco (SQLite em Durable Object, D1, Postgres): grava a cada passo
// e serializa o acesso. Dois Workers mexendo na mesma thread ao mesmo tempo, aqui, um apaga o outro.
import { MemorySaver } from "@langchain/langgraph";
import { deJson, paraJson } from "../m06/checkpoint-arquivo.js";
import type { Armazenamento } from "./armazenamento.js";

export class CheckpointEmKV extends MemorySaver {
  private constructor(
    private readonly arm: Armazenamento,
    private readonly chave: string,
  ) {
    super();
  }

  static async abrir(arm: Armazenamento, chave: string): Promise<CheckpointEmKV> {
    const cp = new CheckpointEmKV(arm, chave);
    const texto = await arm.get(chave);
    if (texto) {
      const salvo = deJson(JSON.parse(texto)) as { storage: MemorySaver["storage"]; writes: MemorySaver["writes"] };
      cp.storage = salvo.storage;
      cp.writes = salvo.writes;
    }
    return cp;
  }

  async salvar(): Promise<void> {
    await this.arm.put(this.chave, JSON.stringify(paraJson({ storage: this.storage, writes: this.writes })));
  }
}
