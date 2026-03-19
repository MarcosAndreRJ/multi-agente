import { OllamaClient } from "../llm/ollamaClient.js";
import { PlannerAgent, ReviewerAgent, SpecialistAgent } from "../agents/specialistAgents.js";
import { MemoryStore } from "../memory/store.js";
import { processExportTags } from "./fileGenerator.js";
import { executeMysqlQuery } from "../tools/mysqlTool.js";
import type { AgentResult, IncomingMessage } from "../types.js";
import { config } from "../config.js";
import fs from "node:fs";
import path from "node:path";

export class MultiAgentController {
  private readonly planner: PlannerAgent;
  private readonly specialist: SpecialistAgent;
  private readonly reviewer: ReviewerAgent;
  private readonly queue = new Map<string, Promise<string>>();
  private readonly cancelled = new Set<string>();

  constructor(private readonly memory: MemoryStore, private readonly llm: OllamaClient) {
    this.planner = new PlannerAgent(llm);
    this.specialist = new SpecialistAgent(llm);
    this.reviewer = new ReviewerAgent(llm);
  }

  cancelPending(key: string): void {
    this.cancelled.add(key);
  }

  async process(
    input: IncomingMessage,
    onProgress?: (msg: string) => void,
    onStream?: (chunk: string) => void
  ): Promise<AgentResult> {
    const key = `${input.channel}:${input.conversationId}`;
    this.cancelled.delete(key);
    const previous = this.queue.get(key) ?? Promise.resolve("");

    const current = previous
      .catch(() => "")
      .then(async () => {
        if (this.cancelled.has(key)) {
          this.cancelled.delete(key);
          return JSON.stringify({ planner: "", specialist: "", reviewer: "", final: "" });
        }

        const isMain = !input.conversationId.includes(":");
        const parts = input.conversationId.split(":");
        const agentId = isMain ? "main" : parts[1];

        if (isMain) {
          const match = input.text.match(/^@([a-zA-Z0-9_-]+)\s+(.*)/s);
          if (match) {
            const targetName = match[1];
            const instruction = match[2];
            const targetAgent = this.memory.listAgents().find(
              a => a.name.toLowerCase() === targetName.toLowerCase() || a.id === targetName.toLowerCase()
            );

            if (targetAgent) {
              if (config.showThoughtFlow) onProgress?.(`⚙️ Atualizando o agente **${targetAgent.name}**...`);
              const sys = "Você é um AI assistente modificando o prompt de sistema de outro agente. Receba o prompt atual e as instruções para alteração. Retorne APENAS o NOVO PROMPT REESCRITO (sem explicações ou tags md).";
              const prompt = `[PROMPT ATUAL]:\n${targetAgent.description}\n\n[ALTERAÇÃO SOLICITADA]:\n${instruction}\n\nEscreva agora o novo prompt:`;
              const newPrompt = await this.llm.generate(sys, prompt);
              this.memory.updateAgentDescription(targetAgent.id, newPrompt.trim());
              
              const msg = `✅ O prompt de instruções do agente **${targetAgent.name}** foi atualizado com sucesso!`;
              this.memory.addMessage(input.channel, input.conversationId, "user", input.text, null);
              this.memory.addMessage(input.channel, input.conversationId, "assistant", msg, "main");
              return JSON.stringify({ planner: "", specialist: "", reviewer: "", final: msg });
            }
          }
        }

        this.memory.addMessage(input.channel, input.conversationId, "user", input.text, null);
        const history = this.memory.getRecentMessages(input.channel, input.conversationId, 20);

        try {
          // Resolve model upfront so the Planner uses it if we want, or default it uses root? Let's use it for the Planner too if we are inside a context.
          const activeAgentFallback = this.memory.listAgents().find(a => a.id === agentId);
          const resolvedModelTop = activeAgentFallback?.llmModel && activeAgentFallback.llmModel.trim().length > 0
            ? activeAgentFallback.llmModel.trim()
            : config.ollamaModel;

          if (config.showThoughtFlow) onProgress?.("⚙️ PlannerAgent está analisando o contexto...");
          const planner = await this.planner.run(input.text, history, undefined, { llmModel: resolvedModelTop });

          if (this.cancelled.has(key)) {
            this.cancelled.delete(key);
            return JSON.stringify({ planner, specialist: "", reviewer: "", final: "" });
          }

          const activeAgent = this.memory.listAgents().find(a => a.id === agentId);
          let customPrompt = activeAgent ? activeAgent.description : "";
          
          const resolvedModel = activeAgent?.llmModel && activeAgent.llmModel.trim().length > 0
            ? activeAgent.llmModel.trim()
            : config.ollamaModel;
            
          console.log(`[Agent:${activeAgent?.name || 'main'}] resolved model = ${resolvedModel}`);

          if (activeAgent) {
            const ctxPath = this.memory.getAgentContextPath(activeAgent.id);
            if (fs.existsSync(ctxPath)) {
              for (const file of fs.readdirSync(ctxPath)) {
                if (file.endsWith(".md") || file.endsWith(".txt") || file.endsWith(".json") || file.endsWith(".csv")) {
                  const content = fs.readFileSync(path.join(ctxPath, file), "utf-8");
                  customPrompt += `\n\n=== CONTEXTO ADICIONAL DO ARQUIVO: ${file} ===\n${content}\n=== FIM DO ARQUIVO ===\n`;
                }
              }
            }
          }

          if (isMain) {
             const allAgents = this.memory.listAgents();
             const agentsListStr = allAgents.filter(a => a.id !== 'main').map(a => `- **Nome:** ${a.name}\n  **ID:** ${a.id}\n  **Descrição:** ${a.description}`).join('\n\n');
             customPrompt += `\n\n[SISTEMA]: Você é o Agente Principal. Você tem acesso aos seguintes agentes especialistas que você mesmo gerencia:\n${agentsListStr}\nReconheça APENAS estes agentes listados. Não presuma, invente ou alucine sobre a existência de outros agentes (ex: não existe PlannerAgent, ReviewerAgent ou Assistant para o usuário, apenas os listados acima).\n\n[SISTEMA - INFORMAÇÕES TÉCNICAS DO SEU RUNTIME]:\n- Provider: ${config.llmProvider}\n- Modelo LLM: ${resolvedModel}\n- URL: ${config.ollamaBaseUrl}`;
          }

          // --- PROACTIVE SYSTEM INFO INJECTION ---
          // If the user is asking about the model or provider, inject real info immediately
          // instead of relying on the LLM to emit <get_system_info />
          const sysInfoKeywords = /modelo|model|llm|provider|provedor|que (?:ia|modelo|ai)|qual (?:ia|modelo|ai)|using|usando/i;
          if (sysInfoKeywords.test(input.text)) {
            const info = `[SISTEMA - CONFIGURAÇÕES ATIVAS DO SEU RUNTIME]:\n- Provider LLM: ${config.llmProvider}\n- Modelo LLM: ${resolvedModel}\n- Base URL: ${config.ollamaBaseUrl}\nVocê DEVE usar exatamente esses dados quando responder sobre seu modelo. NÃO invente ou presuma outro modelo.`;
            customPrompt += `\n\n${info}`;
          }

          if (config.showThoughtFlow) onProgress?.(`⚙️ SpecialistAgent está elaborando a resposta (\n${planner}\n)...`);
          let specialist = await this.specialist.run(input.text, history, planner, undefined, { llmModel: resolvedModel, customPrompt });

          // Tool Intercept Loop (MySQL, System Info)
          let hasPendingTools = true;
          let interceptCount = 0;
          
          while (hasPendingTools && interceptCount < 5) {
            hasPendingTools = false;
            interceptCount++;

            // MySQL Tool (Flexible Regex)
            const mysqlMatch = specialist.match(/<execute_mysql\s+([^>]+)>(.*?)<\/execute_mysql>/is);
            if (mysqlMatch) {
              const attrsRaw = mysqlMatch[1];
              const query = mysqlMatch[2].trim();

              const getAttr = (name: string) => {
                const m = attrsRaw.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
                return m ? m[1] : null;
              };

              const host = getAttr("host");
              const user = getAttr("user");
              const pass = getAttr("pass");
              const db = getAttr("db");
              const portStr = getAttr("port");
              const port = portStr ? parseInt(portStr, 10) : 3306;

              if (host && user && pass && db) {
                if (config.showThoughtFlow) onProgress?.(`⚙️ Executando consulta MySQL em ${db}...`);
                const dbResult = await executeMysqlQuery(host, port, user, pass, db, query);
                
                customPrompt += `\n\n[SISTEMA - RESULTADO REAL DO BANCO]:\n${dbResult}\n\nInstrução: Use os dados acima para responder. Se estiver vazio, diga que não encontrou nada. NUNCA invente dados.`;
                specialist = await this.specialist.run("Analise o resultado acima e finalize a resposta ao usuário.", history, planner, undefined, { llmModel: resolvedModel, customPrompt });
                hasPendingTools = true;
              } else {
                specialist = "⚠️ Erro: Tag <execute_mysql> incompleta. Certifique-se de incluir host, user, pass e db.";
                hasPendingTools = false;
              }
            }

            // System Info Tool
            if (specialist.includes("<get_system_info />")) {
               if (config.showThoughtFlow) onProgress?.("⚙️ Consultando informações do sistema...");
               const info = `[SISTEMA - CONFIGURAÇÕES ATIVAS]:\n- Provider: ${config.llmProvider}\n- Modelo: ${resolvedModel}\n- Base URL: ${config.ollamaBaseUrl}\nUtilize estas informações para responder ao usuário com precisão.`;
               customPrompt += `\n\n${info}`;
               specialist = await this.specialist.run("Responda ao usuário informando o provider e modelo ativos.", history, planner, undefined, { llmModel: resolvedModel, customPrompt });
               hasPendingTools = true;
            }
          }

          if (this.cancelled.has(key)) {
            this.cancelled.delete(key);
            return JSON.stringify({ planner, specialist, reviewer: "", final: specialist });
          }

          if (config.showThoughtFlow) onProgress?.("⚙️ ReviewerAgent está finalizando os detalhes...");
          
          let reviewer = "";
          if (config.typewriterEffect) {
             reviewer = await this.reviewer.run(specialist, onStream, { llmModel: resolvedModel });
          } else {
             reviewer = await this.reviewer.run(specialist, undefined, { llmModel: resolvedModel });
          }
          
          const finalRaw = reviewer || specialist;
          const finalParsed = await processExportTags(finalRaw);

          this.memory.addMessage(input.channel, input.conversationId, "assistant", finalParsed, "reviewer-agent");

          return JSON.stringify({ planner, specialist, reviewer, final: finalParsed });
        } catch (error) {
          const fallback =
            "Nao consegui consultar o modelo agora. Vou manter o runtime ativo. Tente novamente em instantes ou valide a conexao com o Ollama.";
          this.memory.addMessage(input.channel, input.conversationId, "assistant", fallback, "fallback-agent");
          return JSON.stringify({ planner: "", specialist: fallback, reviewer: fallback, final: fallback });
        }
      });

    this.queue.set(key, current);
    const resultRaw = await current;

    if (this.queue.get(key) === current) {
      this.queue.delete(key);
    }

    return JSON.parse(resultRaw) as AgentResult;
  }
}
