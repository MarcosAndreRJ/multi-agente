# Validation - Agent Architect

## Visao Geral

Este documento define validacao leve e inteligente para garantir que os specs mantenham a direcao correta do projeto.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo

Validar para melhorar qualidade sem burocracia excessiva.

---

## Validacoes Obrigatorias de Runtime

### 1. Persistencia do runtime

Verificar se os specs deixam claro que a aplicacao:

- inicia com `npm run dev`
- permanece em execucao
- processa eventos de mensagem continuamente

### 2. Telegram como interface principal

Verificar se entrada/saida principal esta no Telegram e nao em CLI.

Se houver Web Chat, ele deve estar definido como canal complementar.

### 3. Anti-regressao CLI-first

Verificar se nao ha ambiguidade sugerindo execucao unica por comando com argumento como fluxo padrao.

CLI pode existir apenas para debug/admin.

### 4. Multi-turno com contexto

Verificar se loop e memoria suportam continuidade de conversa por chat.

---

## Validacoes de Coerencia

- PRD alinhado com architecture
- agent-loop alinhado com runtime orientado a eventos
- memory alinhada com refinamento incremental
- skill-user, telegram-input e telegram-output alinhados no comportamento conversacional
- tools alinhada a operacao persistente e integracoes essenciais
- quando houver web chat, stack de frontend alinhada a abordagem leve (HTML + CSS + HTMX + Alpine.js)

---

## Validacoes de Qualidade

### Clareza

Especificacoes devem ser compreensiveis e acionaveis.

### Completude

Deve ser possivel implementar o agente com os specs gerados.

### Relevancia

Sem componentes desnecessarios ou complexidade gratuita.

---

## Nivel de Rigor

- simples: validacao leve
- intermediario: validacao moderada
- avancado: validacao mais completa

Sempre proporcional ao escopo.

---

## Processo de Validacao

```text
Specs gerados/refinados
  ↓
Checagem de runtime (persistente + Telegram-first)
  ↓
Checagem de coerencia entre arquivos
  ↓
Ajustes pontuais
  ↓
Entrega
```

---

## Sinais de Problema

Revisar quando houver:

- linguagem que sugere CLI one-shot como padrao
- ausencia de fluxo de listener Telegram
- loop que termina a aplicacao
- memoria sem contexto por chat
- contradicoes entre docs
- web chat tratado como substituto do Telegram
- inclusao de framework frontend pesado sem necessidade

---

## O que Nao Fazer

- nao bloquear entrega por perfeccionismo
- nao transformar validacao em checklist burocratico
- nao reescrever tudo sem necessidade

---

## Resumo

Validation deve proteger a direcao arquitetural correta (runtime persistente Telegram-first) com criterio leve, inteligente e orientado a coerencia.
