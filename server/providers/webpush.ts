import type { NotificationPayload } from '~~/server/utils/validation'
import { Buffer } from 'node:buffer'

export interface WebPushConfig {
  vapidSubject: string // mailto: URL or https: URL
  publicKey: string // VAPID public key
  privateKey: string // VAPID private key
}

export interface WebPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface WebPushPayload {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  silent?: boolean
  renotify?: boolean
  requireInteraction?: boolean
  timestamp?: number
  vibrate?: number[]
  sound?: string
}

export interface WebPushMessage {
  subscription: WebPushSubscription
  payload: WebPushPayload
  options?: {
    ttl?: number
    urgency?: 'very-low' | 'low' | 'normal' | 'high'
  }
}

export interface WebPushResponse {
  success: boolean
  messageId?: string
  error?: string
  statusCode?: number
}

class WebPushProvider {
  private config: WebPushConfig

  constructor(config: WebPushConfig) {
    this.config = config
  }

  private async generateVapidHeaders(audience: string): Promise<Record<string, string>> {
    try {
      const jwt = await import('jsonwebtoken')
      const _crypto = await import('node:crypto')

      const now = Math.floor(Date.now() / 1000)
      const payload = {
        aud: audience,
        exp: now + 12 * 60 * 60, // 12 hours
        sub: this.config.vapidSubject,
      }

      // Convert VAPID private key from base64url to PEM format
      const privateKeyBuffer = Buffer.from(this.config.privateKey, 'base64url')
      const privateKeyPem = this.convertToPem(privateKeyBuffer)

      const token = jwt.sign(payload, privateKeyPem, {
        algorithm: 'ES256',
      })

      return {
        'Authorization': `vapid t=${token}, k=${this.config.publicKey}`,
        'Crypto-Key': `p256ecdsa=${this.config.publicKey}`,
      }
    }
    catch (error) {
      throw new Error(`Failed to generate VAPID headers: ${error}`)
    }
  }

  private convertToPem(buffer: Buffer): string {
    const base64 = buffer.toString('base64')
    const pemHeader = '-----BEGIN PRIVATE KEY-----\n'
    const pemFooter = '\n-----END PRIVATE KEY-----'
    const pemBody = base64.match(/.{1,64}/g)?.join('\n') || base64
    return pemHeader + pemBody + pemFooter
  }

  private async encryptPayload(payload: string, subscription: WebPushSubscription): Promise<{
    ciphertext: Buffer
    salt: Buffer
    localPublicKey: Buffer
  }> {
    const crypto = await import('node:crypto')

    // Generate a new key pair for this message
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    })

    // Extract the subscriber's public key
    const subscriberPublicKey = Buffer.from(subscription.keys.p256dh, 'base64url')
    const authSecret = Buffer.from(subscription.keys.auth, 'base64url')

    // Generate a random salt
    const salt = crypto.randomBytes(16)

    // Perform ECDH
    const sharedSecret = crypto.createECDH('prime256v1')
    sharedSecret.setPrivateKey(privateKey)
    const shared = sharedSecret.computeSecret(subscriberPublicKey)

    // Derive encryption keys using HKDF
    const _context = Buffer.concat([
      Buffer.from('WebPush: info\x00', 'utf8'),
      subscriberPublicKey,
      Buffer.from(publicKey),
    ])

    const prk = crypto.createHmac('sha256', authSecret).update(shared).digest()
    const contentEncryptionKey = await this.hkdfExpand(prk, Buffer.from('Content-Encoding: aes128gcm\x00', 'utf8'), 16)
    const nonce = await this.hkdfExpand(prk, Buffer.from('Content-Encoding: nonce\x00', 'utf8'), 12)

    // Encrypt the payload
    const cipher = crypto.createCipheriv('aes-128-gcm', contentEncryptionKey, nonce)

    const ciphertext = cipher.update(payload, 'utf8')
    cipher.final()

    const authTag = cipher.getAuthTag()
    const finalCiphertext = Buffer.concat([ciphertext, authTag])

    return {
      ciphertext: finalCiphertext,
      salt,
      localPublicKey: Buffer.from(publicKey),
    }
  }

  private async hkdfExpand(prk: Buffer, info: Buffer, length: number): Promise<Buffer> {
    const crypto = await import('node:crypto')
    const hmac = crypto.createHmac('sha256', prk)
    hmac.update(info)
    hmac.update(Buffer.from([1]))
    return hmac.digest().slice(0, length)
  }

  private getAudience(endpoint: string): string {
    const url = new URL(endpoint)
    return `${url.protocol}//${url.host}`
  }

  async sendMessage(message: WebPushMessage): Promise<WebPushResponse> {
    try {
      const audience = this.getAudience(message.subscription.endpoint)
      const vapidHeaders = await this.generateVapidHeaders(audience)

      const payload = JSON.stringify(message.payload)
      const { ciphertext, salt: _salt, localPublicKey: _localPublicKey } = await this.encryptPayload(payload, message.subscription)

      const headers: Record<string, string> = {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': ciphertext.length.toString(),
        ...vapidHeaders,
      }

      if (message.options?.ttl !== undefined) {
        headers.TTL = message.options.ttl.toString()
      }

      if (message.options?.urgency) {
        headers.Urgency = message.options.urgency
      }

      const response = await fetch(message.subscription.endpoint, {
        method: 'POST',
        headers,
        body: new Uint8Array(ciphertext),
      })

      if (response.status === 200 || response.status === 201 || response.status === 204) {
        return {
          success: true,
          messageId: crypto.randomUUID(),
        }
      }
      else {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorText = await response.text()
          if (errorText)
            errorMessage = errorText
        }
        catch {
          // Ignore text parse errors
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

  async sendBatchMessages(messages: WebPushMessage[]): Promise<{
    success: boolean
    results: WebPushResponse[]
    successCount: number
    failureCount: number
  }> {
    try {
      // Send messages concurrently with rate limiting
      const batchSize = 50 // Conservative batch size for web push
      const results: WebPushResponse[] = []

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

  convertNotificationPayload(payload: NotificationPayload, subscription: WebPushSubscription): WebPushMessage {
    const webPushPayload: WebPushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      tag: payload.clickAction,
      data: payload.data,
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false,
    }

    return {
      subscription,
      payload: webPushPayload,
      options: {
        ttl: 24 * 60 * 60, // 24 hours
        urgency: 'normal',
      },
    }
  }

  static async generateVapidKeys(): Promise<{ publicKey: string, privateKey: string }> {
    const crypto = await import('node:crypto')

    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    })

    // Extract the raw uncompressed EC point (65 bytes) from SPKI DER format
    // SPKI format has ASN.1 structure, the raw EC point is at the end
    const publicKeyBuffer = Buffer.from(publicKey)

    // The uncompressed EC point is the last 65 bytes of the SPKI structure
    // It starts with 0x04 (uncompressed) + 32 bytes x coordinate + 32 bytes y coordinate
    const rawPublicKey = publicKeyBuffer.slice(-65)

    // Convert to base64url format (browser expects raw EC point, not SPKI)
    const publicKeyBase64url = rawPublicKey.toString('base64url')
    const privateKeyBase64url = Buffer.from(privateKey).toString('base64url')

    return {
      publicKey: publicKeyBase64url,
      privateKey: privateKeyBase64url,
    }
  }
}

export { WebPushProvider }
