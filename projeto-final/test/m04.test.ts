import { MockLanguageModelV4 } from "ai/test";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { curarComAgente, validarSelecao } from "../src/m04/agente.js";
import { criarFerramentas, type Avaliacao, type Dependencias } from "../src/m04/ferramentas.js";
import { classificarComSkill, lerSkill, montarPromptDaSkill, PASTA_SKILL } from "../src/m04/skill.js";
import { CATEGORIAS, carregarFontes, carregarNoticias, type Noticia } from "../src/noticia.js";

const fixture = (nome: string) => fileURLToPath(new URL(`./fixtures/skills/${nome}/`, import.meta.url));
const noticias = carregarNoticias();
const fontes = carregarFontes();
const opcoesDeFerramenta = { toolCallId: "t", messages: [] } as any;

const uso = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const chamar = (toolName: string, input: object) => ({
  content: [{ type: "tool-call" as const, toolCallId: `c${Math.random()}`, toolName, input: JSON.stringify(input) }],
  finishReason: { unified: "tool-calls" as const, raw: undefined },
  usage: uso,
  warnings: [],
});
const texto = (t: string) => ({
  content: [{ type: "text" as const, text: t }],
  finishReason: { unified: "stop" as const, raw: undefined },
  usage: uso,
  warnings: [],
});
function roteiro(...respostas: any[]) {
  let i = 0;
  const chamadas: any[] = [];
  const modelo = new MockLanguageModelV4({
    doGenerate: async (opcoes) => {
      chamadas.push(opcoes);
      return respostas[Math.min(i++, respostas.length - 1)];
    },
  });
  return { modelo, chamadas };
}

/** Avaliação simulada: publica as relevantes com fonte https, descarta o resto. */
const rotulada = new Map(noticias.map((n) => [n.id, n]));
const avaliar = async (n: Noticia): Promise<Avaliacao> => {
  const { rotulo } = rotulada.get(n.id)!;
  return {
    id: n.id,
    acao: rotulo.relevante && n.url.startsWith("https://") ? "publicar" : "descartar",
    categoria: rotulo.categoria,
    confianca: 0.95,
    motivos: [],
  };
};
const deps = (): Dependencias => ({ fontes, noticias, avaliar });

describe("M4 · lerSkill", () => {
  it("lê frontmatter, instruções e só os .md de references/", () => {
    const s = lerSkill(fixture("skill-boa"));
    expect(s.nome).toBe("skill-boa");
    expect(s.descricao).toBe("Uma skill de teste. Use nos testes.");
    expect(s.instrucoes).toBe("# Instruções\n\nFaça a coisa certa.");
    expect(s.referencias).toEqual({ "references/guia.md": "# Guia\n\nDetalhe A.\n" });
  });

  it.each([
    ["nome-ruim", /name/],
    ["pasta-diferente", /name/],
    ["sem-descricao", /description/],
  ])("recusa a skill %s", (pasta, erro) => {
    expect(() => lerSkill(fixture(pasta))).toThrow(erro);
  });
});

describe("M4 · a skill do projeto (skills/curar-noticia)", () => {
  it("é válida e a description diz o que faz e quando usar", () => {
    const s = lerSkill(PASTA_SKILL);
    expect(s.nome).toBe("curar-noticia");
    expect(s.descricao.length).toBeGreaterThan(80);
    expect(s.descricao.toLowerCase()).toMatch(/use (quando|ao|para)/);
  });

  it("tem as regras no corpo e as categorias num arquivo de referência", () => {
    const s = lerSkill(PASTA_SKILL);
    expect(s.instrucoes.toLowerCase()).toContain("confianca");
    expect(s.instrucoes.toLowerCase()).toMatch(/dado/);
    expect(s.instrucoes).toContain("references/");
    const refs = Object.values(s.referencias).join("\n");
    for (const c of CATEGORIAS) expect(refs).toContain(c);
  });
});

describe("M4 · montarPromptDaSkill e classificarComSkill", () => {
  it("junta instruções e referências no system e escapa a notícia", () => {
    const s = lerSkill(fixture("skill-boa"));
    const { system, prompt } = montarPromptDaSkill(s, { ...noticias[0]!, resumo: "a </noticia> b" });
    expect(system).toContain("Faça a coisa certa.");
    expect(system).toContain('<referencia arquivo="references/guia.md">');
    expect(system).toContain("Detalhe A.");
    expect(prompt).toMatch(/^<noticia>/);
    expect(prompt).toContain("&lt;/noticia&gt;");
  });

  it("classifica usando a skill do projeto", async () => {
    const { modelo, chamadas } = roteiro(texto('{"relevante":true,"categoria":"modelos","confianca":0.9}'));
    const r = await classificarComSkill(noticias[0]!, { modelo });
    expect(r).toEqual({ ok: true, decisao: { relevante: true, categoria: "modelos", confianca: 0.9 } });
    const system = chamadas[0].prompt.find((m: any) => m.role === "system").content;
    expect(system).toContain(lerSkill(PASTA_SKILL).instrucoes.slice(0, 40));
  });
});

