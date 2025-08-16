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

      this.jwtToken = jwt.sign(payload, this.config.privateKey, options)
      this.tokenExpiresAt = Date.now() + 3500000 // 58 minutes (1 hour - 2 minutes buffer)

      return this.jwtToken
    }
    catch (error) {
      throw new Error(`Failed to generate APNs JWT: ${error}`)
    }
  }

  async sendMessage(message: APNsMessage): Promise<APNsResponse> {
    try {
      const token = await this.generateJWT()
      const endpoint = this.getAPNsEndpoint()

      const headers: Record<string, string> = {
        'authorization': `bearer ${token}`,
        'apns-topic': this.config.bundleId,
        'content-type': 'application/json',
      }

      if (message.options?.priority) {
        headers['apns-priority'] = message.options.priority.toString()
      }

      if (message.options?.expiration) {
        headers['apns-expiration'] = message.options.expiration.toString()
      }

      if (message.options?.collapseId) {
        headers['apns-collapse-id'] = message.options.collapseId
      }

      if (message.options?.pushType) {
        headers['apns-push-type'] = message.options.pushType
      }

      const response = await fetch(`${endpoint}/3/device/${message.token}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(message.payload),
      })

      if (response.status === 200) {
        return {
          success: true,
          messageId: response.headers.get('apns-id') || undefined,
        }
      }
      else {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.reason || errorMessage
        }
        catch {
          // Ignore JSON parse errors
        }

        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
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

  convertNotificationPayload(payload: NotificationPayload, deviceToken: string): APNsMessage {
    const alert: APNsAlert = {
      title: payload.title,
      body: payload.body,
    }

    const apsPayload: APNsPayload = {
      aps: {
        alert,
        badge: payload.badge,
        sound: payload.sound || 'default',
        category: payload.clickAction,
      },
    }

    // Add custom data
    if (payload.data) {
      Object.entries(payload.data).forEach(([key, value]) => {
        apsPayload[key] = value
      })
    }

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
