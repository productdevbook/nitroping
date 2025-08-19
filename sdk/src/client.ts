import type {
  DeviceRegistration,
  NitroPingConfig,
  PushSubscriptionData,
  SubscriptionOptions,
  SubscriptionStatus,
} from './types.ts'
import { NitroPingError } from './types.ts'
import {
  apiRequest,
  generateUserId,
  getLocalStorage,
  getNotificationPermission,
  isPushSupported,
  isSecureContext,
  removeLocalStorage,
  setLocalStorage,
  urlBase64ToUint8Array,
} from './utils.ts'

export class NitroPingClient {
  private config: NitroPingConfig
  private storageKey: string

  constructor(config: NitroPingConfig) {
    this.config = {
      apiUrl: 'http://localhost:3000',
      ...config,
    }
    this.storageKey = `nitroping_${this.config.appId}`

    // Validate required config
    if (!this.config.appId) {
      throw new NitroPingError('appId is required', 'INVALID_CONFIG')
    }
    if (!this.config.vapidPublicKey) {
      throw new NitroPingError('vapidPublicKey is required', 'INVALID_CONFIG')
    }
  }

  /**
   * Checks if push notifications are supported in the current environment
   */
  isSupported(): boolean {
    return isPushSupported() && isSecureContext()
  }

  /**
   * Gets the current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return getNotificationPermission()
  }

  /**
   * Requests notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new NitroPingError(
        'Push notifications are not supported in this environment',
        'NOT_SUPPORTED',
      )
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Subscribes to push notifications
   */
  async subscribe(options: SubscriptionOptions = {}): Promise<DeviceRegistration> {
    if (!this.isSupported()) {
      throw new NitroPingError(
        'Push notifications are not supported in this environment',
        'NOT_SUPPORTED',
      )
    }

    // Request permission if not already granted
    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new NitroPingError(
        'Notification permission was denied',
        'PERMISSION_DENIED',
      )
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(this.config.vapidPublicKey),
    })

    // Prepare subscription data
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      },
    }

    // Get or generate user ID
    const userId = options.userId || this.config.userId || this.getUserId()

    // Register device with backend
    const device = await this.registerDevice({
      appId: this.config.appId,
      token: subscription.endpoint,
      platform: 'WEB' as const,
      userId,
      metadata: JSON.stringify({
        userAgent: navigator.userAgent,
        subscription: subscriptionData,
        tags: options.tags || [],
        ...options.metadata,
      }),
    })

    // Store subscription locally
    this.storeSubscription({
      subscription: subscriptionData,
      device,
      userId,
    })

    return device
  }

  /**
   * Unsubscribes from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()
      }

      // Remove from local storage
      this.clearSubscription()

      return true
    }
    catch (error) {
      console.error('Failed to unsubscribe:', error)
      return false
    }
  }

  /**
   * Checks if the user is currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported())
        return false

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      return subscription !== null
    }
    catch (error) {
      console.error('Failed to check subscription status:', error)
      return false
    }
  }

  /**
   * Gets the current subscription status and details
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const isSubscribed = await this.isSubscribed()
    const stored = this.getStoredSubscription()

    return {
      isSubscribed,
      subscription: stored?.subscription,
      device: stored?.device,
    }
  }

  /**
   * Registers a device with the NitroPing backend
   */
  private async registerDevice(input: {
    appId: string
    token: string
    platform: 'WEB'
    userId: string
    metadata: string
  }): Promise<DeviceRegistration> {
    const query = `
      mutation RegisterDevice($input: RegisterDeviceInput!) {
        registerDevice(input: $input) {
          id
          appId
          token
          platform
          userId
          metadata
          status
          lastSeenAt
          createdAt
          updatedAt
        }
      }
    `

    const response = await apiRequest<{ data: { registerDevice: DeviceRegistration } }>(
      `${this.config.apiUrl}/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          variables: { input },
        }),
      },
    )

    if (!response.data?.registerDevice) {
      throw new NitroPingError('Failed to register device', 'REGISTRATION_FAILED')
    }

    return response.data.registerDevice
  }

  /**
   * Gets or generates a user ID
   */
  private getUserId(): string {
    let userId = getLocalStorage<string>(`${this.storageKey}_userId`)
    if (!userId) {
      userId = generateUserId()
      setLocalStorage(`${this.storageKey}_userId`, userId)
    }
    return userId
  }

  /**
   * Stores subscription data locally
   */
  private storeSubscription(data: {
    subscription: PushSubscriptionData
    device: DeviceRegistration
    userId: string
  }): void {
    setLocalStorage(this.storageKey, data)
  }

  /**
   * Gets stored subscription data
   */
  private getStoredSubscription(): {
    subscription: PushSubscriptionData
    device: DeviceRegistration
    userId: string
  } | null {
    return getLocalStorage(this.storageKey)
  }

  /**
   * Clears stored subscription data
   */
  private clearSubscription(): void {
    removeLocalStorage(this.storageKey)
  }
}
