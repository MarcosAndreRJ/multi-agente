import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { ChatRole, StoredMessage } from "../types.js";

export interface DBConfig {
  id: number;
  provider: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  telegramBotToken: string;
  telegramAllowedUser: string;
  enableTelegram: boolean;
  enableWebChat: boolean;
  showThoughtFlow: boolean;
  typewriterEffect: boolean;
}

export class MemoryStore {
  private readonly db: Database.Database;
  private readonly dbPath: string;
  private readonly agentsPath: string;
  private readonly specsPath: string;

  constructor(dbPath: string) {
    this.dbPath = path.resolve(dbPath);
    this.agentsPath = path.resolve(process.env.AGENTS_PATH || "agents");
    this.specsPath = path.resolve(process.env.SPECS_PATH || "specs");

    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    fs.mkdirSync(this.agentsPath, { recursive: true });
    fs.mkdirSync(this.specsPath, { recursive: true });

    this.db = new Database(this.dbPath);
    this.setup();
  }

  private setup(): void {
    try {
      this.db.exec("ALTER TABLE agents ADD COLUMN llmModel TEXT;");
    } catch (err: any) {
      if (!err.message.includes("duplicate column name")) {
        console.error("Erro ao rodar migration em agents:", err.message);
      }
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel TEXT NOT NULL,
        external_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(channel, external_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        agent_name TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        llmModel TEXT,
        created_at TEXT NOT NULL
      );

      INSERT OR IGNORE INTO agents(id, name, description, created_at)
      VALUES('main', 'Principal', 'Agente principal do sistema', datetime('now'));
    `);
  }

  private getOrCreateConversationId(channel: string, externalId: string): number {
    const existing = this.db
      .prepare("SELECT id FROM conversations WHERE channel = ? AND external_id = ?")
      .get(channel, externalId) as { id: number } | undefined;

    if (existing) {
      return existing.id;
    }

    const now = new Date().toISOString();
    const result = this.db
      .prepare("INSERT INTO conversations(channel, external_id, created_at) VALUES(?, ?, ?)")
      .run(channel, externalId, now);

    return Number(result.lastInsertRowid);
  }

  addMessage(
    channel: string,
    externalId: string,
    role: ChatRole,
    content: string,
    agentName: string | null = null
  ): void {
    const conversationId = this.getOrCreateConversationId(channel, externalId);
    const now = new Date().toISOString();
    this.db
      .prepare(
        "INSERT INTO messages(conversation_id, role, agent_name, content, created_at) VALUES(?, ?, ?, ?, ?)"
      )
      .run(conversationId, role, agentName, content, now);
  }

  getRecentMessages(channel: string, externalId: string, limit = 20): StoredMessage[] {
    const conversation = this.db
      .prepare("SELECT id FROM conversations WHERE channel = ? AND external_id = ?")
      .get(channel, externalId) as { id: number } | undefined;

    if (!conversation) {
      return [];
    }

    const rows = this.db
      .prepare(
        `SELECT role, agent_name as agentName, content, created_at as createdAt
         FROM messages
         WHERE conversation_id = ?
         ORDER BY id DESC
         LIMIT ?`
      )
      .all(conversation.id, limit) as StoredMessage[];

    return rows.reverse();
  }

  resetConversation(channel: string, externalId: string): void {
    const conversation = this.db
      .prepare("SELECT id FROM conversations WHERE channel = ? AND external_id = ?")
      .get(channel, externalId) as { id: number } | undefined;

    if (conversation) {
      this.db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(conversation.id);
    }
  }

  // ── Gerenciamento de agentes ─────────────────────────────

  listAgents(): Array<{ id: string; name: string; description: string; llmModel: string | null; createdAt: string }> {
    return this.db
      .prepare("SELECT id, name, description, llmModel, created_at as createdAt FROM agents ORDER BY id ASC")
      .all() as Array<{ id: string; name: string; description: string; llmModel: string | null; createdAt: string }>;
  }

  createAgent(name: string, description: string, llmModel?: string | null): { id: string; name: string; description: string; llmModel?: string | null } {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40);
    const now = new Date().toISOString();
    this.db
      .prepare("INSERT OR IGNORE INTO agents(id, name, description, llmModel, created_at) VALUES(?, ?, ?, ?, ?)")
      .run(id, name, description, llmModel || null, now);
      
    const agentDir = path.join(this.agentsPath, name);
    fs.mkdirSync(agentDir, { recursive: true });

    return { id, name, description, llmModel };
  }

  getAgentContextPath(id: string): string {
    if (id === "main") return this.specsPath;
    const row = this.db.prepare("SELECT name FROM agents WHERE id = ?").get(id) as { name: string } | undefined;
    const name = row ? row.name : id;
    const agentDir = path.join(this.agentsPath, name);
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
    return agentDir;
  }

  updateAgentDescription(id: string, description: string): void {
    if (id === "main") return;
    this.db.prepare("UPDATE agents SET description = ? WHERE id = ?").run(description, id);
  }

  updateAgent(id: string, name: string, description: string, llmModel?: string | null): void {
    if (id === "main") return;
    this.db.prepare("UPDATE agents SET name = ?, description = ?, llmModel = ? WHERE id = ?").run(name, description, llmModel || null, id);
  }

  deleteAgent(channel: string, agentId: string): void {
    if (agentId === "main") return;
    // Remove conversas do agente e o próprio registro
    const convs = this.db
      .prepare("SELECT id FROM conversations WHERE channel = ? AND external_id LIKE ?")
      .all(channel, `%:${agentId}`) as Array<{ id: number }>;

    const deleteMessages = this.db.prepare("DELETE FROM messages WHERE conversation_id = ?");
    const deleteConv     = this.db.prepare("DELETE FROM conversations WHERE id = ?");
    for (const c of convs) {
      deleteMessages.run(c.id);
      deleteConv.run(c.id);
    }
    this.db.prepare("DELETE FROM agents WHERE id = ? AND id != 'main'").run(agentId);
  }
}
