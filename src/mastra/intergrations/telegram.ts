import TelegramBot from "node-telegram-bot-api";
import { weatherAgent } from "../agents/weather-agent";
import { InMemoryLanguageStore } from "../tools/language/language-store";
import { LanguageService } from "../tools/language/language-service";
import { loadLanguageConfig } from "../tools/language/language-config";

const languageConfig = loadLanguageConfig();
const languageService = new LanguageService(
  new InMemoryLanguageStore(languageConfig.defaultLang),
  languageConfig
);

/**
 * TelegramIntegration
 *
 * Lightweight integration that listens for Telegram messages (polling)
 * and forwards text messages to the `miloAgent` streaming API, then
 * progressively edits or sends Telegram messages to stream content
 * back to the user.
 *
 * Responsibilities:
 * - Validate incoming messages (only handle text)
 * - Send a placeholder message and stream incremental updates
 * - Escape MarkdownV2 and truncate large tool outputs
 * - Handle edit failures and fall back to sending new messages
 * - Catch and notify on processing errors
 */
export class TelegramIntegration {
  private bot: TelegramBot;
  private readonly MAX_MESSAGE_LENGTH = 4096; // Telegram's message length limit
  private readonly MAX_RESULT_LENGTH = 500; // Maximum length for tool results

  constructor(token: string) {
    // Create a bot instance
    this.bot = new TelegramBot(token, { polling: true });

    // Handle incoming messages
    this.bot.on("message", this.handleMessage.bind(this));
  }

  /**
   * Escape special characters for Telegram MarkdownV2.
   *
   * Telegram requires certain characters to be escaped when using
   * MarkdownV2 mode. This helper applies a minimal escaping so that
   * dynamically generated text (including code blocks or tool output)
   * does not accidentally break message formatting.
   *
   * @param text - raw text to escape
   * @returns escaped text safe for MarkdownV2
   */
  private escapeMarkdown(text: string): string {
    // Escape special Markdown characters
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
  }

