import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  APP_NAME: z.string().default("agent-architect"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LLM_PROVIDER: z.string().default("ollama"),
  OLLAMA_BASE_URL: z.string().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1:8b"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ALLOWED_USER_ID: z.string().optional(),
  ENABLE_TELEGRAM: z.string().default("true"),
  ENABLE_WEB_CHAT: z.string().default("true"),
  SHOW_THOUGHT_FLOW: z.string().default("true"),
  TYPEWRITER_EFFECT: z.string().default("true"),
  DATABASE_PATH: z.string().default("./data/agent-architect.db"),
  OUTPUT_DIR: z.string().default("./output")
});

const parsed = schema.parse(process.env);

export const config = {
  nodeEnv: parsed.NODE_ENV,
  appName: parsed.APP_NAME,
  port: parsed.PORT,
  host: parsed.HOST,
  llmProvider: parsed.LLM_PROVIDER,
  ollamaBaseUrl: parsed.OLLAMA_BASE_URL,
  ollamaModel: parsed.OLLAMA_MODEL,
  telegramBotToken: parsed.TELEGRAM_BOT_TOKEN,
  telegramAllowedUserId: parsed.TELEGRAM_ALLOWED_USER_ID,
  enableTelegram: parsed.ENABLE_TELEGRAM === "true",
  enableWebChat: parsed.ENABLE_WEB_CHAT === "true",
  showThoughtFlow: parsed.SHOW_THOUGHT_FLOW === "true",
  typewriterEffect: parsed.TYPEWRITER_EFFECT === "true",
  databasePath: parsed.DATABASE_PATH,
  outputDir: parsed.OUTPUT_DIR
};
