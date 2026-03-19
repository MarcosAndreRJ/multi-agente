# Telegram Input - Agent Architect

## Visao Geral

O Telegram Input e a interface principal de entrada do Agent Architect, nao um canal opcional secundario.

O projeto pode ter Web Chat leve como canal complementar, mas sem reduzir a prioridade do Telegram.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo

Receber mensagens do Telegram de forma segura e confiavel, normalizar o input e encaminhar para o loop do agente em tempo real.

---

## Inicializacao Obrigatoria

Ao subir a aplicacao com `npm run dev`, o runtime deve:

1. carregar configuracao via `.env`
2. inicializar o bot Telegram
3. registrar listener de mensagens automaticamente
4. permanecer em execucao aguardando eventos

Nao depender de comando manual extra para ativar listener.

Quando Web Chat estiver habilitado, ele deve inicializar no mesmo runtime.

---

## Tipos de Entrada Suportados

### 1. Texto (prioritario)

Exemplos:

- "Crie um agente DBA para MySQL"
- "agora gere o tools"
- "melhore o architecture"

Acao:

- encaminhar ao Agent Loop com contexto da conversa

### 2. Arquivos (opcional)

Tipos:

- PDF
- Markdown (.md)
- TXT

Acao:

- extrair texto
- encaminhar como contexto adicional

### 3. Audio (opcional)

Acao:

- transcrever para texto
- encaminhar ao Agent Loop

### 4. Comandos estruturados (opcional)

Exemplos:

- /help
- /reset
- /status

Uso: administracao leve da conversa sem substituir a interacao em linguagem natural.

---

## Seguranca

### Controle de acesso

Validar:

- token do bot
- usuario autorizado (whitelist)

Exemplo de `.env`:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USER_ID=123456789
```

### Validacao de entrada

- limitar tamanho maximo de payload
- validar tipo de arquivo permitido
- rejeitar conteudo malicioso obvio

---

## Pipeline de Entrada

```text
Mensagem Telegram
  ↓
Validacao de usuario
  ↓
Deteccao de tipo de input
  ↓
Normalizacao
  ↓
Encaminhamento ao Agent Loop
```

Formato normalizado:

```json
{
  "source": "telegram",
  "chat_id": "...",
  "user_id": "...",
  "input_type": "text|file|audio|command",
  "content": "...",
  "metadata": {
    "timestamp": "...",
    "message_id": "..."
  }
}
```

---

## Edge Cases

### Input vazio

responder com orientacao curta e aguardar novo turno.

### Input muito longo

aceitar, mas resumir/segmentar internamente para processamento.

### Usuario nao autorizado

ignorar ou responder bloqueio padrao sem expor detalhes internos.

### Falha de conexao Telegram

manter runtime ativo e aplicar estrategia de reconexao.

---

## Limites

Este modulo nao deve:

- gerar specs
- decidir arquitetura
- executar logica de negocio complexa

O tratamento especifico do canal web deve ocorrer no modulo dedicado de WebChatAdapter.

Papel exclusivo:

Receber -> Validar -> Normalizar -> Encaminhar.

---

## Resumo

Telegram Input e a porta de entrada oficial e principal do Agent Architect. O listener deve subir automaticamente com o runtime e alimentar o loop conversacional em tempo real.
