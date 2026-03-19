# Domain Rules - Agent Architect

## Visao Geral

Este documento define guias por dominio para o Agent Architect gerar specs mais precisos sem engessar o sistema.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo

Aplicar contexto de dominio para melhorar qualidade de PRD, arquitetura, loop, memoria e tools.

---

## Principio Central

Adaptar sem limitar.

Regras sao heuristicas, nao bloqueios rigidos.

---

## Novo Dominio Estrategico: Agentes Conversacionais

### 1. Agentes conversacionais multi-turno

Caracteristicas:

- contexto por conversa
- refinamento incremental
- foco em clareza e continuidade

Riscos:

- perda de contexto
- respostas desconectadas entre turnos

Heuristicas:

- sempre recuperar contexto recente
- manter consistencia de objetivo da conversa

### 2. Bots Telegram

Caracteristicas:

- entrada/saida por mensagens
- limites de tamanho por mensagem
- interacao assicrona orientada a eventos

Riscos:

- mensagens longas sem segmentacao
- falhas de autorizacao

Heuristicas:

- validar usuario autorizado
- segmentar respostas longas em partes

### 2.1 Web Chat Leve

Caracteristicas:

- interface simples para conversa
- atualizacao incremental de UI
- baixo custo de manutencao

Stack recomendada:

- HTML + CSS + HTMX + Alpine.js

Riscos:

- crescimento descontrolado de complexidade no frontend
- acoplamento da UI ao core de negocio

Heuristicas:

- manter frontend enxuto
- evitar dependencias frontend pesadas sem necessidade
- preservar separacao entre interface e core

### 3. Runtime persistente orientado a eventos

Caracteristicas:

- long-running service
- listener ativo
- processamento continuo

Riscos:

- derivar para fluxo one-shot CLI-first
- acoplamento excessivo entre canal e core

Heuristicas:

- garantir startup com `npm run dev`
- separar core do adapter de interface
- tratar CLI apenas como apoio operacional

---

## Dominios de Negocio (mantidos)

### DBA / Banco de Dados

- foco: modelagem, performance, SQL
- cuidado: acoes destrutivas
- tools: SQL/read-first

### Financeiro

- foco: consistencia de registros
- cuidado: erros acumulativos
- tools: processamento de extratos e calculo

### Juridico

- foco: interpretacao textual precisa
- cuidado: conclusoes sem base
- tools: PDF/text processing

### Automacao / Engenharia

- foco: integracao e fluxo tecnico
- cuidado: execucao indevida
- tools: APIs e terminal restrito

### Marketing / Conteudo

- foco: comunicacao e impacto
- cuidado: generalidade
- tools: web/text analysis

### Documental / Analise de Arquivos

- foco: extracao e fidelidade de contexto
- cuidado: perda de estrutura
- tools: file processing e OCR opcional

---

## Estrategia de Aplicacao

1. detectar dominio principal e subdominios
2. aplicar apenas regras relevantes
3. combinar dominios quando necessario
4. ajustar linguagem e profundidade ao contexto

---

## Regras Importantes

### Nao fazer

- nao aplicar regra cegamente
- nao forcar dominio incorreto
- nao transformar guia em burocracia

### Fazer

- usar dominio para melhorar decisao
- manter flexibilidade
- preservar simplicidade implementavel

---

## Integracao com o Fluxo

```text
Mensagem do usuario
  ↓
Deteccao de dominio
  ↓
Aplicacao de regras relevantes
  ↓
Geracao/refino de specs
```

---

## Resumo

Domain-rules amplia o foco para agentes conversacionais, bots Telegram e runtimes persistentes orientados a eventos, sem perder adaptacao por dominio e sem engessar o Agent Architect.
