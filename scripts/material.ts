/**
 * pnpm material [filtro]: gera o material de cada módulo que tem a pasta material/.
 *
 *   material/slides.md    → apresentacao.pdf + apresentacao.pptx (Marp; o PPTX leva as notas do apresentador)
 *   material/<nome>.json   → <nome>.pdf (apostila, guia do mentor…: junta trechos dos .md do repositório)
 *
 * Precisa de Chrome, Edge ou Chromium instalado (ou CHROME_PATH apontando para ele).
 * Ex.: pnpm material 01
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { marpCli } from "@marp-team/marp-cli";
import { Marked } from "marked";

const RAIZ = resolve(import.meta.dirname, "..");
const TEMA_SLIDES = join(RAIZ, "material/tema-slides.css");
const CSS_APOSTILA = join(RAIZ, "material/apostila.css");
const REPO_URL = "https://github.com/MateusCastro2203/Mentoria-AI/blob/main";

interface Fonte {
  /** Caminho a partir da raiz do repositório. */
  arquivo: string;
  /** Título do capítulo na apostila. */
  titulo: string;
  /** Se presente, inclui só estas seções (texto exato do título); senão, o arquivo inteiro sem o H1. */
  secoes?: string[];
}

interface ConfigApostila {
  /** Rótulo pequeno acima do título da capa (padrão: "Apostila"). */
  selo?: string;
  titulo: string;
  subtitulo: string;
  fontes: Fonte[];
}

const filtro = process.argv[2] ?? "";
const modulos = readdirSync(join(RAIZ, "modulos"))
  .filter((m) => m.startsWith(filtro) && existsSync(join(RAIZ, "modulos", m, "material")))
  .sort();

if (modulos.length === 0) {
  console.error(`Nenhum módulo com material/ encontrado para "${filtro}".`);
  process.exit(1);
}

for (const modulo of modulos) {
  const pasta = join(RAIZ, "modulos", modulo, "material");
  console.log(`\n▸ ${modulo}`);
  if (existsSync(join(pasta, "slides.md"))) await gerarSlides(pasta);
  for (const manifesto of readdirSync(pasta).filter((f) => f.endsWith(".json")).sort()) {
    gerarDocumento(pasta, manifesto.replace(/\.json$/, ""));
  }
}

async function gerarSlides(pasta: string) {
  const entrada = join(pasta, "slides.md");
  for (const formato of ["pdf", "pptx"] as const) {
    const saida = join(pasta, `apresentacao.${formato}`);
    const status = await marpCli([
      entrada,
      `--${formato}`,
      "--theme-set",
      TEMA_SLIDES,
      "--html",
      "--quiet",
      "--no-config-file",
      "-o",
      saida,
    ]);
    if (status !== 0) throw new Error(`Marp falhou ao gerar ${saida}`);
    console.log(`  ✔ ${relative(RAIZ, saida)}`);
  }
}

function gerarDocumento(pasta: string, nome: string) {
  const config: ConfigApostila = JSON.parse(readFileSync(join(pasta, `${nome}.json`), "utf8"));

  const capitulos = config.fontes.map((fonte, i) => {
    const caminho = join(RAIZ, fonte.arquivo);
    const markdown = readFileSync(caminho, "utf8");
    const trecho = fonte.secoes
      ? fonte.secoes.map((s) => extrairSecao(markdown, s, fonte.arquivo)).join("\n\n")
      : semTitulo(markdown);
    const html = criarMarked(fonte.arquivo).parse(trecho) as string;
    return { id: `cap-${i + 1}`, titulo: fonte.titulo, html };
  });

  const documento = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${config.titulo}</title>
<style>${readFileSync(CSS_APOSTILA, "utf8")}</style></head>
<body>
<section class="capa">
  <p class="selo">Mentoria de IA aplicada · ${config.selo ?? "Apostila"}</p>
  <h1>${config.titulo}</h1>
  <p class="subtitulo">${config.subtitulo}</p>
  <nav><ol>${capitulos.map((c) => `<li><a href="#${c.id}">${c.titulo}</a></li>`).join("")}</ol></nav>
  <p class="rodape">Fonte: ${REPO_URL.replace("/blob/main", "")}</p>
</section>
${capitulos.map((c) => `<section class="capitulo" id="${c.id}"><h1>${c.titulo}</h1>${c.html}</section>`).join("\n")}
</body></html>`;

  const html = join(mkdtempSync(join(tmpdir(), "material-")), `${nome}.html`);
  writeFileSync(html, documento);
  const saida = join(pasta, `${nome}.pdf`);
  imprimirPdf(html, saida);
  console.log(`  ✔ ${relative(RAIZ, saida)}`);
}

/** Converte links relativos em links para o GitHub (no PDF, caminho local não abre). */
function criarMarked(arquivo: string) {
  return new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type !== "link" && token.type !== "image") return;
      if (/^(https?:|mailto:|#)/.test(token.href)) return;
      const alvo = relative(RAIZ, resolve(RAIZ, dirname(arquivo), token.href.split("#")[0]!));
      token.href = `${REPO_URL}/${alvo}`;
    },
  });
}

function semTitulo(markdown: string): string {
  return markdown.replace(/^# .*\n/, "");
}

function extrairSecao(markdown: string, titulo: string, arquivo: string): string {
  const linhas = markdown.split("\n");
  const inicio = linhas.findIndex((l) => /^#{1,6} /.test(l) && l.replace(/^#+ /, "").trim() === titulo);
  if (inicio === -1) throw new Error(`Seção "${titulo}" não encontrada em ${arquivo}`);
  const nivel = linhas[inicio]!.match(/^#+/)![0].length;
  let fim = linhas.length;
  let emCodigo = false;
  for (let i = inicio + 1; i < linhas.length; i++) {
    if (linhas[i]!.startsWith("```")) emCodigo = !emCodigo;
    const m = !emCodigo && linhas[i]!.match(/^(#+) /);
    if (m && m[1]!.length <= nivel) {
      fim = i;
      break;
    }
  }
  // A seção vira subtítulo (##) dentro do capítulo, qualquer que fosse o nível original.
  return ["## " + titulo, ...linhas.slice(inicio + 1, fim)].join("\n");
}

function imprimirPdf(html: string, saida: string) {
  const navegador = encontrarNavegador();
  const r = spawnSync(
    navegador,
    ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${saida}`, pathToFileURL(html).href],
    { encoding: "utf8" },
  );
  if (r.status !== 0 || !existsSync(saida)) throw new Error(`Falha ao imprimir o PDF:\n${r.stderr}`);
}

function encontrarNavegador(): string {
  const candidatos = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter((c): c is string => Boolean(c));
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error("Nenhum Chrome/Edge/Chromium encontrado. Defina CHROME_PATH.");
  return achado;
}
