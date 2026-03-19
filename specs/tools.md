# Tools - Agent Architect

## Visao Geral

Este documento cobre dois niveis de tools:

1. tools do proprio runtime do Agent Architect (operacao persistente Telegram-first)
2. logica para decidir tools dos agentes finais gerados

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo

Garantir que o projeto final tenha ferramentas minimas para operacao confiavel e que a recomendacao de tools para agentes alvo continue inteligente e proporcional.

---

## Tools do Runtime do Agent Architect

### 1. Config/Env Loader (obrigatorio)

Finalidade:

- carregar `.env`
- validar variaveis obrigatorias

Exemplos de chaves:

- TELEGRAM_BOT_TOKEN
- TELEGRAM_ALLOWED_USER_ID
- LLM_PROVIDER
- OLLAMA_BASE_URL

### 2. Telegram Adapter (obrigatorio)

Finalidade:

- conectar ao Telegram
- receber eventos de mensagem
- enviar respostas

### 2.1 Web Chat Adapter (recomendado quando chat web estiver habilitado)

Finalidade:

- receber mensagens da pagina de chat
- publicar respostas em tempo real para o frontend
- normalizar eventos web para o mesmo formato do core

### 3. LLM Provider Adapter (obrigatorio)

Finalidade:

- abstrair o provedor de modelo
- suportar Ollama no host
- permitir troca de provider sem alterar o core

### 4. Memory/Persistence (obrigatorio)

Finalidade:

- manter contexto por chat
- suportar refinamento multi-turno
- registrar estado minimo da conversa

### 5. Runtime/Health Utilities (recomendado)

Finalidade:

- logs estruturados
- healthcheck simples
- metricas basicas de runtime

### 5.1 Web UI Runtime (leve)

Finalidade:

- servir pagina estatica de chat
- manter frontend leve com HTML + CSS + HTMX + Alpine.js
- evitar dependencia de framework SPA pesado

### 6. CLI de debug/admin (opcional)

Finalidade:

- suporte operacional secundario (status, reset, diagnostico)

Restricao:

- nao virar interface principal do produto.

---

## Tools para Agentes Finais Gerados

O Agent Architect continua atuando como decisor de tools para os agentes alvo.

Categorias possiveis:

- SQL/Database tools
- File processing tools
- API tools
- Terminal/System tools (com alta restricao)
- Web tools
- AI/model tools especializados

---

## Estrategia de Decisao

### 1. Necessidade real

Incluir tool somente se essencial para o objetivo.

### 2. Coerencia com PRD

Toda tool precisa ter justificativa no escopo.

### 3. Complexidade proporcional

- simples: minimo de tools
- intermediario: tools essenciais
- avancado: conjunto mais amplo com guardrails

### 4. Seguranca

- leitura antes de escrita
- confirmacao para acoes criticas
- sem credenciais em texto aberto

---

## Regras de Descricao de Tool

Quando gerar `tools.md` de um agente alvo, incluir:

- nome
- finalidade
- quando usar
- quando nao usar
- riscos
- restricoes
- exemplo de uso

---

## Integracao no Fluxo Principal

```text
Evento Telegram
  ↓
AgentController
  ↓
SpecGenerationPipeline
  ↓
Tool Decision
  ↓
Resposta com specs (incluindo tools.md quando aplicavel)
```

---

## Limites

O Agent Architect nao deve:

- depender apenas de tools de execucao pontual
- prometer integracoes nao especificadas
- incluir tools sem utilidade clara

---

## Resumo

O projeto precisa de tools para runtime persistente (Telegram Adapter, LLM Adapter, Env Loader e Memory/Persistence) e, ao mesmo tempo, manter a inteligencia para decidir tools dos agentes finais de forma segura e sem excesso.

