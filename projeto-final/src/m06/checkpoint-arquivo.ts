// Fornecido: um checkpointer do LangGraph que salva os checkpoints num arquivo JSON.
// É o MemorySaver (que guarda tudo em memória) + gravar/ler o arquivo. Serve para ver que um
// checkpoint é só dado: dá para matar o processo e retomar de onde parou.
// Em produção, use um checkpointer de banco (SQLite, Postgres…).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { MemorySaver } from "@langchain/langgraph";

type Arvore = Record<string, unknown>;

// Uint8Array não cabe em JSON: vira { $bytes: "<base64>" }.
const paraJson = (v: unknown): unknown =>
  v instanceof Uint8Array
    ? { $bytes: Buffer.from(v).toString("base64") }
    : Array.isArray(v)
      ? v.map(paraJson)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, paraJson(x)]))
        : v;
const deJson = (v: unknown): unknown =>
  v && typeof v === "object" && "$bytes" in (v as Arvore)
    ? new Uint8Array(Buffer.from(String((v as Arvore).$bytes), "base64"))
    : Array.isArray(v)
      ? v.map(deJson)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deJson(x)]))
        : v;

export class CheckpointEmArquivo extends MemorySaver {
  constructor(private readonly arquivo: string) {
    super();
    if (existsSync(arquivo)) {
      const salvo = deJson(JSON.parse(readFileSync(arquivo, "utf8"))) as { storage: MemorySaver["storage"]; writes: MemorySaver["writes"] };
      this.storage = salvo.storage;
      this.writes = salvo.writes;
    }
  }

  private salvar() {
    mkdirSync(dirname(this.arquivo), { recursive: true });
    writeFileSync(this.arquivo, JSON.stringify(paraJson({ storage: this.storage, writes: this.writes })));
  }

  override async put(...args: Parameters<MemorySaver["put"]>) {
    const r = await super.put(...args);
    this.salvar();
    return r;
  }

  override async putWrites(...args: Parameters<MemorySaver["putWrites"]>) {
    await super.putWrites(...args);
    this.salvar();
  }
}