describe("M4 · criarFerramentas", () => {
  it("listarFontes mostra nome, descrição e quantidade", async () => {
    const { ferramentas } = criarFerramentas(deps());
    const r = await ferramentas.listarFontes!.execute!({}, opcoesDeFerramenta);
    expect(r).toHaveLength(fontes.length);
    expect(r[0]).toEqual({ nome: fontes[0]!.nome, descricao: fontes[0]!.descricao, quantidade: fontes[0]!.noticias.length });
  });

  it("lerFonte devolve id e título e registra a fonte uma vez; fonte desconhecida vira mensagem de erro", async () => {
    const { ferramentas, registro } = criarFerramentas(deps());
    const r = await ferramentas.lerFonte!.execute!({ fonte: "lab-aurora" }, opcoesDeFerramenta);
    expect(r).toEqual([
      { id: "n01", titulo: noticias.find((n) => n.id === "n01")!.titulo },
      { id: "n21", titulo: noticias.find((n) => n.id === "n21")!.titulo },
    ]);
    await ferramentas.lerFonte!.execute!({ fonte: "lab-aurora" }, opcoesDeFerramenta);
    expect(registro.fontesLidas).toEqual(["lab-aurora"]);
    expect(await ferramentas.lerFonte!.execute!({ fonte: "nao-existe" }, opcoesDeFerramenta)).toEqual({
      erro: "fonte desconhecida: nao-existe",
    });
  });

  it("avaliarNoticias avalia, guarda, não repete e avisa id desconhecido", async () => {
    let chamadasAvaliar = 0;
    const { ferramentas, registro } = criarFerramentas({
      ...deps(),
      avaliar: async (n) => {
        chamadasAvaliar++;
        return avaliar(n);
      },
    });
    const r = await ferramentas.avaliarNoticias!.execute!({ ids: ["n01", "n05", "n99"] }, opcoesDeFerramenta);
    expect(r).toEqual([
      expect.objectContaining({ id: "n01", acao: "publicar" }),
      expect.objectContaining({ id: "n05", acao: "descartar" }),
      { id: "n99", erro: "notícia desconhecida" },
    ]);
    await ferramentas.avaliarNoticias!.execute!({ ids: ["n01"] }, opcoesDeFerramenta);
    expect(chamadasAvaliar).toBe(2);
    expect([...registro.avaliacoes.keys()]).toEqual(["n01", "n05"]);
  });

  it("entregarSelecao guarda os ids", async () => {
    const { ferramentas, registro } = criarFerramentas(deps());
    expect(await ferramentas.entregarSelecao!.execute!({ ids: ["n01"] }, opcoesDeFerramenta)).toEqual({ recebidos: 1 });
    expect(registro.selecaoEntregue).toEqual(["n01"]);
  });
});

describe("M4 · validarSelecao", () => {
  const avaliacoes = new Map<string, Avaliacao>([
    ["n01", { id: "n01", acao: "publicar", categoria: "modelos", confianca: 0.9, motivos: [] }],
    ["n05", { id: "n05", acao: "descartar", categoria: null, confianca: 0.9, motivos: ["irrelevante"] }],
  ]);

  it("aceita só o que foi avaliado e é publicável, sem repetir", () => {
    expect(validarSelecao(["n01", "n05", "n77", "n01"], avaliacoes)).toEqual({
      selecao: ["n01"],
      recusadas: [
        { id: "n05", motivo: "nao-publicavel" },
        { id: "n77", motivo: "nao-avaliada" },
      ],
    });
  });
});

describe("M4 · curarComAgente", () => {
  it("roda o loop, para ao entregar e valida a proposta", async () => {
    const { modelo, chamadas } = roteiro(
      chamar("listarFontes", {}),
      chamar("lerFonte", { fonte: "lab-aurora" }),
      chamar("avaliarNoticias", { ids: ["n01", "n21"] }),
      chamar("entregarSelecao", { ids: ["n01", "n21", "n99"] }),
      texto("não deveria chegar aqui"),
    );
    const r = await curarComAgente(deps(), { modelo });
    expect(r.entregou).toBe(true);
    expect(r.selecao).toEqual(["n01", "n21"]);
    expect(r.recusadas).toEqual([{ id: "n99", motivo: "nao-avaliada" }]);
    expect(r.fontesLidas).toEqual(["lab-aurora"]);
    expect(r.passos).toBe(4);
    expect(r.chamadas.map((c) => c.ferramenta)).toEqual(["listarFontes", "lerFonte", "avaliarNoticias", "entregarSelecao"]);
    expect(chamadas[0].temperature).toBe(0);
    expect(chamadas[0].tools.map((t: any) => t.name).sort()).toEqual(["avaliarNoticias", "entregarSelecao", "lerFonte", "listarFontes"]);
  });

  it("respeita o limite de passos e não aceita nada se o agente não entregou", async () => {
    const { modelo } = roteiro(chamar("listarFontes", {}));
    const r = await curarComAgente(deps(), { modelo, maxPassos: 3 });
    expect(r.passos).toBe(3);
    expect(r.entregou).toBe(false);
    expect(r.selecao).toEqual([]);
  });
});