  /**
   * Truncate a string to `maxLength` and append a truncation notice.
   *
   * Used to keep messages and embedded JSON small enough for Telegram
   * and to avoid overflowing the platform limits.
   *
   * @param str - input string
   * @param maxLength - maximum allowed length
   * @returns truncated string when necessary
   */
  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "... [truncated]";
  }

  /**
   * Format a tool result (arbitrary JS object) as escaped, truncated JSON.
   *
   * This makes tool outputs readable in Telegram while preventing overly
   * long payloads. If JSON serialization fails, returns a short typed note.
   *
   * @param result - arbitrary value returned by a tool
   * @returns string safe for insertion into a Markdown message
   */
  private formatToolResult(result: any): string {
    try {
      const jsonString = JSON.stringify(result, null, 2);
      return this.escapeMarkdown(
        this.truncateString(jsonString, this.MAX_RESULT_LENGTH)
      );
    } catch (error) {
      return `[Complex data structure - ${typeof result}]`;
    }
  }

  /**
   * Update an existing Telegram message (edit) or send a new one as fallback.
   *
   * Behavior:
   * - If the text is within Telegram's length limit and a `messageId` is
   *   provided, attempt to `editMessageText` to reduce message churn.
   * - If editing fails (e.g. message too old) or the text is too long,
   *   send a new message. If sending still fails due to length, truncate
   *   and send a final fallback message.
   *
   * @param chatId - Telegram chat id
   * @param messageId - optional existing message id to edit
   * @param text - message content (already escaped for MarkdownV2)
   * @returns the message id that now contains the latest content
   */
  private async updateOrSplitMessage(
    chatId: number,
    messageId: number | undefined,
    text: string
  ): Promise<number> {
    // If text is within limits, try to update existing message
    if (text.length <= this.MAX_MESSAGE_LENGTH && messageId) {
      try {
        await this.bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "MarkdownV2",
        });
        return messageId;
      } catch (error) {
        console.error("Error updating message:", error);
      }
    }

    // If text is too long or update failed, send as new message
    try {
      const newMessage = await this.bot.sendMessage(chatId, text, {
        parse_mode: "MarkdownV2",
      });
      return newMessage.message_id;
    } catch (error) {
      console.error("Error sending message:", error);
      // If the message is still too long, truncate it
      const truncated =
        text.substring(0, this.MAX_MESSAGE_LENGTH - 100) +
        "\n\n... [Message truncated due to length]";
      const fallbackMsg = await this.bot.sendMessage(chatId, truncated, {
        parse_mode: "MarkdownV2",
      });
      return fallbackMsg.message_id;
    }
  }

  /**
   * Handle an incoming Telegram message event.
   *
   * Flow summary:
   * 1. Validate that the message contains text (otherwise reply and return).
   * 2. Send an initial placeholder message and open a streaming call to
   *    `miloAgent.stream(...)`.
   * 3. Consume chunks from the returned async iterable and append them to
   *    an accumulating `currentResponse` string. Periodically attempt to
   *    `editMessageText` to update the user in-place; fall back to sending
   *    new messages when necessary.
   * 4. When the stream finishes, issue a final update. Any thrown errors
   *    are caught and a generic failure message is sent to the user.
   *
   * Notes:
   * - The method escapes Markdown and truncates long tool results.
   * - UPDATE_INTERVAL throttles edits to avoid hitting Telegram rate limits.
   *
   * @param msg - Telegram message payload from node-telegram-bot-api
   */
  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from?.username || "unknown";
    const firstName = msg.from?.first_name || "unknown";
    const userId = msg.from?.id.toString() || `anonymous-${chatId}`;
    const { lang, source } = await languageService.ensureLanguage(
      userId,
      text || undefined
    );

    if (!text) {
      await this.bot.sendMessage(
        chatId,
        "Sorry, I can only process text messages."
      );
      return;
    }

    // If ALWAYS_REPLY_OK=1, reply "ok" to every text message and stop further processing.
    if (process.env.ALWAYS_REPLY_OK === "1") {
      console.info(
        `[telegram] state=always_reply_ok chatId=${chatId} userId=${userId}`
      );
      await this.bot.sendMessage(chatId, "ok");
      return;
    }

    try {
      // Send initial message
      const sentMessage = await this.bot.sendMessage(chatId, "Thinking...");
      let currentResponse = "";
      let lastUpdate = Date.now();
      let currentMessageId = sentMessage.message_id;
      const UPDATE_INTERVAL = 500; // Update every 500ms to avoid rate limits

      // Stream response using the agent
      const stream = await weatherAgent.stream(text, {
        threadId: `telegram-${chatId}`, // Use chat ID as thread ID
        resourceId: userId, // Use user ID as resource ID
        context: [
          {
            role: "system",
            content: `Current user: ${firstName} (${username})`,
          },
          {
            role: "system",
            content: `User preferred language: ${lang} (source=${source}). Respond ONLY in ${lang}.`,
          },
        ],
      });

      // Process the full stream
      for await (const chunk of stream.fullStream) {
        let shouldUpdate = false;
        let chunkText = "";

        switch (chunk.type) {
          case "text-delta":
            chunkText = this.escapeMarkdown(chunk.textDelta);
            shouldUpdate = true;
            break;

          case "tool-call":
            const formattedArgs = JSON.stringify(chunk.args, null, 2);
            chunkText = `\n🛠️ Using tool: ${this.escapeMarkdown(
              chunk.toolName
            )}\nArguments:\n\`\`\`\n${this.escapeMarkdown(
              formattedArgs
            )}\n\`\`\`\n`;
            console.log(`Tool call: ${chunk.toolName}`, chunk.args);
            shouldUpdate = true;
            break;

          case "tool-result":
            const formattedResult = this.formatToolResult(chunk.result);
            chunkText = `✨ Result:\n\`\`\`\n${formattedResult}\n\`\`\`\n`;
            console.log("Tool result:", chunk.result);
            shouldUpdate = true;
            break;

          case "error":
            chunkText = `\n❌ Error: ${this.escapeMarkdown(
              String(chunk.error)
            )}\n`;
            console.error("Error:", chunk.error);
            shouldUpdate = true;
            break;

          case "reasoning":
            chunkText = `\n💭 ${this.escapeMarkdown(chunk.textDelta)}\n`;
            console.log("Reasoning:", chunk.textDelta);
            shouldUpdate = true;
            break;
        }

        if (shouldUpdate) {
          currentResponse += chunkText;
          const now = Date.now();
          if (now - lastUpdate >= UPDATE_INTERVAL) {
            try {
              currentMessageId = await this.updateOrSplitMessage(
                chatId,
                currentMessageId,
                currentResponse
              );
              lastUpdate = now;
            } catch (error) {
              console.error("Error updating/splitting message:", error);
            }
          }
        }
      }

      // Final update
      await this.updateOrSplitMessage(
        chatId,
        currentMessageId,
        currentResponse
      );
    } catch (error) {
      console.error("Error processing message:", error);
      await this.bot.sendMessage(
        chatId,
        "Sorry, I encountered an error processing your message. Please try again."
      );
    }
  }
}