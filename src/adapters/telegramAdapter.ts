import type { FastifyBaseLogger } from "fastify";
import { Telegraf } from "telegraf";
import { config } from "../config.js";
import type { MultiAgentController } from "../core/multiAgentController.js";
import { chunkText } from "../utils/text.js";

export function createTelegramAdapter(controller: MultiAgentController, logger: FastifyBaseLogger): Telegraf | null {
  if (!config.enableTelegram) {
    logger.info("Telegram desabilitado por configuracao.");
    return null;
  }

  if (!config.telegramBotToken) {
    logger.warn("TELEGRAM_BOT_TOKEN nao definido. Telegram nao sera iniciado.");
    return null;
  }

  const bot = new Telegraf(config.telegramBotToken);

  bot.on("text", async (ctx) => {
    const from = ctx.from;
    if (!from) {
      return;
    }

    if (config.telegramAllowedUserId && config.telegramAllowedUserId !== String(from.id)) {
      await ctx.reply("Usuario nao autorizado.");
      return;
    }

    const text = ctx.message.text?.trim();
    if (!text) {
      await ctx.reply("Envie uma mensagem de texto.");
      return;
    }

    const result = await controller.process({
      channel: "telegram",
      conversationId: String(ctx.chat.id),
      userId: String(from.id),
      text
    });

    const parts = chunkText(result.final, 3500);
    for (const part of parts) {
      await ctx.reply(part);
    }
  });

  return bot;
}
