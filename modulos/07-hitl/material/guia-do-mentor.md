# Guia do mentor — Módulo 07, slide a slide

Este guia explica cada slide da apresentação em linguagem simples: o que significa cada termo, o que falar e o que responder se perguntarem. Leia uma vez inteiro antes da aula; durante a aula, as notas do PPTX bastam.

> **Se só der tempo de entender uma coisa:** *human-in-the-loop* ("humano no circuito") é fazer o sistema **parar e esperar uma pessoa** antes das decisões que importam. No LangGraph, `interrupt()` pausa o grafo e guarda tudo; `Command({ resume })` entrega a resposta da pessoa e o grafo continua de onde parou, mesmo dias depois.

**Antes da aula (uns 15 minutos, quase tudo esperando o modelo):**
1. `pnpm -F @mentoria/curador m07:edicao:solucao -- --nova`. O modelo trabalha alguns minutos e o terminal mostra a primeira pausa. **Digite `s` para sair.** O grafo fica pausado no arquivo `projeto-final/saidas/m07-checkpoint.json`, esperando você na aula.
2. `pnpm -F @mentoria/ex07-hitl demo:armadilha` e `demo:aprovacao` (instantâneas, não usam modelo): rode uma vez para ver a saída.
3. Na aula, no slide 14, rode `pnpm -F @mentoria/curador m07:edicao:solucao` (sem `--nova`) e decida ao vivo.

---

## Slide 1 — Capa

Diga: *"Na aula passada, os itens incertos iam para uma fila que só anotava. Hoje o grafo para de verdade e espera uma pessoa decidir."*

---

## Slide 2 — Hoje

Os objetivos. Não leia a lista.

---

## Slide 3 — A frase da aula

> Automatize o que dá para desfazer. Peça aprovação para o que não dá.

- **Dá para desfazer:** um rascunho, uma classificação interna, uma sugestão. Se errar, corrige depois.
- **Não dá:** publicar para milhares de pessoas, pagar, apagar dados, mandar mensagem a um cliente.

A segunda linha ("comece com mais revisão e vá soltando com dados") é o caminho prático: não dá para saber de antemão o quanto a máquina acerta; os dados das revisões dizem.

---

## Slide 4 — Divisória "1 · Por que HITL"

**HITL** = *human-in-the-loop*: humano no circuito (no "laço" do processo).

---

## Slide 5 — Três motivos para chamar uma pessoa

1. **Não volta atrás:** ações irreversíveis. O erro custa mais que o tempo de revisar.
2. **Incerteza:** quando o modelo não tem certeza. Mas só dá para confiar na "confiança" do modelo se ela for **calibrada**: na Aula 2 vimos que confiança 0,9 deveria significar "acerta 9 de 10 vezes", e que muitas vezes não significa.
3. **Responsabilidade:** algumas decisões precisam de alguém que responda por elas (negar um pedido, publicar em nome da empresa).

**Analogia do piloto automático:** ele voa sozinho na maior parte do tempo, mas decolagem, pouso e situações fora do normal ficam com os pilotos.

**Pergunte:** *"No seu trabalho, o que é irreversível?"*

---

## Slide 6 — O outro lado: viés de automação

**Viés de automação:** quando uma máquina sugere algo, as pessoas tendem a aceitar e deixam de procurar sinais de que ela errou. O slide cita uma revisão de estudos de 2010 (Parasuraman e Manzey) que mostra três coisas: acontece com iniciantes **e** especialistas, com pessoas sozinhas **e** equipes, e **não some** com treinamento.

**Ou seja:** pôr uma pessoa no circuito não é garantia. Se ela vê 100 itens por dia e a máquina quase sempre acerta, ela passa a aprovar sem olhar.

**O que fazer (lado direito):**
- não pedir aprovação de tudo (a pausa tem que ser rara para ter atenção);
- mostrar **por que** o item parou e a **evidência** (a fonte, a confiança), não só "aprova?";
- **medir** se a revisão está funcionando (slide 18).

---

## Slide 7 — Cinco níveis de autonomia

Um artigo de 2025 (Feng, McDonald e Zhang) organiza a autonomia de agentes em cinco níveis, pelo **papel da pessoa**:

