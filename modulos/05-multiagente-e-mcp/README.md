# Módulo 05 — Sistemas multiagênticos e MCP

> **Aula ao vivo (1h):** 40 min de conceito + demo · 15 min de discussão · 5 min de folga
> **Pré-requisito:** Módulo 04 e o relatório da etapa M4 (`projeto-final/saidas/m04-comparacao.md`)
> **Leitura de apoio:** [`conceitos.md`](conceitos.md) · **Exercício:** [`exercicio/`](exercicio/README.md)
> **Material:** [apresentação (PDF)](material/apresentacao.pdf) · [apresentação (PPTX, com notas)](material/apresentacao.pptx) · [apostila (PDF)](material/apostila.pdf) · [guia do mentor (PDF)](material/guia-do-mentor.pdf)

## Objetivos de aprendizagem

Ao final, a pessoa consegue:

1. reconhecer os padrões multiagente (pipeline, supervisor, hierárquico, handoff, gerador + revisor) e dar um exemplo de cada;
2. decidir, com critérios, quando dividir um trabalho em vários agentes é exagero;
3. explicar o MCP: host, cliente e servidor; tools, resources e prompts; transportes stdio e HTTP;
4. escrever um servidor MCP local, testá-lo com um cliente MCP e conectar as tools dele a um agente;
5. aplicar menor privilégio e validação de entrada a ferramentas expostas por MCP.

## Mensagem central

> Divida em vários agentes só quando as partes forem **independentes**. E ligue todos ao mundo por um **protocolo padrão**: o servidor MCP não precisa saber quem vai usá-lo, e o agente não precisa saber como cada ferramenta foi feita.

## Roteiro do encontro

| Tempo | Bloco | O que mostrar | Demo |
|---|---|---|---|
| 0–12 | **Padrões multiagente** | Pipeline, supervisor, hierárquico, handoff, gerador + revisor, com a analogia da cozinha. O time do curador: pipeline em código, só o coletor é agente, redator ⇄ revisor. | — |
| 12–17 | **Quando é exagero** | Anthropic (pesquisa com subagentes em paralelo: +90% nas avaliações internas, ~15× tokens) × Cognition ("não construa multiagentes": decisões conflitantes). O ponto em comum: partes independentes. | — |
| 17–30 | **MCP** | Host, cliente, servidor; JSON-RPC; stdio e Streamable HTTP. Tools (o modelo decide), resources (a aplicação lê), prompts (o usuário escolhe). As duas eras do protocolo (2025 com `initialize`; 2026-07-28 sem sessão). Segurança: menor privilégio e validação. | `demo:protocolo` |
| 30–40 | **O time do curador** | Os quatro papéis trabalhando: coletor lendo fontes pelo MCP, classificador, redator, revisor; a edição gravada pelo servidor de edição. O resultado da execução completa. | `demo:time` |
| 40–55 | **Discussão** | Perguntas abaixo. | — |
| 55–60 | **Folga** | Apresentar o exercício e a etapa M5. | — |

> **Corte declarado:** o padrão hierárquico em profundidade, o transporte HTTP na prática, autenticação de servidores remotos (OAuth) e as extensões do MCP (tasks, apps) ficam na leitura de apoio ou fora do curso.

