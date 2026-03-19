# Output Format - Agent Architect

## Visao Geral

Este documento define o formato de saida dos specs gerados pelo Agent Architect, com foco em compatibilidade com Telegram, Web Chat leve e Antigravity.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo

Padronizar a entrega para manter:

- consistencia
- legibilidade
- previsibilidade
- suporte a respostas em multiplas mensagens

---

## Ordem Recomendada dos Arquivos

1. PRD.md
2. architecture.md
3. agent-loop.md
4. memory.md
5. skill-user.md
6. tools.md (quando aplicavel)
7. telegram-input.md (quando aplicavel)
8. telegram-output.md (quando aplicavel)
9. output-format.md (quando aplicavel)
10. validation.md (quando aplicavel)
11. domain-rules.md (quando aplicavel)

---

## Formato de Cada Arquivo

Cada arquivo deve ser entregue separadamente:

```text
Arquivo: nome-do-arquivo.md
[conteudo completo do arquivo]
```

---

## Regras de Formato

### 1. Separacao clara

- nao misturar dois arquivos no mesmo bloco sem delimitacao
- identificar sempre o nome do arquivo

### 2. Completude

- entregar conteudo completo do arquivo revisado
- evitar respostas truncadas

### 3. Consistencia

- manter terminologia consistente entre os documentos
- manter alinhamento com PRD e architecture

### 4. Explicacao objetiva

- quando necessario, incluir resumo curto antes dos blocos
- evitar ruido excessivo fora dos arquivos

---

## Respostas Longas no Telegram

Quando o conteudo ultrapassar limite pratico de mensagem:

- dividir em partes sequenciais
- usar cabecalho `Parte X/N`
- manter ordem dos arquivos
- nao perder delimitacao por arquivo

Exemplo:

```text
Parte 1/2
Arquivo: PRD.md
...

Parte 2/2
Arquivo: architecture.md
...
```

No Web Chat leve, aplicar a mesma logica de segmentacao para preservar legibilidade.

---

## Compatibilidade

Formato deve ser:

- copiavel para arquivos `.md`
- amigavel para leitura no Telegram
- simples de reaproveitar no Antigravity

---

## Regras Criticas

### Nao fazer

- nao omitir arquivos essenciais do pedido
- nao trocar ordem sem motivo
- nao responder parcialmente sem indicar continuacao

### Fazer

- manter estrutura previsivel
- manter legibilidade
- informar claramente quando houver continuacao

---

## Limites

O output nao deve:

- incluir codigo executavel desnecessario
- misturar decisoes de arquitetura com ruido de apresentacao

---

## Resumo

O output-format garante entrega padronizada dos specs e permite resposta em multiplas mensagens no Telegram quando necessario, sem perder estrutura nem consistencia.