1. **Operadora:** a pessoa comanda tudo; o agente ajuda quando é chamado (um assistente que você aciona).
2. **Colaboradora:** os dois planejam e executam juntos.
3. **Consultora:** o agente toma a iniciativa e consulta a pessoa nas decisões importantes.
4. **Aprovadora:** o agente trabalha sozinho e só chama a pessoa quando trava ou quando vai fazer algo com consequência.
5. **Observadora:** o agente é totalmente autônomo; a pessoa só acompanha pelos registros.

**O ponto principal (diga):** o nível é uma **escolha de desenho**, não uma consequência de o modelo ser bom. Um modelo excelente pode, e às vezes deve, trabalhar no nível 4.

**No curso:** o curador está no nível 4 para os itens incertos e para a edição. No exercício, o nível muda **por pedido**: R$ 40 paga sozinho (5), R$ 350 pede aprovação (4), R$ 5.000 o agente nem age (escala para outra equipe).

---

## Slide 8 — Divisória "2 · interrupt() e Command"

Rode `pnpm -F @mentoria/ex07-hitl demo:armadilha` agora ou no slide 11.

---

## Slide 9 — Pausar e retomar

**O código da esquerda:**
- `interrupt({ … })`: dentro de um passo do grafo, **pausa** tudo. O que vai entre as chaves é o que a pessoa vai ver (o pedido e a análise).
- `new Command({ resume: … })`: a resposta da pessoa. É enviada chamando o grafo de novo, com o mesmo `thread_id` (a "conversa" da Aula 6).

**O que acontece (lado direito):**
1. O estado é gravado no **checkpoint** (o "salvar jogo" da Aula 6). Sem checkpointer, não existe pausa longa.
2. O que foi passado ao `interrupt()` aparece no resultado, num campo chamado `__interrupt__`, para a aplicação mostrar à pessoa.
3. A resposta pode vir de **outro programa**, dias depois: o terminal, uma página web, um bot de chat.
4. O que vai em `resume` vira o **retorno** do `interrupt()`: o código continua como se a função tivesse acabado de responder.

---

## Slide 10 — Aprovar, editar, rejeitar

Os três tipos de resposta mais comuns. A tabela mostra o que cada um faz no curador e no exercício.

**Os três pontos de baixo:**
- **Validar com schema:** a resposta da pessoa é conferida contra um formato definido (com Zod, como fazemos com a saída do LLM desde a Aula 2). Um "sim" escrito à toa, ou um valor absurdo, não pode virar aprovação.
- **Resposta inválida → perguntar de novo:** no exercício, se alguém editar o reembolso para um valor maior que o pedido, o grafo pausa de novo e mostra o erro.
- **Registrar:** cada decisão fica guardada. Vira métrica (slide 18) e vira caso de avaliação (Aula 3).

---

## Slide 11 — As armadilhas da retomada

**A principal (caixa da esquerda):** quando o grafo retoma, o passo que tinha pausado **roda de novo, desde o começo**. Tudo o que estava antes do `interrupt()` acontece outra vez.

Rode `demo:armadilha`: no jeito errado, o passo manda um e-mail ("seu pedido está em análise") **antes** de pausar. Quando a pessoa responde, o passo roda de novo e o e-mail sai **duas vezes**. No jeito certo, o e-mail fica **depois** da pausa: sai uma vez só.

**As outras (lado direito):**
- **Efeitos externos** (e-mail, pagamento) e chamadas caras ao modelo: depois da pausa, ou num passo separado.
- **Não envolva `interrupt()` em `try/catch`** (o bloco de "tratar erros"): por dentro, a pausa funciona como um erro especial, e o `catch` a "engoliria".
- **Várias pausas ao mesmo tempo:** no curador, cada item incerto pausa em paralelo. Cada pausa tem um `id`, e a resposta vai como uma lista "id → resposta". Dá para responder só algumas; as outras continuam esperando.
- **A ordem importa:** se um passo tem duas pausas, as respostas são casadas pela posição.

**No curador:** a redação do item revisado (que chama o modelo) fica **depois** da pausa. Se ficasse antes, cada vez que você respondesse uma pausa, as outras refariam as redações.

---

## Slide 12 — Divisória "3 · Demo: aprovação"

Passe direto.

---

## Slide 13 — Três pedidos, três níveis

Rode `pnpm -F @mentoria/ex07-hitl demo:aprovacao`. Três pedidos de reembolso:
- **R$ 40, confiança 0,97:** pequeno e confiante → paga sozinho, sem perguntar.
- **R$ 350:** acima de R$ 100 → **o grafo para** e mostra a sugestão. **Decida ao vivo**: por exemplo, edite para R$ 200 (`e`, depois `200`).
- **R$ 5.000:** acima de R$ 2.000 → escala, ninguém paga ali.

