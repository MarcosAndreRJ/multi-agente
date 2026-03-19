import type { StoredMessage } from "../types.js";
import { OllamaClient } from "../llm/ollamaClient.js";

function historyToText(history: StoredMessage[]): string {
  return history
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n")
    .slice(-8000);
}

export class PlannerAgent {
  constructor(private readonly llm: OllamaClient) {}

  async run(userText: string, history: StoredMessage[], onChunk?: (chunk: string) => void, options?: { llmModel?: string }): Promise<string> {
    const system =
      "Voce e o PlannerAgent. Crie um mini-plano em 3 passos para responder o usuario no contexto do Agent Architect. Seja direto.";

    const prompt = `Historico:\n${historyToText(history)}\n\nMensagem do usuario:\n${userText}\n\nRetorne apenas os 3 passos.`;

    return this.llm.generate(system, prompt, onChunk, options?.llmModel);
  }
}

export class SpecialistAgent {
  constructor(private readonly llm: OllamaClient) {}

  async run(userText: string, history: StoredMessage[], plan: string, onChunk?: (chunk: string) => void, options?: { llmModel?: string; customPrompt?: string }): Promise<string> {
    const exportRules = "Se o usuario pedir para gerar um PDF, forneca o CONTEÚDO entre as tags <export_pdf> e </export_pdf>. Se pedir Excel (XLSX), retorne ESTRITAMENTE um array JSON valido entre <export_xlsx> e </export_xlsx>.";
    const mysqlRules = "Se precisar consultar um banco de dados MySQL para responder, gere a tag: <execute_mysql host='Host' port='3306' user='User' pass='Senha' db='Database'>SELECT...</execute_mysql>. Se o usuário não forneceu as credenciais (host, user, pass, db) na conversa, você DEVE perguntar a ele. NÃO invente credenciais.";
    const systemInfoRule = "Se o usuario perguntar qual modelo de AI ou provider voce esta usando, use a tag: <get_system_info />. Ela retornara os detalhes tecnicos ativos.";
    const antiHallucinationRule = "REGRAS DE VERACIDADE: Se o resultado de uma ferramenta (SQL, Sistema, etc) for vazio, 'null' ou indicar que nada foi encontrado, você DEVE dizer explicitamente que não encontrou resultados. É TERMINANTEMENTE PROIBIDO inventar, supor ou alucinar dados que não estão nos resultados reais enviados pelo sistema.";
    const baseSystem = "Voce e o SpecialistAgent do Agent Architect. Responda em pt-br. " + antiHallucinationRule;
    
    // Always include tool rules and anti-hallucination even with custom prompts
    const coreRules = `\n\n=== REGRAS OBRIGATÓRIAS ===\n${mysqlRules}\n${systemInfoRule}\n${antiHallucinationRule}`;
    
    const system = options?.customPrompt && options.customPrompt.trim().length > 0
      ? `${options.customPrompt}${coreRules}`
      : `${baseSystem}${coreRules}`;

    const prompt = `Plano:\n${plan}\n\nHistorico:\n${historyToText(history)}\n\nMensagem do usuario:\n${userText}\n\nGere uma resposta util e estruturada.`;

    return this.llm.generate(system, prompt, onChunk, options?.llmModel);
  }
}

export class ReviewerAgent {
  constructor(private readonly llm: OllamaClient) {}

  async run(draft: string, onChunk?: (chunk: string) => void, options?: { llmModel?: string }): Promise<string> {
    const system =
      "Voce e o ReviewerAgent. Melhore clareza e consistencia, sem mudar o objetivo. Responda apenas com a versao final.";

    const prompt = `Melhore a resposta abaixo:\n\n${draft}`;

    return this.llm.generate(system, prompt, onChunk, options?.llmModel);
  }
}
