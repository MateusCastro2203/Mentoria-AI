# Exercício 05 — Um servidor MCP e os padrões multiagente

> Tarefa assíncrona. Os testes rodam offline: não precisa de modelo rodando.

Duas peças:

1. **um servidor MCP de verdade:** o glossário de IA da mentoria, com tools, um resource e um prompt. Os testes conectam um cliente MCP real a ele (em memória) e usam o que ele oferece;
2. **os padrões multiagente como funções:** pipeline, supervisor e gerador + revisor. Os "agentes" são funções de mentira nos testes, porque o que importa aqui é a forma de ligar os agentes.

## Como rodar

Da raiz do repositório:

```bash
pnpm -F @mentoria/ex05-mcp test            # versão base
pnpm -F @mentoria/ex05-mcp test:desafio    # desafio extra
```

Os testes **falham** até você implementar. A solução de referência está em [`solucao/`](solucao/). Tente antes de abrir. `pnpm -F @mentoria/ex05-mcp test:solucao` roda os mesmos testes contra ela.

## Versão base

| Arquivo | O que fazer |
|---|---|
| `src/glossario/servidor.ts` | `criarServidorGlossario`: tools `buscar_termo` e `listar_termos` (só leitura), resource `glossario://{termo}` e prompt `explicar_termo` |
| `src/padroes.ts` | `emPipeline`, `comSupervisor` e `comRevisao` |

Fornecidos: os termos (`src/glossario/termos.ts`), `conectarEmMemoria` e `normalizar` (`src/glossario/conectar.ts`).

**Dicas:**
- Use o SDK oficial v2: `McpServer` e `ResourceTemplate` de `@modelcontextprotocol/server`; schemas com Zod. Veja o servidor de fontes do projeto final, ou a [documentação](https://ts.sdk.modelcontextprotocol.io/v2/).
- Erro de ferramenta **não** é exceção: devolva `{ isError: true, content: [...] }`. O cliente (e o modelo) leem a mensagem.
- Em `comSupervisor`, quem decide é a função `escolher`; o seu código só executa, registra e para nos limites.

**Feito =** `pnpm -F @mentoria/ex05-mcp test` com todos os testes passando.

### Use de verdade (opcional)

Conecte o seu servidor a um cliente MCP externo, o [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector pnpm -F @mentoria/ex05-mcp glossario
```

Ele abre uma página no navegador em que você lista as tools, chama `buscar_termo`, lê `glossario://agente` e testa o prompt. Se você usa um agente de código compatível com MCP, pode registrar o mesmo comando como servidor local e perguntar a ele sobre os termos da mentoria.

## Desafio extra — handoff

Em `src/desafio/handoff.ts`, implemente `executarHandoffs`: cada agente responde ou transfere a conversa para outro, como numa central de atendimento. O loop precisa parar em agente desconhecido, em **ping-pong** (voltar para quem já atendeu) e num limite de transferências.

**Feito =** `pnpm -F @mentoria/ex05-mcp test:desafio` com todos os testes passando.

## Perguntas para pensar

1. Por que `buscar_termo` é uma tool e `glossario://{termo}` é um resource, se os dois devolvem a mesma informação? Quem decide usar cada um?
2. O que acontece se um servidor MCP escrever um log com `console.log` quando roda por stdio?
3. No seu `comSupervisor`, o que impede o supervisor de chamar o mesmo trabalhador para sempre?
4. Pense num processo do seu time que hoje passa por várias pessoas. Qual padrão (pipeline, supervisor, handoff, gerador + revisor) ele lembra? Faria sentido com agentes?