No fim aparece a lista de pagamentos: confira que o do meio saiu com o valor que **você** decidiu, e só depois da sua resposta.

**Ponto importante:** a política (os limites R$ 100 e R$ 2.000, a confiança 0,9) é **código**, não um prompt. Fácil de testar e de mudar.

---

## Slide 14 — O curador pausado

**Este é o momento principal da aula.** Antes da aula você rodou `m07:edicao:solucao -- --nova`: o modelo trabalhou uns 13 minutos (coletar, classificar, redigir os itens confiantes) e parou na primeira pausa. Você digitou `s` e saiu. **O grafo ficou esperando no arquivo** `saidas/m07-checkpoint.json`.

Agora, rode `pnpm -F @mentoria/curador m07:edicao:solucao` (sem `--nova`). Aparece *"Continuando: há 4 pausa(s) esperando uma decisão"*. É **outro processo**, talvez outro dia: a pausa sobreviveu.

As 4 pausas (todas marcadas pelos **guardrails**, as regras de segurança da Aula 3):
- **n40:** o link aponta para `http://10.0.0.5/…`, um endereço de rede interna. Rejeite: "link interno".
- **n17:** confiança 0,65 e sem categoria. Notícia sobre investimento em chips; rejeite: "fora do tema".
- **n13:** a startup que promete "nunca errar" (o caso difícil da Aula 4). Rejeite: "promessa sem detalhes".
- **n38:** a notícia com injeção de prompt da Aula 3. Rejeite: "injeção".

Depois aparece a **edição inteira** (9 itens) para aprovar. Leia dois ou três resumos em voz alta e aprove (`a`).

Repare: a retomada leva **cerca de 1 segundo**, porque itens rejeitados não chamam o modelo.

---

## Slide 15 — Resultado da revisão

O relatório da revisão (`saidas/m07-relatorio.md`):

- **5 pausas:** 4 itens e a edição.
- **Intervenção de 13%:** 4 dos 32 itens avaliados precisaram de uma pessoa. Ou seja, **87% passou sem ninguém olhar**.
- **Override de 80%:** 4 das 5 decisões mudaram a proposta (as 4 rejeições).

**A pergunta que vale a aula: override de 80% é ruim?** Aqui, **não**. Esses 4 itens pararam porque o **guardrail** desconfiou deles. O **classificador** queria publicar (a n40, por exemplo, com confiança 0,98). Ao rejeitar, a pessoa **discordou do classificador** e **concordou com o guardrail**. Lição: uma métrica só diz algo quando está claro **contra qual proposta** ela mede.

O tempo de decisão aparece como "-" quando as respostas vêm de arquivo (`--respostas`); no modo interativo, o script mede quanto você levou em cada decisão.

---

## Slide 16 — Divisória "4 · O que automatizar e como medir"

Passe direto.

---

## Slide 17 — Três perguntas por etapa

Para decidir o nível de autonomia de cada passo de um processo:
1. **Dá para desfazer?**
2. **Quanto custa um erro?**
3. **A confiança é calibrada e há histórico?** Sem dados, mais revisão; com dados, dá para soltar aos poucos.

**Diga:** *"Comece no nível 4 (aprovação) e suba com dados."* Cada decisão registrada é um dado.

**Gancho:** pergunte à turma o que ficaria automático numa versão do curador que roda sozinha toda semana (é a Aula 8).

---

## Slide 18 — Três números

- **Taxa de intervenção:** de todos os itens, quantos precisaram de uma pessoa. Mostra o **custo humano** do processo.
- **Taxa de override** (*override* = "passar por cima"): das decisões humanas, quantas **mudaram** o que a máquina propunha (editar ou rejeitar). Mostra quanto a pessoa discorda da máquina.
- **Tempo de decisão:** quanto a pessoa leva para decidir cada pausa.

**Como ler juntos:**
- Muita intervenção e pouco override: a máquina acerta e a pessoa só confirma → dá para automatizar mais.
- Override alto: a máquina erra no que manda para revisão → melhorar o modelo ou a regra.
- Override perto de zero **e** decisões em 2 segundos: cuidado, pode ser **carimbo** (viés de automação, slide 6). Um teste: de vez em quando, mande para revisão um caso que **deveria** ser rejeitado e veja se a pessoa pega.

