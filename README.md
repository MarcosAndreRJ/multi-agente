# Agent Architect - Multi-agent Runtime

Runtime persistente orientado a eventos com Telegram como canal principal e Web Chat leve (HTML + CSS + HTMX + Alpine.js) como canal complementar.


```bash
# 1. Copie o .env.example para .env e preencha o TELEGRAM_BOT_TOKEN
copy .env.example .env

# 2. Build e sobe o container
docker compose up --build -d

# 3. Acompanhar logs
docker compose logs -f

```


## Requisitos

- Node.js 20+
- Ollama rodando no host
- Token de bot do Telegram (opcional para testes apenas web)

## Setup

1. Copie `.env.example` para `.env`
2. Ajuste variaveis de ambiente
3. Instale dependencias:

```bash
npm install
```

4. Rode em modo desenvolvimento:

```bash
npm run dev
```

## Endpoints

- `GET /health` - status do runtime
- `GET /chat` - pagina do chat web
- `POST /api/chat/message` - envio de mensagem web
- `GET /api/chat/stream/:sessionId` - stream SSE da conversa

## Estrutura

- `src/adapters` - adapters de canal (Telegram/Web)
- `src/agents` - especialistas multi-agente
- `src/core` - orquestracao principal
- `src/llm` - provider adapter (Ollama)
- `src/memory` - persistencia SQLite
- `public` - frontend leve do chat
