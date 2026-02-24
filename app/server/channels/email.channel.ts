import type { Channel, ChannelMessage, ChannelResult } from './types'

export interface SmtpConfig {
  provider: 'smtp'
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName?: string
  secure?: boolean
}

export interface ResendConfig {
  provider: 'resend'
  apiKey: string
  from: string
  fromName?: string
}

export type EmailChannelConfig = SmtpConfig | ResendConfig

export class EmailChannel implements Channel {
  readonly type = 'EMAIL' as const

  constructor(private readonly config: EmailChannelConfig) {}

  async send(msg: ChannelMessage): Promise<ChannelResult> {
    try {
      if (this.config.provider === 'smtp') {
        return await this.sendViaSmtp(msg)
      }
      return await this.sendViaResend(msg)
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async sendViaSmtp(msg: ChannelMessage): Promise<ChannelResult> {
    const cfg = this.config as SmtpConfig
    // Lazy import nodemailer to avoid loading it unless actually used
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure ?? cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    })

    const fromName = cfg.fromName ? `"${cfg.fromName}" <${cfg.from}>` : cfg.from

    const info = await transporter.sendMail({
      from: fromName,
      to: msg.to,
      subject: msg.subject,
      text: msg.body,
      html: msg.htmlBody,
    })

    return { success: true, messageId: info.messageId }
  }

  private async sendViaResend(msg: ChannelMessage): Promise<ChannelResult> {
    const cfg = this.config as ResendConfig
    // Lazy import resend SDK
    const { Resend } = await import('resend')

    const resend = new Resend(cfg.apiKey)
    const fromName = cfg.fromName ? `${cfg.fromName} <${cfg.from}>` : cfg.from

    const { data, error } = await resend.emails.send({
      from: fromName,
      to: [msg.to],
      subject: msg.subject || '',
      text: msg.body,
      html: msg.htmlBody,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  }
}
