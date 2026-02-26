# In-App Notifications

Deliver notifications directly inside your application — no external service required.

## No Configuration Required

In-App channels need no credentials or external setup. Just give it a name and save.

## How It Works

NitroPing stores in-app notifications in its database. Your frontend fetches and displays them using the SDK or REST API.

```
Workflow SEND step
      ↓
NitroPing stores notification
for the subscriber
      ↓
Your frontend polls or
subscribes via SDK
```

## Fetch Notifications in Your App

```typescript
import { NitroPing } from 'nitroping'

const client = new NitroPing({ apiKey: 'YOUR_API_KEY' })

// Get notifications for a subscriber
const { notifications } = await client.notifications.list({
  subscriberId: 'user-123',
  limit: 20,
})

// Mark as read
await client.notifications.markRead({ id: notification.id })
```

## REST API

```bash
GET /api/v1/notifications?subscriberId=user-123
Authorization: Bearer YOUR_API_KEY
```

## Typical Use Cases

- Notification bell / inbox in your dashboard
- Toast alerts triggered by backend events
- Activity feeds
