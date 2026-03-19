import path from "node:path";
import type { FastifyInstance } from "fastify";
import fastifyFormbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import type { MultiAgentController } from "../core/multiAgentController.js";
import type { MemoryStore } from "../memory/store.js";
import multipart from "@fastify/multipart"; // Added
import fs from "node:fs"; // Added
import { config as appConfig } from "../config.js";

// Helper function to parse cookies (not provided in original, but needed for new logic)
function parseSessionCookies(cookieHeader: string | undefined): { sessionId?: string } {
  const cookies: { [key: string]: string } = {};
  cookieHeader?.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  return { sessionId: cookies['sessionId'] };
}

class SseHub {
  private readonly clients = new Map<string, Set<NodeJS.WritableStream>>();

  add(sessionId: string, stream: NodeJS.WritableStream): void {
    const current = this.clients.get(sessionId) ?? new Set<NodeJS.WritableStream>();
    current.add(stream);
    this.clients.set(sessionId, current);
  }

  remove(sessionId: string, stream: NodeJS.WritableStream): void {
    const current = this.clients.get(sessionId);
    if (!current) {
      return;
    }

    current.delete(stream);
    if (current.size === 0) {
      this.clients.delete(sessionId);
    }
  }

  send(sessionId: string, event: string, payload: unknown): void {
    const current = this.clients.get(sessionId);
    if (!current) {
      return;
    }

    const line = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const stream of current) {
      stream.write(line);
    }
  }
}