---

## Slide 19 — Calibrar o limiar com dados

**Limiar:** a confiança mínima para a máquina agir sozinha. O 0,9 do curador e do exercício foi um chute inicial.

**A tabela** usa os 10 pedidos fictícios do desafio do exercício. Para cada limiar possível:
- **Cobertura:** quanto do trabalho ficaria automático (quanto maior, menos trabalho humano).
- **Precisão:** desses, quantos a máquina acertaria.

**Leitura:** se o negócio exige 85% de acerto, o menor limiar que atinge isso é **0,90**, que deixa **70%** automático. Repare que 0,95 tem precisão **menor** (80%) que 0,90 (86%): a precisão não cai em linha reta. Por isso é preciso olhar a curva inteira.

**Ligue com a Aula 2:** essa conta só faz sentido se a confiança for calibrada.

---

## Slide 20 — Divisória "Discussão"

15 minutos.

---

## Slide 21 — Para conversar (com respostas esperadas)

1. **"O que seria 100% automático, o que pediria aprovação, o que nunca?"** Deixe as pessoas darem exemplos. Bons critérios para puxar: dá para desfazer? quanto custa errar? alguém precisa responder pela decisão?
2. **"Aprova 99% sem mudar: bom ou carimbo?"** Pode ser os dois. Para descobrir: olhar o tempo de decisão (2 segundos por item é suspeito), inserir de vez em quando um caso que deveria ser rejeitado, e comparar com uma amostra revisada por outra pessoa.
3. **"A pausa da edição inteira vale o tempo toda semana?"** Depende do histórico: se por várias semanas a pessoa aprovou sem mudar nada e os leitores não reclamaram, dá para tirar (ou trocar por um aviso "publicado, você tem 1 hora para desfazer").
4. **"Quem define os limites da política?"** O negócio (quem responde pelo dinheiro), com dados: o histórico de decisões, o custo médio de um erro, o custo de uma revisão. Não quem programa sozinho.
5. **"A pausa dura dias. E o mundo?"** A notícia envelhece, o cliente desiste, o preço muda. Soluções: prazo para a pausa (passou do prazo, aplica uma regra padrão ou escala), avisar quem está esperando, e reavaliar o caso ao retomar.

**Se o tempo apertar:** 1, 2 e 4.

---

## Slide 22 — Para a próxima aula

- **Exercício:** o assistente de reembolso com os três níveis. O desafio calibra o limiar com o histórico.
- **Projeto final, etapa M7:** cada pessoa revisa e publica uma edição do curador pelo terminal e traz as métricas.

---

## Slide 23 — Próxima aula

Gancho: a última aula põe o curador para rodar **sozinho, toda semana, na nuvem**, com registro de tudo o que ele faz, quanto custa cada edição, avaliações automáticas antes de cada mudança e um jeito de voltar a versão anterior do prompt.

---

## Glossário rápido

| Termo | Em uma frase |
|---|---|
| HITL (*human-in-the-loop*) | desenhar o sistema para uma pessoa revisar, corrigir ou autorizar partes do trabalho |
| Viés de automação | a tendência de aceitar a sugestão da máquina sem conferir |
| Nível de autonomia | quanto o agente pode fazer sozinho (operadora → observadora) |
| `interrupt()` | pausa o grafo e guarda o estado, esperando uma resposta |
| `Command({ resume })` | a resposta da pessoa, que faz o grafo continuar |
| `__interrupt__` | o campo do resultado com o que o grafo está perguntando |
| Retomar | continuar o grafo de onde parou |
| Reexecução | ao retomar, o passo que pausou roda de novo desde o começo |
| Efeito externo | algo que o programa faz no mundo (e-mail, pagamento, publicação) |
| Aprovar / editar / rejeitar | seguir como proposto / seguir com uma correção / não seguir |
| Taxa de intervenção | itens que precisaram de uma pessoa ÷ itens processados |
| Taxa de override | decisões que mudaram a proposta da máquina ÷ decisões |
| Limiar | a confiança mínima para a máquina agir sozinha |
| Cobertura | quanto do trabalho ficaria automático com um limiar |
| Precisão | quanto do que ficou automático estaria certo |
| Escalar | mandar o caso para outra equipe ou nível de decisão |
