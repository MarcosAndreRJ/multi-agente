# PRD - Agent Architect (Spec Builder)

## Visao Geral

O Agent Architect e um agente de IA especializado em criar especificacoes completas para outros agentes no ecossistema Antigravity.

Diretriz principal deste projeto:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

Este agente atua como um "engenheiro de agentes", abstraindo a complexidade de design e padronizando a criacao de sistemas inteligentes em modo conversacional continuo.

Canal adicional permitido:

- Web Chat leve para uso local, usando HTML + CSS + HTMX + Alpine.js
- Telegram continua sendo o canal principal de entrada e saida

---

## Objetivo

Permitir que usuarios criem agentes completos de forma rapida, estruturada e escalavel, a partir de mensagens em linguagem natural no Telegram, com iteracao multi-turno.

---

## Problema

Criar agentes no Antigravity exige:

- conhecimento de arquitetura
- definicao clara de responsabilidades
- organizacao de specs
- coerencia entre arquivos

Sem uma camada conversacional persistente, o processo tende a ficar fragmentado e com baixa qualidade de refinamento incremental.

---

## Solucao

O Agent Architect resolve esse problema:

- operando como servico persistente em TypeScript/Node.js
- iniciando com `npm run dev`
- conectando automaticamente ao bot do Telegram
- escutando mensagens em tempo real
- estruturando o agente em multiplos arquivos
- garantindo consistencia entre specs
- respondendo e refinando por multiplos turnos

Complemento de interface:

- disponibilizando uma pagina web de chat leve para conversar com o agente
- reaproveitando o mesmo core conversacional usado no Telegram

CLI com argumentos pode existir apenas como suporte de debug/admin e nao como interface principal.

---

## Publico-Alvo

- desenvolvedores
- engenheiros de software
- criadores de automacoes
- usuarios do Antigravity
- profissionais que desejam criar agentes personalizados

---

## Funcionalidades Principais

### 1. Runtime Persistente Conversacional

- inicializa com `npm run dev`
- sobe o runtime e permanece em execucao
- conecta automaticamente ao Telegram
- processa mensagens em fluxo continuo
- opcionalmente expoe Web Chat leve no mesmo runtime

### 1.1 Web Chat Leve (Canal Complementar)

- pagina simples para conversa com o agente
- stack de frontend: HTML + CSS + HTMX + Alpine.js
- sem dependencia de framework frontend pesado

### 2. Geracao de Specs

Cria automaticamente:

- PRD.md
- architecture.md
- agent-loop.md
- memory.md
- skill-user.md
- telegram-input.md
- telegram-output.md
- tools.md (quando necessario)
- output-format.md, validation.md e domain-rules.md quando o contexto pedir

### 3. Interpretacao de Intencao Multi-turno

Transforma entradas como:

> "quero um agente DBA para MySQL"

em estrutura completa de agente, e permite refinamentos como:

> "agora melhore o architecture"

### 4. Consistencia entre Arquivos

Garantir que:

- o PRD esteja alinhado com a arquitetura
- o agent-loop respeite capacidades e canal Telegram
- a memoria suporte continuidade de conversa
- as skills facam sentido com o objetivo

### 5. Modularidade

Permitir criacao de agentes:

- simples
- intermediarios
- complexos

---

## Escopo

### Incluido

- geracao de specs em formato `.md`
- operacao conversacional persistente via Telegram
- canal web complementar para conversa com o agente
- padronizacao de arquitetura
- recomendacao de modulos e componentes
- definicao de memoria e contexto por chat/sessao

### Nao Incluido

- deploy automatico de infraestrutura
- interface web obrigatoria
- dependencia de framework frontend pesado (Angular/React obrigatorios)
- execucao do agente final gerado

---

## Requisitos Funcionais

- Deve iniciar com `npm run dev`
- Deve permanecer em execucao apos iniciar
- Deve conectar ao Telegram automaticamente
- Deve receber mensagens em tempo real
- Deve responder via Telegram
- Deve permitir conversa via Web Chat leve (canal complementar)
- Deve interpretar linguagem natural multi-turno
- Deve gerar multiplos arquivos coerentes
- Deve suportar refinamento incremental por conversa
- Deve manter CLI apenas como opcional de debug/admin

---

## Requisitos Nao Funcionais

- Clareza e legibilidade dos arquivos
- Padronizacao de formatacao
- Baixa ambiguidade
- Alta coerencia entre documentos
- Modularidade e escalabilidade
- Flexibilidade sem overengineering
- Configuracao via `.env`
- Compatibilidade com Docker (opcional)
- Frontend leve, sem acoplamento com stack SPA complexa

---

## Fluxo de Uso Principal

1. Usuario envia mensagem no Telegram
2. Runtime persistente recebe evento
3. Agent Architect interpreta objetivo e contexto da conversa
4. Gera/atualiza specs
5. Envia resposta no Telegram
6. Mantem estado para proximos turnos

Fluxo complementar (Web Chat leve):

1. Usuario abre pagina de chat
2. Envia mensagem pelo frontend leve
3. Runtime recebe evento web
4. Agent Architect processa no mesmo core
5. Resposta e exibida no chat web

Fluxo secundario opcional:

1. Operador usa CLI de debug/admin (se existir)
2. Consulta status/logs ou executa acao de manutencao

---

## Decisoes de Design

- TypeScript como stack principal
- Node.js em runtime long-running
- Telegram como canal principal de entrada e saida
- Web Chat leve como canal complementar
- separacao clara entre core do agente e adapters de interface
- abordagem spec-driven
- suporte a provedor LLM via adapter (ex: Ollama no host)

---

## Edge Cases

- entrada vaga ou ambigua
- solicitacoes conflitantes
- escopo muito amplo
- falta de dominio definido
- mensagens longas com necessidade de particionamento
- indisponibilidade temporaria do Telegram

Nestes casos, o agente deve:

- pedir clarificacao ou assumir padrao documentando premissas
- manter runtime ativo e resiliente

---

## Metricas de Sucesso

- tempo de bootstrap ate "bot online"
- taxa de mensagens processadas com sucesso
- consistencia entre arquivos gerados
- numero de refinamentos concluidos por conversa
- % de agentes gerados sem correcao manual extensa

---

## Seguranca

- validar usuario autorizado no Telegram
- nao expor credenciais em resposta
- nao executar acoes destrutivas por padrao
- nao manipular sistema fora do escopo

---

## Futuras Evolucoes

- suporte a multiagentes
- envio de arquivos `.md` como anexos no Telegram
- melhoria de UX da pagina web sem perder leveza
- observabilidade e healthcheck
- templates por dominio
- versionamento de specs

---

## Nome do Agente

Agent Architect

Alternativos:
- Spec Builder
- Agent Forge
- MetaAgent Designer

---

## Output Esperado

Um conjunto completo de arquivos `.md` pronto para uso no Antigravity, gerado e refinado de forma conversacional em runtime persistente Telegram-first.
