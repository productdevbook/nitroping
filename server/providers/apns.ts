import type { NotificationPayload } from '~~/server/utils/validation'

export interface APNsConfig {
  keyId: string
  teamId: string
  bundleId: string
  privateKey: string // The .p8 private key content
  production?: boolean
}

export interface APNsAlert {
  'title'?: string
  'subtitle'?: string
  'body'?: string
  'launch-image'?: string
  'title-loc-key'?: string
  'title-loc-args'?: string[]
  'action-loc-key'?: string
  'loc-key'?: string
  'loc-args'?: string[]
}

export interface APNsSound {
  critical?: number
  name?: string
  volume?: number
}

export interface APNsPayload {
  aps: {
    'alert'?: string | APNsAlert
    'badge'?: number
    'sound'?: string | APNsSound
    'thread-id'?: string
    'category'?: string
    'content-available'?: number
    'mutable-content'?: number
    'target-content-id'?: string
    'interruption-level'?: 'passive' | 'active' | 'time-sensitive' | 'critical'
    'relevance-score'?: number
  }
  [key: string]: any
}

export interface APNsMessage {
  token: string
  payload: APNsPayload
  options?: {
    priority?: 5 | 10
    expiration?: number
    collapseId?: string
    pushType?: 'alert' | 'background' | 'voip' | 'complication' | 'fileprovider' | 'mdm'
  }
}

export interface APNsResponse {
  success: boolean
  messageId?: string
  error?: string
  statusCode?: number
}

class APNsProvider {
  private config: APNsConfig
  private jwtToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor(config: APNsConfig) {
    this.config = config
  }

  private getAPNsEndpoint(): string {
    return this.config.production
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com'
  }

  private async generateJWT(): Promise<string> {
    if (this.jwtToken && Date.now() < this.tokenExpiresAt) {
      return this.jwtToken
    }

    try {
      const jwt = await import('jsonwebtoken')

      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: this.config.teamId,
        iat: now,
        exp: now + 3600, // 1 hour
      }

      const options = {
        algorithm: 'ES256' as const,
        header: {
          alg: 'ES256',
          kid: this.config.keyId,
        },
      }

      this.jwtToken = jwt.default.sign(payload, this.config.privateKey, options)
      this.tokenExpiresAt = Date.now() + 3500000 // 58 minutes (1 hour - 2 minutes buffer)

      return this.jwtToken
    }
    catch (error) {
      throw new Error(`Failed to generate APNs JWT: ${error}`)
    }
  }

  async sendMessage(message: APNsMessage): Promise<APNsResponse> {
    try {
      // Alternative: Use undici.request with HTTP/2 support
      // const { request } = await import('undici')
      // But for now, use node-apn library for proper HTTP/2 support
      const apn = await import('node-apn')

      const provider = new apn.Provider({
        token: {
          key: this.config.privateKey,
          keyId: this.config.keyId,
          teamId: this.config.teamId,
        },
        production: this.config.production,
      })

      const notification = new apn.Notification()

      // Set notification properties
      if (message.payload.aps.alert) {
        if (typeof message.payload.aps.alert === 'string') {
          notification.alert = message.payload.aps.alert
        }
        else {
          notification.alert = {
            title: message.payload.aps.alert.title || '',
            body: message.payload.aps.alert.body || '',
          }
        }
      }

      if (message.payload.aps.badge !== undefined) {
        notification.badge = message.payload.aps.badge
      }

      if (message.payload.aps.sound) {
        notification.sound = typeof message.payload.aps.sound === 'string'
          ? message.payload.aps.sound
          : 'default'
      }

      notification.topic = this.config.bundleId

      // Add custom data
      Object.keys(message.payload).forEach((key) => {
        if (key !== 'aps') {
          notification.payload[key] = message.payload[key]
        }
      })

      const result = await provider.send(notification, message.token)

      // Close the provider connection
      provider.shutdown()

      if (result.sent && result.sent.length > 0) {
        return {
          success: true,
          messageId: result.sent[0]?.device || undefined,
        }
      }
      else if (result.failed && result.failed.length > 0) {
        const failure = result.failed[0]
        return {
          success: false,
          error: failure.error?.message || `Status: ${failure.status}`,
          statusCode: typeof failure.status === 'string' ? Number.parseInt(failure.status) : failure.status,
        }
      }
      else {
        return {
          success: false,
          error: 'Unknown APNs result',
        }
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendBatchMessages(messages: APNsMessage[]): Promise<{
    success: boolean
    results: APNsResponse[]
    successCount: number
    failureCount: number
  }> {
    try {
      // Send messages concurrently with rate limiting
      const batchSize = 100 // APNs allows up to 1000 concurrent streams
      const results: APNsResponse[] = []

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        const promises = batch.map(message => this.sendMessage(message))
        const batchResults = await Promise.all(promises)
        results.push(...batchResults)
      }

      const successCount = results.filter(r => r.success).length
      const failureCount = results.length - successCount

      return {
        success: true,
        results,
        successCount,
        failureCount,
      }
    }
    catch (error) {
      return {
        success: false,
        results: messages.map(() => ({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })),
        successCount: 0,
        failureCount: messages.length,
      }
    }
  }

  convertNotificationPayload(payload: NotificationPayload, deviceToken: string, notificationId?: string, deviceId?: string): APNsMessage {
    const alert: APNsAlert = {
      title: payload.title,
      body: payload.body,
    }

    const apsPayload: APNsPayload = {
      aps: {
        alert,
        'badge': payload.badge,
        'sound': payload.sound || 'default',
        'category': payload.clickAction,
        'mutable-content': 1, // Enable notification service extension
      },
    }

    // Add custom data with tracking info
    const customData = payload.data || {}

    // Add tracking data
    if (notificationId && deviceId) {
      customData.nitroping_notification_id = notificationId
      customData.nitroping_device_id = deviceId
      customData.nitroping_platform = 'ios'
    }

    Object.entries(customData).forEach(([key, value]) => {
      apsPayload[key] = value
    })

    return {
      token: deviceToken,
      payload: apsPayload,
      options: {
        priority: 10, // High priority
        pushType: 'alert',
      },
    }
  }
}

export { APNsProvider }
