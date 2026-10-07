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

**Critério de relevância:** a notícia ajuda um dev a construir, avaliar ou operar sistemas com IA. Fofoca de mercado, notícias sem relação com IA e anúncios sem conteúdo técnico ou prático **não** são relevantes.

Os rótulos são usados a partir do Módulo 2 (calibração) e do Módulo 3 (evals). No Módulo 3, o dataset cresce.