### Comandos das demos

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex05-mcp demo:protocolo                 # offline: mensagens JSON-RPC, nas duas eras
pnpm -F @mentoria/ex05-mcp demo:time                      # o time em versão curta (~4 min: coleta e classificação completas, redação de 3 itens)
pnpm -F @mentoria/curador m05:edicao:solucao              # ANTES da aula: o time completo (vários minutos)
npx @modelcontextprotocol/inspector pnpm -F @mentoria/curador mcp:fontes   # opcional: cliente MCP externo
```

### Notas para o mentor

Rodei com `qwen3:4b-instruct` (Ollama 0.34.4). A execução completa do time levou **~14 minutos**; rode antes da aula.

| Papel | Tipo | Chamadas | Tempo |
|---|---|---|---|
| Coletor | agente (tools do MCP de fontes) | 1 (12 passos) | 69 s |
| Classificador | decisão estruturada (skill + guardrails) | 32 | 97 s |
| Redator | geração de texto | 14 | 60 s |
| Revisor | código + juiz LLM | 14 | **616 s** |

- **O gargalo foi o revisor**, não o agente: 73% do tempo. O juiz escreve justificativas longas (~44 s por chamada no modelo local). Bom gancho para a Aula 8 (custo e latência): pedir um motivo curto, ou só aprovar/reprovar, cortaria a maior parte do tempo.
- **O coletor leu as 10 fontes** (desta vez incluindo "variedades", diferente do agente da Aula 4) e entregou 32 candidatos. Dos 27 publicáveis do gabarito, 25 chegaram ao classificador: perdeu 2, de novo por omissão ao montar a lista.
- **Gerador + revisor em ação:** dos 10 publicáveis, 9 foram aprovados. A `n10` foi reprovada duas vezes: o resumo dizia que o método "reduz" respostas inventadas e o original diz que ele "mede menos". O juiz foi rigoroso (alguém pode achar que é a mesma coisa): ótimo para discutir quem calibra o revisor.
- **Viés editorial escondido:** a edição saiu só com `modelos`, `ferramentas` e `pesquisa`, sem nenhuma notícia de `regulacao` ou `mercado`. Quase todas as confianças ficaram entre 0,95 e 0,99, e o empate foi resolvido pela ordem das fontes. Ninguém pediu isso; é efeito colateral de "pegue os 10 de maior confiança". Pergunte à turma como garantir diversidade (cotas por categoria? outro critério?).
- **MCP:** os testes usam o transporte em memória (era 2025-11-25, com `initialize`). Os servidores por stdio usam `serveStdio` e atendem também a era 2026-07-28; a `demo:protocolo` mostra as duas. Testei o servidor de fontes iniciado por `pnpm -F @mentoria/curador mcp:fontes` com um cliente MCP real: funciona (o pnpm escreve o cabeçalho em stderr, sem atrapalhar o protocolo).
- **Precisava de um time?** As etapas são em sequência e dependem umas das outras: pelo critério do bloco 2, não. O ganho foi organização: papéis pequenos, ferramentas e permissões separadas (o coletor só lê; só o servidor de edição escreve) e destino trocável (Notion, Slack…) sem mexer no time.

## Perguntas para discussão (15 min)

1. O curador precisava de quatro agentes? O que o time ganhou em relação ao pipeline da Aula 4, e o que custou?
2. Um processo do seu time lembra qual padrão: pipeline, supervisor, handoff ou gerador + revisor? Faria sentido com agentes?
3. Por que `buscar_termo` é uma tool e `glossario://{termo}` é um resource, se devolvem a mesma informação?
4. Que servidor MCP você gostaria de ter no seu trabalho? Quais tools ele teria, e quais seriam só leitura?
5. O que pode dar errado ao instalar um servidor MCP de uma fonte desconhecida?

## Armadilhas comuns

- **Dividir em vários agentes o que é sequencial e dependente.** Vira custo e decisões conflitantes.
- **Chamar de "multiagente" um pipeline com várias chamadas de LLM.** Tudo bem ser um pipeline; é mais simples de testar.
- **`console.log` num servidor stdio:** quebra o protocolo, porque stdout é o canal das mensagens. Use stderr.
- **Montar caminho de arquivo com texto vindo do modelo** sem checar (ler `../../etc/passwd`).
- **Dar todas as tools a todos os agentes.** Use lista de permitidas.
- **Confiar nas anotações (`readOnlyHint`) de um servidor desconhecido.** São dicas, não garantias.
- **Lançar exceção para erro de ferramenta.** Devolva `isError` com a mensagem, para o modelo se corrigir.
- **Instalar servidores MCP sem saber de onde vêm.** É código rodando com o seu acesso.

## Exercício (assíncrono, até a próxima aula)

Enunciado completo em [`exercicio/README.md`](exercicio/README.md).

- **Base:** um servidor MCP de glossário de IA (tools, resource e prompt), testado por um cliente MCP real, e os padrões pipeline, supervisor e gerador + revisor como funções. Feito = `pnpm -F @mentoria/ex05-mcp test` verde.
- **Desafio extra:** handoff entre agentes, com detecção de ping-pong. Feito = `pnpm -F @mentoria/ex05-mcp test:desafio` verde.

## Projeto final — etapa M5

Em [`projeto-final/`](../../projeto-final/README.md): servidor MCP de fontes (RSS), servidor MCP de edição (markdown), o adaptador de tools MCP para o AI SDK e a orquestração do time.

- Feito = `pnpm -F @mentoria/curador exec vitest run test/m05.test.ts` verde **e** `pnpm -F @mentoria/curador m05:edicao` publicando `saidas/edicao.md`.
- Traga para a Aula 6: a edição e o relatório. Na próxima aula, o pipeline do time vira um grafo com estado e checkpoint.

## Referências

- Model Context Protocol — especificação (revisão 2026-07-28): https://modelcontextprotocol.io/specification/2026-07-28
- SDK oficial de TypeScript (v2): https://ts.sdk.modelcontextprotocol.io/v2/
- MCP Inspector: https://github.com/modelcontextprotocol/inspector
- Anthropic (2025). *How we built our multi-agent research system*. https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition (2025). *Don't Build Multi-Agents*. https://cognition.com/blog/dont-build-multi-agents
- Anthropic (2024). *Building effective agents*. https://www.anthropic.com/engineering/building-effective-agents
