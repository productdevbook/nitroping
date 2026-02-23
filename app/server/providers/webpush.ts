import type { NotificationPayload } from '#server/utils/validation'
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
      const jwtModule = await import('jsonwebtoken')
      const crypto = await import('node:crypto')
      const jwt = jwtModule.default || jwtModule

      const now = Math.floor(Date.now() / 1000)
      const payload = {
        aud: audience,
        exp: now + 12 * 60 * 60, // 12 hours
        sub: this.config.vapidSubject,
      }

      // Detect format: base64 starts with "MIG" (PKCS#8 header), base64url uses - and _
      let privateKeyBuffer: Buffer
      if (this.config.privateKey.startsWith('MIG') || this.config.privateKey.includes('+') || this.config.privateKey.includes('/')) {
        // Standard base64 (PKCS#8 DER)
        privateKeyBuffer = Buffer.from(this.config.privateKey, 'base64')
      }
      else if (this.config.privateKey.includes('-') || this.config.privateKey.includes('_')) {
        // base64url
        privateKeyBuffer = Buffer.from(this.config.privateKey, 'base64url')
      }
      else {
        // Try base64 first (more common for PKCS#8)
        privateKeyBuffer = Buffer.from(this.config.privateKey, 'base64')
      }

      // Import the key properly using Node.js crypto
      const privateKey = crypto.createPrivateKey({
        key: privateKeyBuffer,
        format: 'der',
        type: 'pkcs8',
      })

      // Export as PEM for jsonwebtoken
      const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string

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

  private async encryptPayload(payload: string, subscription: WebPushSubscription): Promise<{
    ciphertext: Buffer
    salt: Buffer
    localPublicKey: Buffer
  }> {
    const crypto = await import('node:crypto')

    // Generate a new key pair for this message (as KeyObjects - modern Node.js approach)
    const { publicKey: localPublicKeyObj, privateKey: localPrivateKeyObj } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    })

    // Export local public key as uncompressed EC point (65 bytes)
    const localPublicKeySpki = localPublicKeyObj.export({ type: 'spki', format: 'der' }) as Buffer
    const localPublicKey = Buffer.from(localPublicKeySpki).slice(-65)

    // Import subscriber's public key as KeyObject
    const subscriberPublicKeyRaw = Buffer.from(subscription.keys.p256dh, 'base64url')
    // Reconstruct SPKI format for the subscriber's public key (P-256 SPKI header + raw key)
    const spkiHeader = Buffer.from([
      0x30,
      0x59,
      0x30,
      0x13,
      0x06,
      0x07,
      0x2A,
      0x86,
      0x48,
      0xCE,
      0x3D,
      0x02,
      0x01,
      0x06,
      0x08,
      0x2A,
      0x86,
      0x48,
      0xCE,
      0x3D,
      0x03,
      0x01,
      0x07,
      0x03,
      0x42,
      0x00,
    ])
    const subscriberSpki = Buffer.concat([spkiHeader, subscriberPublicKeyRaw])
    const subscriberPublicKeyObj = crypto.createPublicKey({ key: subscriberSpki, format: 'der', type: 'spki' })

    const authSecret = Buffer.from(subscription.keys.auth, 'base64url')
    const salt = crypto.randomBytes(16)

    // Modern ECDH using diffieHellman() with KeyObjects
    const sharedSecret = crypto.diffieHellman({
      privateKey: localPrivateKeyObj,
      publicKey: subscriberPublicKeyObj,
    })

    // RFC 8291: Derive IKM using HKDF with auth secret
    // info = "WebPush: info\0" || ua_public || as_public
    const keyInfoBuffer = Buffer.concat([
      Buffer.from('WebPush: info\0', 'utf8'),
      subscriberPublicKeyRaw,
      localPublicKey,
    ])

    // Step 1: IKM = HKDF(sharedSecret, authSecret, keyInfoBuffer, 32)
    const ikm = crypto.hkdfSync('sha256', sharedSecret, authSecret, keyInfoBuffer, 32)

    // Step 2: PRK = HKDF-Extract(salt, IKM) - just HMAC, not full HKDF
    const prk = crypto.createHmac('sha256', salt).update(Buffer.from(ikm)).digest()

    // Step 3: Derive CEK and nonce using HKDF-Expand
    const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'utf8')
    const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'utf8')
    const contentEncryptionKey = await this.hkdfExpand(prk, cekInfo, 16)
    const nonce = await this.hkdfExpand(prk, nonceInfo, 12)

    // Add padding delimiter (0x02) and encrypt
    const paddedPayload = Buffer.concat([Buffer.from(payload, 'utf8'), Buffer.from([0x02])])

    const cipher = crypto.createCipheriv('aes-128-gcm', Buffer.from(contentEncryptionKey), Buffer.from(nonce))
    const encrypted = Buffer.concat([cipher.update(paddedPayload), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Build aes128gcm record: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted + authTag
    const recordSize = Buffer.alloc(4)
    recordSize.writeUInt32BE(4096, 0) // Record size

    const body = Buffer.concat([
      salt, // 16 bytes
      recordSize, // 4 bytes
      Buffer.from([65]), // Key ID length (1 byte)
      localPublicKey, // 65 bytes (uncompressed EC point)
      encrypted,
      authTag, // 16 bytes
    ])

    return {
      ciphertext: body,
      salt,
      localPublicKey,
    }
  }

  private async hkdfExpand(prk: Buffer, info: Buffer, length: number): Promise<Buffer> {
    const { createHmac } = await import('node:crypto')
    const hmac = createHmac('sha256', prk)
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
        const responseText = await response.text()
        return {
          success: false,
          error: responseText || `HTTP ${response.status}`,
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

  convertNotificationPayload(
    payload: NotificationPayload,
    subscription: WebPushSubscription,
    notificationId?: string,
    deviceId?: string,
  ): WebPushMessage {
    const webPushPayload: WebPushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      tag: payload.clickAction,
      data: {
        ...payload.data,
        // Add tracking IDs for service worker
        nitroping_notification_id: notificationId,
        nitroping_device_id: deviceId,
        clickAction: payload.clickAction,
      },
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
