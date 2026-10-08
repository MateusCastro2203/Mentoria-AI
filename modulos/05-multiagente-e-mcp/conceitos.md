# Módulo 05 — Conceitos (leitura de apoio)

No Módulo 4, o curador virou **um** agente. Este módulo faz duas perguntas:

1. **E se fossem vários?** Um time de agentes, cada um com um papel (coletor, classificador, redator, revisor). Quais formas de organizar um time existem e quando isso é exagero?
2. **Como os agentes acessam o mundo de um jeito padrão?** O **MCP** (*Model Context Protocol*): um protocolo aberto para expor ferramentas, dados e prompts a qualquer aplicação com LLM.

---

## 1. Padrões multiagente

"Multiagente" é qualquer sistema em que mais de um agente (ou papel de LLM) trabalha na mesma tarefa. A pergunta que importa é **como eles se ligam**:

| Padrão | Como funciona | Exemplo | Quando faz sentido |
|---|---|---|---|
| **Pipeline** | cada agente faz uma etapa e passa o resultado para o próximo | coletor → classificador → redator → revisor | etapas claras, em ordem fixa |
| **Supervisor** (orquestrador-trabalhadores) | um agente central decide, a cada rodada, qual trabalhador chamar | um pesquisador-chefe que distribui subtarefas | as subtarefas variam com o pedido |
| **Hierárquico** | supervisores de supervisores: cada um cuida de uma equipe | um gerente com times de pesquisa e de redação | problemas grandes, com subproblemas que também se dividem |
| **Handoff** (transferência) | o agente que está atendendo passa a conversa para outro mais adequado | triagem → financeiro → técnico, numa central de atendimento | conversas em que a especialidade muda no caminho |
| **Gerador + revisor** (avaliador-otimizador) | um gera, outro avalia e devolve críticas, até aprovar ou desistir | redator ⇄ revisor | há um critério de qualidade claro para checar |

**Analogia:** é uma cozinha de restaurante. Na **linha de montagem** (pipeline), cada cozinheiro faz uma parte do prato. O **chef** (supervisor) decide quem faz o quê conforme o pedido. Numa cozinha grande, há **chefs de praça** abaixo do chef (hierárquico). Quando um cliente pede algo que só o confeiteiro sabe, o garçom **passa** o pedido (handoff). E o chef **prova** e devolve o prato até ficar bom (gerador + revisor).

No projeto, a orquestração do time é um **pipeline em código** (um workflow, no sentido do Módulo 4), com um ciclo **gerador + revisor** entre redator e revisor. Só o **coletor** é um agente de verdade, escolhendo quais fontes ler. Os outros papéis são chamadas de LLM com uma tarefa só.

### Quando multiagente é exagero

Duas visões, publicadas com um dia de diferença em junho de 2025, ajudam a calibrar:

