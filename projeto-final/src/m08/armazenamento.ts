// Fornecido (M8): o mínimo que usamos de um armazenamento chave → valor. O Workers KV
// (`env.CURADOR`) já tem esse formato; nos testes e scripts, usamos um Map em memória.
export interface Armazenamento {
  get(chave: string): Promise<string | null>;
  put(chave: string, valor: string): Promise<void>;
}

export function armazenamentoEmMemoria(inicial: Record<string, string> = {}): Armazenamento & { dados: Map<string, string> } {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    async get(chave) {
      return dados.get(chave) ?? null;
    },
    async put(chave, valor) {
      dados.set(chave, valor);
    },
  };
}

export async function lerJson<T>(arm: Armazenamento, chave: string): Promise<T | null> {
  const texto = await arm.get(chave);
  return texto === null ? null : (JSON.parse(texto) as T);
}

export async function gravarJson(arm: Armazenamento, chave: string, valor: unknown): Promise<void> {
  await arm.put(chave, JSON.stringify(valor));
}
