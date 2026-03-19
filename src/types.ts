export type Channel = "telegram" | "web";

export type ChatRole = "user" | "assistant" | "system";

export interface IncomingMessage {
  channel: Channel;
  conversationId: string;
  userId: string;
  text: string;
}

export interface AgentResult {
  planner: string;
  specialist: string;
  reviewer: string;
  final: string;
}

export interface StoredMessage {
  role: ChatRole;
  agentName: string | null;
  content: string;
  createdAt: string;
}