export async function registerWebAdapter(app: FastifyInstance, controller: MultiAgentController, memory: MemoryStore): Promise<void> {
  const hub = new SseHub();

  await app.register(fastifyFormbody);
  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } }); // Added multipart registration
  await app.register(fastifyStatic, {
    root: path.resolve("public"),
    prefix: "/public/"
  });

  app.get("/chat", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return reply.sendFile("chat.html");
  });

  // Evita 404 ruidoso nos logs
  app.get("/favicon.ico", async (_request, reply) => {
    return reply.code(204).send();
  });

  // Chrome DevTools probe — silencia nos logs
  app.get("/.well-known/appspecific/com.chrome.devtools.json", async (_request, reply) => {
    return reply.code(204).send();
  });

  // ── SSE stream por sessão ─────────────────────────────────
  app.get("/api/chat/stream/:sessionId", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.write("event: ready\ndata: {\"ok\":true}\n\n");

    hub.add(sessionId, reply.raw);

    request.raw.on("close", () => {
      hub.remove(sessionId, reply.raw);
    });

    return reply;
  });

  // ── Histórico de mensagens ──────────────────────────────
  app.get("/api/chat/history/:sessionId/:agentId", async (request, reply) => {
    const { sessionId, agentId } = request.params as { sessionId: string; agentId: string };
    const conversationId = agentId === "main" ? sessionId : `${sessionId}:${agentId}`;
    const msgs = memory.getRecentMessages("web", conversationId, 50);
    return reply.send({ ok: true, messages: msgs });
  });

  // ── Envio de mensagem + subcomandos ───────────────────────
  app.post("/api/chat/message", async (request, reply) => {
    let message = "";
    let agentId = "main";
    let sessionId = "";
    let fileContents = "";

    if (request.isMultipart()) {
      for await (const part of request.parts()) {
        if (part.type === "file") {
          const buffer = await part.toBuffer();
          if (part.filename) { // Ensure filename exists before using it
            fileContents += `\n\n--- Arquivo Anexado: ${part.filename} ---\n${buffer.toString("utf-8")}\n--- Fim do Anexo ---\n`;
          }
        } else {
          if (part.fieldname === "message") message += part.value as string;
          if (part.fieldname === "agentId") agentId = part.value as string;
          if (part.fieldname === "sessionId") sessionId = part.value as string;
        }
      }
    } else {
      const body = request.body as { message?: string; agentId?: string; sessionId?: string };
      message = body.message?.trim() || "";
      agentId = body.agentId?.trim() || "main";
      sessionId = body.sessionId?.trim() || "";
    }

    if (!message && !fileContents) {
      return reply.code(400).send({ ok: false, error: "Mensagem vazia." });
    }

    message += fileContents;

    if (!sessionId) {
      return reply.code(401).send({ ok: false, error: "Sem sessão válida" });
    }

    // Subcomandos
    if (message === "/reset") {
      memory.resetConversation("web", sessionId);
      hub.send(sessionId, "system", { text: "🔄 Conversa resetada.", agentId });
      return reply.send({ ok: true, command: "reset" });
    }

    if (message === "/stop") {
      controller.cancelPending(`web:${sessionId}`);
      hub.send(sessionId, "system", { text: "⏹ Geração interrompida.", agentId });
      return reply.send({ ok: true, command: "stop" });
    }

    if (message.startsWith("/delete")) {
      const parts = message.split(" ");
      const targetAgent = parts[1]?.trim();
      if (!targetAgent || targetAgent === "main") {
        return reply.code(400).send({ ok: false, error: "O agente principal não pode ser excluído." });
      }
      memory.deleteAgent("web", targetAgent);
      hub.send(sessionId, "system", { text: `🗑 Agente "${targetAgent}" excluído.`, agentId });
      return reply.send({ ok: true, command: "delete", agentId: targetAgent });
    }

    hub.send(sessionId, "user", { text: message, agentId });

    // Processa assíncrono sem await para liberar a request imediatamente
    controller.process({
      channel: "web",
      conversationId: agentId === "main" ? sessionId : `${sessionId}:${agentId}`,
      userId: sessionId,
      text: message
    }, (progressMsg) => {
      hub.send(sessionId, "system", { text: progressMsg, agentId });
    }, (chunk) => {
      hub.send(sessionId, "stream_chunk", { text: chunk, agentId });
    }).then((result) => {
      if (!appConfig.typewriterEffect) {
        hub.send(sessionId, "assistant", { text: result.final, agentId });
      } else {
        hub.send(sessionId, "stream_done", { text: result.final, agentId });
      }
    }).catch(() => {
      hub.send(sessionId, "assistant", {
        text: "⚠️ Erro ao processar. Verifique conexão com Ollama.",
        agentId
      });
    });

    return reply.send({ ok: true });
  });

  // ── Gerenciamento de agentes ──────────────────────────────
  app.get("/api/agents", async (_request, reply) => {
    const agents = memory.listAgents();
    return reply.send({ ok: true, agents });
  });

  app.post("/api/agents", async (request, reply) => {
    let name = "";
    let description = "";
    let llmModel = "";
    const filesToSave: { filename: string, data: Buffer }[] = [];

    if (request.isMultipart()) {
      for await (const part of request.parts()) {
        if (part.type === "file") {
          const buffer = await part.toBuffer();
          if (buffer.length > 0 && part.filename) filesToSave.push({ filename: part.filename, data: buffer });
        } else {
          if (part.fieldname === "name") name = part.value as string;
          if (part.fieldname === "description") description = part.value as string;
          if (part.fieldname === "llmModel") llmModel = part.value as string;
        }
      }
    } else {
      const body = request.body as { name?: string; description?: string; llmModel?: string };
      name = body.name || "";
      description = body.description || "";
      llmModel = body.llmModel || "";
    }

    name = name.trim();
    if (!name) return reply.code(400).send({ ok: false, error: "Nome do agente obrigatório." });

    const agent = memory.createAgent(name, description.trim(), llmModel.trim() || null);
    const contextPath = memory.getAgentContextPath(agent.id);

    for (const f of filesToSave) {
      fs.writeFileSync(path.join(contextPath, f.filename), f.data);
    }

    return reply.send({ ok: true, agent });
  });

  app.delete("/api/agents/:agentId", async (request, reply) => {
    const { agentId } = request.params as { agentId: string };
    if (agentId === "main") {
      return reply.code(400).send({ ok: false, error: "O agente principal não pode ser excluído." });
    }
    memory.deleteAgent("web", agentId);
    return reply.send({ ok: true });
  });

  app.put("/api/agents/:agentId", async (request, reply) => {
    const { agentId } = request.params as { agentId: string };
    if (agentId === "main") {
      return reply.code(400).send({ ok: false, error: "O agente principal não pode ser modificado assim." });
    }

    const { name, description, llmModel } = request.body as { name?: string; description?: string; llmModel?: string };
    if (!name || !name.trim()) return reply.code(400).send({ ok: false, error: "Nome é obrigatório." });

    memory.updateAgent(agentId, name.trim(), description?.trim() || "", llmModel?.trim() || null);
    return reply.send({ ok: true });
  });

  // ── Configurações LLM + Telegram ─────────────────────────
  app.get("/api/config", async (_request, reply) => {
    return reply.send({
      ok: true,
      config: {
        ollamaBaseUrl: appConfig.ollamaBaseUrl,
        ollamaModel: appConfig.ollamaModel,
        telegramBotToken: appConfig.telegramBotToken ? "***" : "",
        telegramAllowedUser: appConfig.telegramAllowedUserId || "",
        enableTelegram: appConfig.enableTelegram,
        enableWebChat: appConfig.enableWebChat
      }
    });
  });

  app.post("/api/config", async (request, reply) => {
    const body = request.body as {
      ollamaBaseUrl?: string;
      ollamaModel?: string;
      telegramBotToken?: string;
      telegramAllowedUser?: string;
      enableTelegram?: string;
      enableWebChat?: string;
    };

    // Atualiza em memória (sem reiniciar processo)
    if (body.ollamaBaseUrl) (appConfig as Record<string, unknown>).ollamaBaseUrl = body.ollamaBaseUrl.trim();
    if (body.ollamaModel) (appConfig as Record<string, unknown>).ollamaModel = body.ollamaModel.trim();
    if (body.telegramAllowedUser !== undefined) {
      (appConfig as Record<string, unknown>).telegramAllowedUserId = body.telegramAllowedUser.trim();
    }
    if (body.enableTelegram !== undefined) {
      (appConfig as Record<string, unknown>).enableTelegram = body.enableTelegram === "true";
    }
    if (body.enableWebChat !== undefined) {
      (appConfig as Record<string, unknown>).enableWebChat = body.enableWebChat === "true";
    }
    // token só se não for placeholder
    if (body.telegramBotToken && !body.telegramBotToken.startsWith("***")) {
      (appConfig as Record<string, unknown>).telegramBotToken = body.telegramBotToken.trim();
    }

    return reply.send({ ok: true });
  });
}
