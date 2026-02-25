export interface NitroPingConfig {
  appId: string
  vapidPublicKey?: string  // required for push subscriptions, optional for email/sms-only usage
  apiUrl?: string
  userId?: string
  swPath?: string          // custom service worker path, default: '/sw.js'
}

// ── Subscriber / multi-channel types ─────────────────────────────────────────

export interface SubscriberProfile {
  id: string
  appId: string
  externalId: string
  name?: string
  email?: string
  phone?: string
  locale?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface IdentifyOptions {
  name?: string
  email?: string
  phone?: string
  locale?: string
  metadata?: Record<string, any>
}

export interface PreferenceUpdateOptions {
  category: string
  channelType: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP' | 'DISCORD'
  enabled: boolean
}

export interface SubscriberPreferenceRecord {
  id: string
  subscriberId: string
  category: string
  channelType: string
  enabled: boolean
  updatedAt: string
}

export interface SubscriptionOptions {
  userId?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface DeviceRegistration {
  id: string
  appId: string
  token: string
  platform: 'WEB'
  userId?: string
  webPushP256dh?: string
  webPushAuth?: string
  metadata?: string
  status: 'ACTIVE' | 'INACTIVE'
  lastSeenAt: string
  createdAt: string
  updatedAt: string
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  silent?: boolean
  renotify?: boolean
  requireInteraction?: boolean
  timestamp?: number
  vibrate?: number[]
  sound?: string
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface APIResponse<T = any> {
  data?: T
  error?: string
  statusCode?: number
}

export interface SubscriptionStatus {
  isSubscribed: boolean
  subscription?: PushSubscriptionData
  device?: DeviceRegistration
}

export class NitroPingError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = 'NitroPingError'
  }
}
