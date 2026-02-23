import type { NotificationPayload } from '#server/utils/validation'

export interface FCMConfig {
  projectId: string
  serviceAccountKey?: string
  serverKey?: string
}

export interface FCMMessage {
  token?: string
  topic?: string
  condition?: string
  notification?: {
    title: string
    body: string
    image?: string
  }
  data?: Record<string, string>
  android?: {
    collapse_key?: string
    priority?: 'normal' | 'high'
    ttl?: string
    restricted_package_name?: string
    data?: Record<string, string>
    notification?: {
      title?: string
      body?: string
      icon?: string
      color?: string
      sound?: string
      tag?: string
      click_action?: string
      body_loc_key?: string
      body_loc_args?: string[]
      title_loc_key?: string
      title_loc_args?: string[]
      channel_id?: string
      ticker?: string
      sticky?: boolean
      event_time?: string
      local_only?: boolean
      notification_priority?: 'PRIORITY_UNSPECIFIED' | 'PRIORITY_MIN' | 'PRIORITY_LOW' | 'PRIORITY_DEFAULT' | 'PRIORITY_HIGH' | 'PRIORITY_MAX'
      default_sound?: boolean
      default_vibrate_timings?: boolean
      default_light_settings?: boolean
      vibrate_timings?: string[]
      visibility?: 'VISIBILITY_UNSPECIFIED' | 'PRIVATE' | 'PUBLIC' | 'SECRET'
      notification_count?: number
      image?: string
    }
    fcm_options?: {
      analytics_label?: string
    }
  }
  apns?: {
    headers?: Record<string, string>
    payload?: {
      aps?: {
        'alert'?: string | {
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
        'badge'?: number
        'sound'?: string | {
          critical?: number
          name?: string
          volume?: number
        }
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
    fcm_options?: {
      analytics_label?: string
      image?: string
    }
  }
  webpush?: {
    headers?: Record<string, string>
    data?: Record<string, string>
    notification?: {
      title?: string
      body?: string
      icon?: string
      image?: string
      badge?: string
      tag?: string
      color?: string
      click_action?: string
      body_loc_key?: string
      body_loc_args?: string[]
      title_loc_key?: string
      title_loc_args?: string[]
    }
    fcm_options?: {
      link?: string
      analytics_label?: string
    }
  }
  fcm_options?: {
    analytics_label?: string
  }
}

export interface FCMResponse {
  name?: string
  error?: {
    code: number
    message: string
    status: string
    details?: any[]
  }
}

export interface FCMBatchResponse {
  responses: FCMResponse[]
}

class FCMProvider {
  private config: FCMConfig
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor(config: FCMConfig) {
    this.config = config
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }

    if (!this.config.serviceAccountKey) {
      throw new Error('Service account key is required for FCM authentication')
    }

    try {
      const serviceAccount = JSON.parse(this.config.serviceAccountKey)

      // Create JWT for Google OAuth2
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }

      // Import jwt for signing
      const jwt = await import('jsonwebtoken')
      const assertion = jwt.default.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' })

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[FCM] Token request failed:', response.status, errorText)
        throw new Error(`Failed to get access token: ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer

      return this.accessToken!
    }
    catch (error) {
      console.error('[FCM] Authentication error:', error)
      throw new Error(`Failed to authenticate with FCM: ${error}`)
    }
  }

  async sendMessage(message: FCMMessage): Promise<{ success: boolean, messageId?: string, error?: string }> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${this.config.projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      const data: FCMResponse = await response.json()

      if (!response.ok || data.error) {
        console.error(`[FCM] Send failed:`, data.error || `HTTP ${response.status}: ${response.statusText}`)
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: true,
        messageId: data.name,
      }
    }
    catch (error) {
      console.error(`[FCM] Send error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendBatchMessages(messages: FCMMessage[]): Promise<{
    success: boolean
    results: Array<{ success: boolean, messageId?: string, error?: string }>
    successCount: number
    failureCount: number
  }> {
    try {
      // FCM v1 API doesn't have native batch send, so we'll send them concurrently
      const promises = messages.map(message => this.sendMessage(message))
      const results = await Promise.all(promises)

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

  convertNotificationPayload(payload: NotificationPayload, deviceToken: string, notificationId?: string, deviceId?: string): FCMMessage {
    const baseData = payload.data
      ? Object.fromEntries(
          Object.entries(payload.data).map(([key, value]) => [key, String(value)]),
        )
      : {}

    // Add tracking data
    const trackingData = {
      ...baseData,
      nitroping_notification_id: notificationId || '',
      nitroping_device_id: deviceId || '',
      nitroping_platform: 'android',
    }

    return {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.image,
      },
      data: trackingData,
      android: {
        priority: 'high',
        notification: {
          icon: payload.icon,
          sound: payload.sound,
          click_action: payload.clickAction,
          channel_id: 'nitroping_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: payload.badge,
            sound: payload.sound || 'default',
            category: payload.clickAction,
          },
        },
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          image: payload.image,
          click_action: payload.clickAction,
        },
      },
    }
  }
}

export { FCMProvider }
