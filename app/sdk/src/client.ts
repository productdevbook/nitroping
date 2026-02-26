import type {
  DeviceRegistration,
  IdentifyOptions,
  NitroPingConfig,
  PreferenceUpdateOptions,
  PushSubscriptionData,
  SubscriberPreferenceRecord,
  SubscriberProfile,
  SubscriptionOptions,
  SubscriptionStatus,
} from './types.ts'
import { NitroPingError } from './types.ts'
import {
  apiRequest,
  detectBrowser,
  detectOS,
  generateUserId,
  getBrowserVersion,
  getCategoryFromBrowser,
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
    // vapidPublicKey is only required when subscribe() is called, not at construction
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

    // vapidPublicKey is required for push subscriptions
    if (!this.config.vapidPublicKey) {
      throw new NitroPingError('vapidPublicKey is required for push subscriptions', 'INVALID_CONFIG')
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
    const swPath = this.config.swPath ?? '/sw.js'
    const registration = await navigator.serviceWorker.register(swPath)
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
    const browserType = detectBrowser()
    const category = getCategoryFromBrowser(browserType)

    const device = await this.registerDevice({
      appId: this.config.appId,
      token: subscription.endpoint,
      // Only set category for known browsers, otherwise null
      ...(category !== 'WEB' && { category }),
      platform: 'WEB',
      userId,
      // WebPush subscription keys for encryption
      webPushP256dh: subscriptionData.keys.p256dh,
      webPushAuth: subscriptionData.keys.auth,
      metadata: JSON.stringify({
        userAgent: navigator.userAgent,
        browser: browserType,
        browserVersion: getBrowserVersion(),
        os: detectOS(),
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
   * Unsubscribes from push notifications and removes the device from the backend
   */
  async unsubscribe(): Promise<boolean> {
    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      const stored = this.getStoredSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()
      }

      // Delete device from backend if we have a device ID
      if (stored?.device?.id) {
        try {
          await this.deleteDevice(stored.device.id)
        }
        catch {
          // Best-effort — do not fail unsubscribe if backend call fails
        }
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
   * Identifies a subscriber (user) in the NitroPing system.
   * If a subscriber with the given externalId already exists it is updated,
   * otherwise a new subscriber is created.
   *
   * @example
   * await client.identify('user-123', { name: 'John', email: 'user@example.com' })
   */
  async identify(externalId: string, options: IdentifyOptions = {}): Promise<SubscriberProfile> {
    const query = `
      mutation CreateContact($input: CreateContactInput!) {
        createContact(input: $input) {
          id
          appId
          externalId
          name
          email
          phone
          locale
          metadata
          createdAt
          updatedAt
        }
      }
    `

    const response = await apiRequest<{ data: { createContact: SubscriberProfile } }>(
      `${this.config.apiUrl}/api/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          variables: {
            input: {
              appId: this.config.appId,
              externalId,
              ...options,
            },
          },
        }),
      },
    )

    if (!response.data?.createContact) {
      throw new NitroPingError('Failed to identify subscriber', 'IDENTIFY_FAILED')
    }

    return response.data.createContact
  }

  /**
   * Fetches a contact by external ID.
   */
  async getContact(externalId: string): Promise<SubscriberProfile | null> {
    const query = `
      query GetContact($appId: ID!, $externalId: String!) {
        contactByExternalId(appId: $appId, externalId: $externalId) {
          id
          appId
          externalId
          name
          email
          phone
          locale
          metadata
          createdAt
          updatedAt
        }
      }
    `

    const response = await apiRequest<{ data: { contactByExternalId: SubscriberProfile | null } }>(
      `${this.config.apiUrl}/api/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          variables: { appId: this.config.appId, externalId },
        }),
      },
    )

    return response.data?.contactByExternalId ?? null
  }

  /**
   * Fetches preferences for a contact by their internal ID.
   */
  async getPreferences(contactId: string): Promise<SubscriberPreferenceRecord[]> {
    const query = `
      query GetContact($id: ID!) {
        contact(id: $id) {
          preferences {
            id
            subscriberId
            category
            channelType
            enabled
            updatedAt
          }
        }
      }
    `

    const response = await apiRequest<{
      data: { contact: { preferences: SubscriberPreferenceRecord[] } | null }
    }>(
      `${this.config.apiUrl}/api/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({ query, variables: { id: contactId } }),
      },
    )

    return response.data?.contact?.preferences ?? []
  }

  /**
   * Tracks a notification event (delivered, opened, clicked).
   */
  async trackEvent(notificationId: string, event: 'delivered' | 'opened' | 'clicked'): Promise<void> {
    const mutationMap: Record<string, string> = {
      delivered: `mutation { trackNotificationDelivered(notificationId: "${notificationId}") }`,
      opened: `mutation { trackNotificationOpened(notificationId: "${notificationId}") }`,
      clicked: `mutation { trackNotificationClicked(notificationId: "${notificationId}") }`,
    }

    const query = mutationMap[event]
    if (!query) return

    await apiRequest(
      `${this.config.apiUrl}/api/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({ query }),
      },
    )
  }

  /**
   * Updates a subscriber's notification preference for a given category and channel.
   *
   * @example
   * await client.updatePreference({
   *   subscriberId: 'sub-id',
   *   category: 'marketing',
   *   channelType: 'EMAIL',
   *   enabled: false,
   * })
   */
  async updatePreference(input: PreferenceUpdateOptions & { subscriberId: string }): Promise<SubscriberPreferenceRecord> {
    const query = `
      mutation UpdateContactPreference($input: UpdateContactPreferenceInput!) {
        updateContactPreference(input: $input) {
          id
          subscriberId
          category
          channelType
          enabled
          updatedAt
        }
      }
    `

    const response = await apiRequest<{ data: { updateContactPreference: SubscriberPreferenceRecord } }>(
      `${this.config.apiUrl}/api/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          variables: { input },
        }),
      },
    )

    if (!response.data?.updateContactPreference) {
      throw new NitroPingError('Failed to update preference', 'PREFERENCE_UPDATE_FAILED')
    }

    return response.data.updateContactPreference
  }

  /**
   * Registers a device with the NitroPing backend
   */
  private async registerDevice(input: {
    appId: string
    token: string
    category?: string
    platform: string
    userId: string
    webPushP256dh: string
    webPushAuth: string
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
          webPushP256dh
          webPushAuth
          metadata
          status
          lastSeenAt
          createdAt
          updatedAt
        }
      }
    `

    const response = await apiRequest<{ data: { registerDevice: DeviceRegistration } }>(
      `${this.config.apiUrl}/api/graphql`,
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
   * Deletes a device from the backend
   */
  private async deleteDevice(deviceId: string): Promise<void> {
    const query = `
      mutation DeleteDevice($id: ID!) {
        deleteDevice(id: $id)
      }
    `

    await apiRequest(
      `${this.config.apiUrl}/api/graphql`,
      {
        method: 'POST',
        body: JSON.stringify({
          query,
          variables: { id: deviceId },
        }),
      },
    )
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
