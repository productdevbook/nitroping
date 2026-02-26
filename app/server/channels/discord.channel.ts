import type { Channel, ChannelMessage, ChannelResult } from './types'

export interface DiscordConfig {
  webhookUrl: string
}

export class DiscordChannel implements Channel {
  readonly type = 'DISCORD' as const

  constructor(private readonly config: DiscordConfig) {}

  async send(msg: ChannelMessage): Promise<ChannelResult> {
    try {
      const content = msg.subject
        ? `**${msg.subject}**\n${msg.body}`
        : msg.body

      const payload: Record<string, any> = { content }

      if (msg.data) {
        payload.embeds = [
          {
            description: JSON.stringify(msg.data),
            color: 0x5865F2,
          },
        ]
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, error: `Discord webhook error ${response.status}: ${text}` }
      }

      return { success: true }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
