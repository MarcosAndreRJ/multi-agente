import fs from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import { config } from "./config.js";
import { MemoryStore } from "./memory/store.js";
import { OllamaClient } from "./llm/ollamaClient.js";
import { MultiAgentController } from "./core/multiAgentController.js";
import { createTelegramAdapter } from "./adapters/telegramAdapter.js";
import { registerWebAdapter } from "./adapters/webAdapter.js";

async function bootstrap(): Promise<void> {
  fs.mkdirSync(path.resolve(config.outputDir), { recursive: true });

  const app = Fastify({ logger: true });
  const memory = new MemoryStore(config.databasePath);
  const llmClient = new OllamaClient();
  const controller = new MultiAgentController(memory, llmClient);

  app.get("/health", async () => {
    return {
      ok: true,
      app: config.appName,
      telegramEnabled: config.enableTelegram,
      webEnabled: config.enableWebChat
    };
  });

  if (config.enableWebChat) {
    await registerWebAdapter(app, controller, memory);
  }

  const bot = createTelegramAdapter(controller, app.log);

  await app.listen({ host: config.host, port: config.port });
  app.log.info(`HTTP online em http://${config.host}:${config.port}`);

  if (bot) {
    await bot.launch();
    app.log.info("Telegram online.");
  }

  const shutdown = async () => {
    app.log.info("Encerrando runtime...");
    if (bot) {
      await bot.stop();
    }
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  // Falha em bootstrap deve encerrar o processo para evitar estado inconsistente.
  // eslint-disable-next-line no-console
  console.error("Erro fatal no bootstrap:", error);
  process.exit(1);
});
