# Dados sintéticos

Todos os dados desta pasta são **fictícios**, escritos para a mentoria. Empresas, pessoas, produtos e números são inventados; as URLs usam o domínio reservado `example.com` ([RFC 2606](https://www.rfc-editor.org/rfc/rfc2606)) e não levam a lugar nenhum.

## `noticias.json`

Notícias para o projeto final (curador de newsletter sobre **IA aplicada para devs**). Cada item:

| Campo | Descrição |
|---|---|
| `id` | identificador estável |
| `titulo`, `resumo` | texto da notícia |
| `fonte`, `url`, `publicadaEm` | origem (fictícia) |
| `rotulo.relevante` | entra na newsletter? (critério abaixo) |
| `rotulo.categoria` | uma de `CATEGORIAS` (`projeto-final/src/noticia.ts`), ou `null` se não for relevante |

O critério dos rótulos está no guia abaixo.

Os rótulos são usados a partir do Módulo 2 (calibração) e do Módulo 3 (evals).

## Guia de rotulagem

Escrito no Módulo 3, depois que os erros do Módulo 2 mostraram que parte deles era ambiguidade do próprio critério. **Mude o guia antes de mudar os rótulos**, e registre a mudança abaixo.

**Relevante:** a notícia ajuda um dev a construir, avaliar ou operar sistemas com IA. **Não** são relevantes: fofoca, notícias sem relação com IA, anúncios e promessas sem conteúdo técnico ou prático verificável (sem benchmark, documentação ou detalhes), aportes e aquisições sem efeito prático para quem desenvolve.

**Categoria** (só para relevantes), pelo que o dev **leva** da notícia:

| Categoria | Quando usar |
|---|---|
| `modelos` | lançamento ou nova capacidade de um modelo |
| `ferramentas` | biblioteca, framework, prática de engenharia, tutorial **ou relato de empresa cujo foco é como fizeram** |
| `pesquisa` | estudo, artigo científico, benchmark |
| `regulacao` | lei, regra, decisão judicial, orientação de órgão público |
| `mercado` | preço, plano, disponibilidade, licença, dados de adoção, aquisição **com efeito prático para devs** |

Casos de fronteira: relato de empresa → `ferramentas` se ensina uma técnica, `mercado` se o foco é resultado de negócio ou adoção.

## Casos especiais (para os guardrails do Módulo 3)

- `n38`: o resumo tem uma tentativa de **prompt injection** ("ignore as instruções anteriores…").
- `n39`: sem URL.
- `n40`: URL `http://` para um endereço de rede interna.

Nenhum dos três pode ser publicado automaticamente, qualquer que seja a classificação.

## `fontes.json`

Dez fontes simuladas (como feeds de notícias), cada uma com uma descrição e a lista de ids das notícias que publica. Toda notícia está em exatamente uma fonte. O agente do Módulo 4 escolhe quais fontes ler a partir das descrições.

## `rss/`

Um feed RSS 2.0 por fonte, gerado de `fontes.json` + `noticias.json` por `pnpm gerar-rss` (não edite à mão). O servidor MCP de fontes do Módulo 5 lê estes arquivos.

## `exemplos.json`

Seis exemplos rotulados para usar como *few-shot* no prompt (Módulo 3). **Não** fazem parte do conjunto de avaliação: usar o mesmo exemplo no prompt e na avaliação infla o resultado (vazamento).

## Histórico de rótulos

| Data | Mudança | Motivo |
|---|---|---|
| 2026-10-08 | `n11` e `n19`: `mercado` → `ferramentas` | o guia de rotulagem passou a definir relatos de empresa pelo foco; os dois descrevem técnicas |
| 2026-10-08 | dataset de 20 → 40 notícias; `exemplos.json` criado | Módulo 3 |
