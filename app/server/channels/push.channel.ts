import type { Channel, ChannelMessage, ChannelResult } from './types'
import { getProviderForApp } from '../providers'

/**
 * Thin wrapper around the existing push provider system.
 * Bridges the old per-platform provider API into the unified Channel interface.
 */
export class PushChannel implements Channel {
  readonly type = 'PUSH' as const

  constructor(
    private readonly appId: string,
    private readonly platform: 'ios' | 'android' | 'web',
    private readonly token: string,
    private readonly webPushKeys?: { p256dh: string, auth: string },
  ) {}

  async send(msg: ChannelMessage): Promise<ChannelResult> {
    try {
      const provider = await getProviderForApp(this.appId, this.platform)

      const payload = {
        title: msg.subject || '',
        body: msg.body,
        data: msg.data,
      }

      let message
      if (this.platform === 'web') {
        if (!this.webPushKeys) {
          return { success: false, error: 'WebPush subscription keys missing' }
        }
        message = (provider as any).convertNotificationPayload(payload, {
          endpoint: this.token,
          keys: this.webPushKeys,
        })
      }
      else {
        message = (provider as any).convertNotificationPayload(payload, this.token)
      }

      const result = await (provider as any).sendMessage(message)
      return { success: result.success, messageId: result.messageId, error: result.error }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
