import type { Channel, ChannelMessage, ChannelResult } from './types'

// 1×1 transparent GIF — returned by the open-tracking pixel endpoint
const TRACKING_PIXEL_TAG = (base: string, id: string) =>
  `<img src="${base}/track/open/${id}" width="1" height="1" alt="" style="display:none;border:0" />`

/** Replace every http(s) href with a click-tracking redirect URL. */
function wrapLinks(html: string, base: string, id: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_, url: string) => {
    const encoded = Buffer.from(url).toString('base64url')
    return `href="${base}/track/click/${id}?url=${encoded}"`
  })
}

/** Inject tracking pixel and wrap links into an HTML email body. */
function injectTracking(html: string, base: string, id: string): string {
  const withLinks = wrapLinks(html, base, id)
  const pixel = TRACKING_PIXEL_TAG(base, id)
  return withLinks.includes('</body>')
    ? withLinks.replace('</body>', `${pixel}</body>`)
    : withLinks + pixel
}

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
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure ?? cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    })

    const fromName = cfg.fromName ? `"${cfg.fromName}" <${cfg.from}>` : cfg.from
    const html = msg.trackingId && msg.trackingBaseUrl && msg.htmlBody
      ? injectTracking(msg.htmlBody, msg.trackingBaseUrl, msg.trackingId)
      : msg.htmlBody

    const info = await transporter.sendMail({
      from: fromName,
      to: msg.to,
      subject: msg.subject,
      text: msg.body,
      html,
    })

    return { success: true, messageId: info.messageId }
  }

  private async sendViaResend(msg: ChannelMessage): Promise<ChannelResult> {
    const cfg = this.config as ResendConfig
    const { Resend } = await import('resend')

    const resend = new Resend(cfg.apiKey)
    const fromName = cfg.fromName ? `${cfg.fromName} <${cfg.from}>` : cfg.from
    const html = msg.trackingId && msg.trackingBaseUrl && msg.htmlBody
      ? injectTracking(msg.htmlBody, msg.trackingBaseUrl, msg.trackingId)
      : msg.htmlBody

    const { data, error } = await resend.emails.send({
      from: fromName,
      to: [msg.to],
      subject: msg.subject || '',
      text: msg.body,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  }
}
