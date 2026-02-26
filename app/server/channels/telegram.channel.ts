import type { Channel, ChannelMessage, ChannelResult } from './types'

export interface TelegramConfig {
  botToken: string
  chatId: string
}

export class TelegramChannel implements Channel {
  readonly type = 'TELEGRAM' as const

  constructor(private readonly config: TelegramConfig) {}

  async send(msg: ChannelMessage): Promise<ChannelResult> {
    try {
      let text = msg.subject
        ? `*${msg.subject}*\n${msg.body}`
        : msg.body

      if (msg.data) {
        text += `\n\`\`\`json\n${JSON.stringify(msg.data, null, 2)}\n\`\`\``
      }

      const payload = {
        chat_id: this.config.chatId,
        text,
        parse_mode: 'Markdown',
      }

      const response = await fetch(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const body = await response.text()
        return { success: false, error: `Telegram API error ${response.status}: ${body}` }
      }

      const result = await response.json() as { ok: boolean, result?: { message_id: number } }
      return {
        success: true,
        messageId: result.result?.message_id?.toString(),
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
