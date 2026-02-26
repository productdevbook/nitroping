import type { Channel, ChannelMessage, ChannelResult } from './types'

export interface TwilioConfig {
  provider: 'twilio'
  accountSid: string
  authToken: string
  from: string
}

export type SmsChannelConfig = TwilioConfig

export class SmsChannel implements Channel {
  readonly type = 'SMS' as const

  constructor(private readonly config: SmsChannelConfig) {}

  async send(msg: ChannelMessage): Promise<ChannelResult> {
    try {
      return await this.sendViaTwilio(msg)
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async sendViaTwilio(msg: ChannelMessage): Promise<ChannelResult> {
    const cfg = this.config as TwilioConfig
    const body = msg.subject ? `${msg.subject}\n${msg.body}` : msg.body

    const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`
    const credentials = btoa(`${cfg.accountSid}:${cfg.authToken}`)

    const params = new URLSearchParams({
      To: msg.to,
      From: cfg.from,
      Body: body,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json() as any

    if (!response.ok) {
      return { success: false, error: data.message || `Twilio error ${response.status}` }
    }

    return { success: true, messageId: data.sid }
  }
}
