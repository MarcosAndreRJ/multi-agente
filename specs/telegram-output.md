# Telegram Output - Agent Architect

## Visao Geral

Este modulo define como o Agent Architect entrega respostas no Telegram, que e o canal principal de saida do sistema.

Web Chat leve pode coexistir como canal complementar com padrao de resposta equivalente.

Diretriz principal:

"O modo padrao de operacao do agente deve ser um runtime persistente orientado a eventos, com Telegram como interface principal de entrada e saida. A aplicacao deve iniciar com um comando simples, permanecer em execucao e processar mensagens em multiplos turnos, mantendo contexto de conversa quando aplicavel. CLI deve ser apenas opcional e secundaria."

---

## Objetivo

Garantir que toda saida padrao seja legivel, estruturada e compativel com Telegram em desktop e mobile.

---

## Regras Gerais de Saida

- toda resposta funcional deve ser preparada para Telegram
- no Web Chat complementar, manter a mesma estrutura logica
- organizar por blocos claros
- preservar ordem logica dos arquivos
- manter linguagem objetiva

---

## Tipos de Saida

### 1. Geracao completa

Resposta deve incluir:

- resumo curto do que foi gerado
- blocos por arquivo (`PRD.md`, `architecture.md`, etc.)

### 2. Refinamento

Resposta deve incluir:

- arquivo(s) alterado(s)
- o conteudo revisado
- resumo curto do impacto

### 3. Erro/alerta

Resposta deve incluir:

- motivo em linguagem clara
- proximo passo sugerido

---

## Formato Recomendado

```text
Arquivo: nome-do-arquivo.md
[conteudo]
```

Quando houver muitos arquivos, separar por mensagens sequenciais mantendo numeracao de parte.

---

## Tratamento de Respostas Longas

Obrigatorio para conteudo grande:

- dividir em multiplas mensagens
- manter sequencia `Parte X/N`
- nao quebrar no meio de bloco critico sem aviso
- manter delimitacao clara de onde cada arquivo comeca/termina

Exemplo:

```text
Parte 1/3
Arquivo: PRD.md
...

Parte 2/3
Arquivo: architecture.md
...
```

---

## Compatibilidade com Telegram

- respeitar limite de tamanho por mensagem
- aplicar chunking automatico quando necessario
- evitar mensagens excessivamente densas

No Web Chat, aplicar segmentacao semelhante para manter leitura fluida.

---

## Legibilidade

- frases curtas
- secoes visiveis
- listas quando fizer sentido
- sem poluicao visual

---

## Limites

Este modulo nao deve:

- interpretar intencao
- alterar decisao arquitetural
- executar regras de negocio do core

Papel exclusivo:

Formatar -> Organizar -> Entregar.

---

## Resumo

Telegram Output garante que a comunicacao padrao do Agent Architect seja Telegram-first, com saidas estruturadas, legiveis e segmentadas quando necessario.
