# Memory - Agent Architect

## Visao Geral

A memoria do Agent Architect existe para sustentar uma interacao conversacional persistente, mantendo contexto entre multiplas mensagens sem complicar desnecessariamente a implementacao.

Canal principal: Telegram.
Canal complementar: Web Chat leve.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo da Memoria

Permitir que o agente:

- continue o raciocinio entre mensagens
- refinie specs incrementalmente
- mantenha coerencia entre arquivos
- responda comandos conversacionais curtos sem perder contexto

Exemplos de continuidade que devem funcionar:

- "agora gere o tools"
- "melhore o architecture"
- "refaca o PRD"

---

## Tipos de Memoria

### 1. Memoria de Curto Prazo (turno atual)

Armazena dados apenas durante o processamento da mensagem atual.

Conteudo tipico:

- intencao detectada
- arquivo alvo do refinamento
- decisoes do pipeline no turno

### 2. Memoria de Sessao por Chat (principal)

Armazena estado da conversa por canal e id de conversa.

Conteudo tipico:

- ultimo pacote de specs gerado
- preferencias do usuario na conversa
- historico resumido de refinamentos
- premissas ativas

Exemplos de chave de contexto:

- `telegram:123456789`
- `web:session-abc123`

Essa e a memoria mais importante para o fluxo multi-turno.

### 3. Memoria Persistente Leve (opcional)

Armazena padroes reutilizaveis entre sessoes, sem depender disso para funcionamento basico.

Conteudo tipico:

- templates por dominio
- heuristicas recorrentes
- boas praticas de consistencia

---

## Estrategia de Recuperacao

Prioridade:

1. contexto da mensagem atual
2. memoria de sessao por chat
3. memoria persistente leve

Se houver conflito, prevalece o contexto atual da conversa.

---

## Estrategia de Atualizacao

Atualizar memoria quando:

- houver refinamento confirmado
- uma premissa for alterada
- o usuario mudar preferencia de formato/escopo
- novo arquivo for criado/atualizado

Evitar salvar ruido ou detalhes temporarios sem valor para o proximo turno.

---

## Estrutura Minima Recomendada

```json
{
  "chat_id": "...",
  "channel": "telegram|web",
  "conversation_id": "...",
  "current_goal": "...",
  "active_specs": ["PRD.md", "architecture.md"],
  "last_changes": [
    {
      "file": "architecture.md",
      "summary": "ajuste para runtime persistente Telegram-first"
    }
  ],
  "assumptions": ["CLI apenas opcional"],
  "user_preferences": {
    "detail_level": "medio"
  }
}
```

---

## Regras de Uso

### 1. Nao inventar memoria

Nao assumir dados nao observados na conversa.

### 2. Priorizar simplicidade

Memoria deve ser leve e util.

### 3. Manter foco em contexto de chat

A unidade principal de continuidade e a conversa por canal (telegram ou web).

### 4. Nao reter dados sensiveis desnecessarios

Guardar apenas o minimo necessario para continuidade funcional.

### 5. Permitir reset controlado

Comando de reset pode limpar contexto do chat sem derrubar o runtime.

---

## Edge Cases

### Memoria ausente no primeiro turno

Iniciar com padrao seguro e registrar novo contexto.

### Pedido ambiguo apos varios turnos

usar contexto recente e pedir confirmacao se necessario.

### Mudanca brusca de dominio

manter historico, mas isolar novo escopo para evitar contaminacao.

---

## Seguranca

- nao armazenar credenciais
- nao armazenar conteudo sensivel sem necessidade
- aplicar TTL/limpeza periodica quando fizer sentido

---

## Resumo

A memoria do Agent Architect deve ser orientada a conversa por chat, incremental e simples. O foco e sustentar refinamentos em multiplos turnos no runtime persistente Telegram-first, sem overengineering.