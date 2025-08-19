# @nitroping/sdk

JavaScript/TypeScript SDK for NitroPing push notification service.

## Installation

```bash
npm install @nitroping/sdk
```

## Quick Start

```typescript
import { NitroPingClient } from '@nitroping/sdk'

// Initialize the client
const client = new NitroPingClient({
  appId: 'your-app-id',
  vapidPublicKey: 'your-vapid-public-key',
  apiUrl: 'https://api.yoursite.com', // optional, defaults to localhost:3000
})

// Subscribe to push notifications
try {
  const device = await client.subscribe({
    userId: 'user-123', // optional
    tags: ['news', 'updates'], // optional
  })
  console.log('Subscribed successfully:', device)
} catch (error) {
  console.error('Subscription failed:', error)
}

// Check subscription status
const status = await client.getSubscriptionStatus()
console.log('Is subscribed:', status.isSubscribed)

// Unsubscribe
await client.unsubscribe()
```

## API Reference

### NitroPingClient

#### Constructor

```typescript
new NitroPingClient(config: NitroPingConfig)
```

**Parameters:**
- `config.appId` (string, required): Your NitroPing app ID
- `config.vapidPublicKey` (string, required): Your VAPID public key
- `config.apiUrl` (string, optional): API base URL (defaults to localhost:3000)
- `config.userId` (string, optional): Default user ID for subscriptions

#### Methods

##### `isSupported(): boolean`
Checks if push notifications are supported in the current environment.

##### `getPermissionStatus(): NotificationPermission`
Gets the current notification permission status.

##### `requestPermission(): Promise<NotificationPermission>`
Requests notification permission from the user.

##### `subscribe(options?: SubscriptionOptions): Promise<DeviceRegistration>`
Subscribes to push notifications.

**Options:**
- `userId` (string, optional): User ID for this subscription
- `tags` (string[], optional): Tags to associate with this subscription
- `metadata` (Record<string, any>, optional): Additional metadata

##### `unsubscribe(): Promise<boolean>`
Unsubscribes from push notifications.

##### `isSubscribed(): Promise<boolean>`
Checks if the user is currently subscribed.

##### `getSubscriptionStatus(): Promise<SubscriptionStatus>`
Gets detailed subscription status and information.

## Requirements

- Secure context (HTTPS)
- Service Worker support
- Push API support
- Notification API support

## Service Worker

You need to provide a service worker at `/sw.js` in your public directory. Here's a minimal example:

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  
  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: data.data || {},
    tag: data.tag || 'default',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
```

## Error Handling

The SDK throws `NitroPingError` instances for various error conditions:

```typescript
import { NitroPingError } from '@nitroping/sdk'

try {
  await client.subscribe()
} catch (error) {
  if (error instanceof NitroPingError) {
    console.error('NitroPing error:', error.message, error.code)
  } else {
    console.error('Unknown error:', error)
  }
}
```

## License

MIT