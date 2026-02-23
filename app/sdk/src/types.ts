export interface NitroPingConfig {
  appId: string
  vapidPublicKey: string
  apiUrl?: string
  userId?: string
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