- **A favor, com custos claros.** A Anthropic descreveu o seu sistema de pesquisa com um agente-líder que dispara subagentes em paralelo ([How we built our multi-agent research system, 2025](https://www.anthropic.com/engineering/multi-agent-research-system)). Nas avaliações internas deles, o sistema multiagente superou um único agente em 90,2%, mas usou cerca de **15× mais tokens** que um chat (um agente sozinho usa cerca de 4×). Eles apontam que **não** é um bom encaixe para tarefas em que todos os agentes precisam do mesmo contexto ou que têm muitas dependências entre si, como a maioria das tarefas de programação.
- **Contra, como padrão.** A Cognition argumentou o oposto ([Don't Build Multi-Agents, 2025](https://cognition.com/blog/dont-build-multi-agents)): agentes em paralelo, sem o contexto completo uns dos outros, tomam **decisões conflitantes**. Os dois princípios propostos são: compartilhe o contexto inteiro (o histórico dos agentes, não só mensagens soltas) e lembre que **ações carregam decisões implícitas**. A recomendação deles é um agente único, em sequência, como padrão.

Os dois concordam no essencial: **multiagente compensa quando o trabalho se divide em partes independentes que podem rodar em paralelo**. Quando as partes dependem umas das outras, dividir cria conflitos e custo.

Perguntas antes de dividir em vários agentes:

1. As partes são **independentes**? Dá para rodar em paralelo?
2. Cada papel precisa de **contexto, ferramentas ou permissões diferentes**? (Separar o que lê de fora do que publica é uma boa razão.)
3. O ganho paga o **custo** extra (tokens, latência, depuração)?
4. Um **pipeline em código** com chamadas simples não resolve? (Quase sempre é o primeiro passo.)

---

## 2. MCP: Model Context Protocol

### O problema

Cada aplicação com LLM (um chat, um editor de código, o nosso curador) precisa se conectar a dados e ferramentas: arquivos, bancos, APIs, feeds. Sem um padrão, cada par aplicação × integração vira um conector diferente.

O **MCP** é um protocolo aberto que padroniza essa conexão. A inspiração declarada é o *Language Server Protocol*, que padronizou como editores de código dão suporte a linguagens. **Analogia:** uma tomada universal. Quem faz o aparelho (o servidor MCP) não precisa saber em que casa (aplicação) ele vai ser ligado.

### Os papéis

- **Host:** a aplicação com LLM (um chat, um editor, o nosso time de agentes).
- **Cliente:** o conector, dentro do host, que fala com **um** servidor.
- **Servidor:** o serviço que oferece contexto e capacidades (o nosso servidor de fontes, o de edição, o glossário).

As mensagens são **JSON-RPC 2.0**: pedidos com `method` e `params`, respostas com `result` ou `error`. A `demo:protocolo` mostra as mensagens reais.

### O que um servidor oferece

| Recurso | Quem controla | Para que | No projeto |
|---|---|---|---|
| **Tools** (ferramentas) | o **modelo** decide chamar | funções que o modelo executa | `listar_fontes`, `ler_fonte`, `publicar_edicao` |
| **Resources** (recursos) | a **aplicação** decide ler | dados e contexto, por URI | `noticia://{id}`, `edicao://ultima` |
| **Prompts** | o **usuário** escolhe usar | mensagens prontas, com parâmetros | `classificar_noticia`, `explicar_termo` |

Ferramentas podem declarar **anotações** como `readOnlyHint` (só lê), `destructiveHint` (apaga ou altera) e `idempotentHint` (repetir não muda o resultado). São **dicas**: a especificação manda tratá-las como não confiáveis, a menos que o servidor seja confiável.

Do lado do cliente, a revisão atual mantém a **elicitation**: o servidor pode pedir ao usuário uma informação a mais no meio de uma tarefa.

### Transportes

- **stdio:** o cliente inicia o servidor como um subprocesso e troca mensagens pela entrada e saída padrão (uma linha JSON por mensagem). É o mais simples para servidores locais. Por isso **o servidor não pode escrever nada em `stdout`**: esse é o canal do protocolo. Logs vão para `stderr`.
- **Streamable HTTP:** cada mensagem é um POST HTTP para um endpoint MCP; a resposta vem como JSON ou por um fluxo SSE. É o caminho para servidores remotos.

### Duas eras do protocolo (atenção)

A especificação atual é a revisão **2026-07-28** ([especificação](https://modelcontextprotocol.io/specification/2026-07-28)). A principal mudança em relação à anterior (2025-11-25) é que as requisições ficaram **sem estado**: cada uma carrega a versão do protocolo e as capacidades do cliente no próprio corpo (`_meta`), e acabou o *handshake* `initialize`. As revisões anteriores tinham uma sessão aberta com `initialize`.

Na prática, os dois mundos convivem. Com o SDK oficial de TypeScript (v2):

- o **cliente** usa a era antiga por padrão (`versionNegotiation: 'legacy'`); em modo `'auto'`, ele sonda a revisão nova e volta para a antiga se o servidor não suportar;
- o **servidor** atende as duas eras quando servido por `serveStdio(...)` (stdio) ou `createMcpHandler(...)` (HTTP); conectado direto a um transporte com `connect()`, como nos nossos testes em memória, ele fala a era antiga.

A `demo:protocolo` mostra as duas: em memória, com `initialize` (2025-11-25); por stdio, em modo `auto`, sem `initialize` e com `protocolVersion 2026-07-28` em cada requisição. Para o que fazemos no curso (tools, resources, prompts), o comportamento é o mesmo nas duas eras.

### Segurança

MCP dá ao modelo **acesso a dados e execução de código**. Os princípios da especificação: consentimento e controle do usuário, privacidade dos dados e cuidado com ferramentas ("ferramentas representam execução arbitrária de código"). Na prática:

- **menor privilégio:** cada agente recebe só as ferramentas de que precisa (no projeto, o coletor só recebe `listar_fontes` e `ler_fonte`, filtradas no adaptador);
- **valide toda entrada que vem do modelo:** `ler_fonte` só lê o arquivo depois de checar que a fonte existe (nunca monte um caminho de arquivo com texto do modelo sem checar);
- **o que um servidor devolve é dado não confiável:** pode trazer prompt injection (Módulo 3);
- **ferramentas que mudam algo** pedem aprovação humana (Módulo 7);
- só instale servidores MCP de fontes confiáveis.

### Do MCP para um agente

Um agente (o loop do Módulo 4) não "fala MCP" sozinho: alguém precisa listar as tools do servidor e transformá-las no formato de ferramenta do agente. No projeto, `ferramentasDoMcp` faz isso: para cada tool do servidor, cria uma ferramenta do AI SDK com o mesmo nome, descrição e schema, cuja execução chama `callTool` no servidor. O que importa: o mesmo servidor serve o nosso time, um agente de código ou o MCP Inspector, sem mudar uma linha.

---

## Referências

- Model Context Protocol — especificação (revisão 2026-07-28): https://modelcontextprotocol.io/specification/2026-07-28 · tools: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- SDK oficial de TypeScript (v2): https://ts.sdk.modelcontextprotocol.io/v2/
- MCP Inspector (ferramenta para testar servidores): https://github.com/modelcontextprotocol/inspector
- Anthropic (2025). *How we built our multi-agent research system*. https://www.anthropic.com/engineering/multi-agent-research-system
- Cognition (2025). *Don't Build Multi-Agents*. https://cognition.com/blog/dont-build-multi-agents
- Anthropic (2024). *Building effective agents* (padrões de workflow, incluindo orquestrador-trabalhadores e avaliador-otimizador). https://www.anthropic.com/engineering/building-effective-agents
