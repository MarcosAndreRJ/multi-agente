# Agent Loop - Agent Architect

## Visao Geral

O loop do Agent Architect e orientado a eventos de mensagem (Telegram e Web Chat).

Cada mensagem recebida no Telegram ou no Web Chat dispara uma execucao completa do ciclo de processamento, mas o runtime permanece ativo apos o termino desse ciclo.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo do Loop

Garantir que cada solicitacao do usuario resulte em:

- compreensao correta do objetivo
- uso do contexto da conversa (chat/session memory)
- geracao ou refinamento coerente de specs
- resposta clara no Telegram

Sem encerrar a aplicacao apos processar a solicitacao.

---

## Modelo Operacional

- Runtime: long-running
- Disparo: evento por mensagem recebida
- Canais: Telegram (principal) e Web Chat (complementar)
- Processamento: uma solicitacao por vez por fluxo de conversa
- Continuidade: preserva contexto para turnos seguintes

---

## Estrutura do Loop por Mensagem

```text
1. Receber evento
2. Recuperar contexto
3. Interpretar
4. Estruturar
5. Planejar
6. Gerar/Refinar
7. Validar
8. Responder
9. Persistir contexto
```

---

## Etapas do Loop

### 1. Receber evento

- input chega via TelegramAdapter
- input chega via TelegramAdapter ou WebChatAdapter
- valida usuario autorizado
- normaliza payload

### 2. Recuperar contexto

- carregar memoria de sessao/chat
- carregar memoria por canal + conversa
- recuperar preferencias e estado parcial

### 3. Interpretar

- identificar intencao principal da mensagem
- detectar dominio e complexidade
- reconhecer comandos conversacionais como:
	- "agora gere o tools"
	- "melhore o architecture"
	- "refaca o PRD"

### 4. Estruturar

- definir responsabilidades do agente alvo
- delimitar escopo e nao escopo

### 5. Planejar

- definir quais arquivos gerar/atualizar
- montar ordem de execucao

### 6. Gerar/Refinar

- gerar novos specs ou ajustar specs existentes
- preservar consistencia com o historico da conversa

### 7. Validar

- verificar coerencia entre arquivos
- garantir direcao arquitetural correta (runtime persistente Telegram-first)

### 8. Responder

- enviar resultado via Telegram
- enviar resultado para o canal de origem
- dividir saidas longas em multiplas mensagens

### 9. Persistir contexto

- salvar decisoes e estado util para proximo turno

---

## Iteracao Conversacional

O loop deve permitir iteracao incremental:

- mensagem inicial cria base dos specs
- mensagens seguintes refinam partes especificas
- o contexto e mantido sem exigir repeticao completa do pedido

---

## Regras de Controle

### 1. Nao encerrar o processo

Finalizar um ciclo de mensagem nao finaliza a aplicacao.

### 2. Evitar overengineering

Aplicar complexidade proporcional ao pedido.

### 3. Manter consistencia obrigatoria

Nenhum arquivo deve contradizer outro.

### 4. Priorizar clareza

Specs devem ser compreensiveis para humanos e maquinas.

### 5. Respeitar escopo

Nao adicionar funcionalidades fora do pedido sem justificativa.

---

## Concorrencia e Ordem

- processar uma solicitacao por vez por conversa
- se chegarem multiplas mensagens em sequencia, enfileirar por canal+chat
- evitar condicoes de corrida no contexto da memoria

---

## Limites do Loop

O Agent Architect nao deve:

- tratar CLI com argumentos como ciclo padrao
- executar tarefas do agente final
- sair do escopo de design e geracao de specs

---

## Resumo

O loop do Agent Architect e acionado por mensagem, processa um ciclo completo por solicitacao e permanece ativo continuamente no runtime. Isso garante operacao conversacional multi-turno com contexto e coerencia.