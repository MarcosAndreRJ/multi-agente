# Architecture - Agent Architect

## Visao Geral

O Agent Architect deve operar como um servico persistente, conversacional e orientado a eventos, implementado em TypeScript no Node.js.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

A aplicacao sobe com `npm run dev`, conecta automaticamente ao Telegram e continua rodando para processar mensagens em tempo real.

Tambem pode expor um Web Chat leve (HTML + CSS + HTMX + Alpine.js) como canal complementar, sem alterar o core do agente.

---

## Objetivo Arquitetural

Construir um agente capaz de:

- receber mensagens via Telegram
- interpretar contexto da conversa em multiplos turnos
- gerar e refinar specs de forma incremental
- manter consistencia entre arquivos
- responder pelo Telegram com formato legivel

---

## Stack Alvo

- TypeScript
- Node.js
- bot Telegram
- frontend web leve: HTML + CSS + HTMX + Alpine.js
- configuracao via `.env`
- provider LLM via adapter (ex: Ollama no host)
- suporte opcional a Docker

---

## Principios Arquiteturais

### 1. Runtime Persistente

O processo principal nao e one-shot. O runtime inicia e permanece ativo aguardando eventos de mensagem.

### 2. Event-Driven

Entradas de Telegram disparam processamento por evento, sem encerrar a aplicacao apos cada solicitacao.

### 3. Core desacoplado de interface

Logica de negocio do agente (planejamento/geracao/validacao de specs) fica separada do canal Telegram.

Essa mesma regra vale para o Web Chat: canais mudam, core permanece o mesmo.

### 4. Coerencia interdocumental

PRD, arquitetura, loop, memoria, skills e interfaces devem permanecer alinhados.

### 5. Simplicidade com extensibilidade

Evitar overengineering, mas manter estrutura pronta para novos canais e provedores.

---

## Componentes Principais

### 1. AppRuntime / Bootstrap

Responsavel por inicializacao do servico.

Funcoes:

- carregar configuracoes de ambiente
- inicializar adapters e controlador
- registrar listeners de eventos
- iniciar bot Telegram automaticamente
- manter processo ativo

### 2. TelegramAdapter

Responsavel por integrar com API do Telegram.

Funcoes:

- receber mensagens e eventos
- validar usuario autorizado
- normalizar input
- enviar mensagens de saida
- lidar com limites de tamanho e rate-limit basico

### 2.1 WebChatAdapter

Responsavel por integrar a interface web leve.

Funcoes:

- receber mensagens HTTP da pagina de chat
- publicar eventos de resposta para o frontend
- manter session_id de conversa web
- normalizar payload para o AgentController

### 3. MessageRouter

Responsavel por rotear tipos de mensagem para handlers corretos.

Funcoes:

- distinguir texto/comando/arquivo/audio (quando habilitado)
- distinguir canal de origem (telegram ou web)
- aplicar regras de roteamento por intencao
- encaminhar para AgentController com contexto padronizado

### 4. AgentController

Orquestrador central do processamento.

Funcoes:

- recuperar contexto de memoria por chat
- acionar o SpecGenerationPipeline
- compor resposta final
- delegar envio ao OutputDispatcher

### 5. SpecGenerationPipeline

Pipeline de geracao/refino de specs.

Submodulos:

- Intent Analyzer
- Scope & Domain Mapper
- Spec Planning Engine
- Spec Generator
- Consistency Validator

### 6. OutputDispatcher

Responsavel pela entrega ao canal.

Funcoes:

- formatar resposta para Telegram
- formatar resposta para Web Chat
- dividir respostas longas em multiplas mensagens
- preservar ordem logica dos blocos de arquivos

### 6.1 WebUI Delivery

Entrega para Web Chat deve priorizar simplicidade:

- HTML renderizado de forma progressiva
- atualizacao incremental via HTMX
- estado local minimo com Alpine.js

### 7. Memory/Persistence Layer

Responsavel por estado de conversa e preferencias.

Funcoes:

- memoria de sessao por chat
- memoria curta da solicitacao atual
- persistencia leve opcional para continuidade

### 8. LLM Provider Adapter

Abstracao para o modelo de linguagem.

Funcoes:

- encapsular chamadas ao provider (ex: Ollama)
- padronizar requests/responses
- permitir troca de provider sem alterar core

---

## Fluxo Principal

Fluxo obrigatorio de operacao:

Telegram -> TelegramAdapter -> AgentController -> SpecGenerationPipeline -> Telegram Output

Fluxo complementar de operacao:

Web Chat -> WebChatAdapter -> AgentController -> SpecGenerationPipeline -> Web Output

Representacao:

```text
Evento Telegram
  ↓
TelegramAdapter
  ↓
MessageRouter
  ↓
AgentController
  ↓
SpecGenerationPipeline
  ↓
OutputDispatcher
  ↓
Resposta no Telegram
```

```text
Evento Web Chat
  ↓
WebChatAdapter
  ↓
MessageRouter
  ↓
AgentController
  ↓
SpecGenerationPipeline
  ↓
OutputDispatcher
  ↓
Resposta no Web Chat
```

---

## Modelo de Execucao

### Startup

1. `npm run dev`
2. Bootstrap carrega `.env`
3. Adapters sao inicializados
4. Listener do Telegram entra em modo ativo
5. Servidor HTTP para Web Chat entra em modo ativo (quando habilitado)

### Runtime

1. cada mensagem recebida dispara evento
2. um ciclo de processamento e executado por solicitacao
3. runtime continua aguardando novas mensagens

Essa regra vale para eventos de Telegram e Web Chat.

### Shutdown

- encerramento gracioso quando solicitado
- sem perder integridade de estado

---

## CLI (Opcional)

CLI com argumentos pode existir, mas somente como suporte secundario:

- debug
- healthcheck
- administracao

Nunca substituir o fluxo principal Telegram-first.

---

## Limites Arquiteturais

O Agent Architect nao deve:

- depender de fluxo one-shot CLI como padrao
- acoplar core diretamente ao Telegram SDK
- acoplar core ao frontend web
- prometer interface web como requisito atual
- executar tarefas fora do escopo de design de specs

---

## Casos Especiais

### Telegram indisponivel temporariamente

- registrar erro
- manter processo ativo
- tentar reconexao conforme estrategia definida

### Mensagens fora de ordem/duplicadas

- idempotencia basica por evento
- preservacao de contexto por chat

### Solicitacao muito grande

- processar em etapas
- responder em partes no Telegram

---

## Resumo Arquitetural

O Agent Architect e um servico long-running, orientado a eventos e centrado no Telegram.

O core de geracao de specs permanece desacoplado dos adapters de entrada/saida, garantindo evolucao sustentavel sem perder simplicidade.

O Web Chat leve funciona como canal complementar, com o mesmo core e sem adotar stack frontend pesada.
