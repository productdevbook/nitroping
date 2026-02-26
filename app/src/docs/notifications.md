# Notifications

Notifications are messages sent directly to devices via push notification providers (FCM, APNs, Web Push). This is separate from channel-based messaging.

## Sending a Notification

### REST API

```bash
curl -X POST https://your-instance.com/api/v1/notifications/send \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New order",
    "body": "Your order #123 has been placed.",
    "data": {
      "orderId": "123",
      "action": "open_order"
    }
  }'
```

### JavaScript SDK

```ts
await client.sendNotification({
  title: 'New order',
  body: 'Your order #123 has been placed.',
  data: { orderId: '123' },
})
```

## Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✓ | Notification title |
| `body` | string | ✓ | Notification body text |
| `data` | object | | Custom key-value payload |
| `badge` | number | | Badge count (iOS) |
| `sound` | string | | Sound name (default: `"default"`) |
| `clickAction` | string | | URL to open on click |
| `icon` | string | | Icon URL |
| `targetDevices` | string[] | | Specific device IDs to target |
| `platforms` | string[] | | Filter by `"android"`, `"ios"`, `"web"` |
| `scheduledAt` | ISO 8601 | | Schedule for later delivery |

## Registering a Device

Devices must be registered before they can receive push notifications.

```bash
curl -X POST https://your-instance.com/api/v1/devices/register \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "device_push_token",
    "platform": "android",
    "userId": "user-123"
  }'
```

## Error Codes

| Code | Meaning |
|---|---|
| `400` | Invalid request body or missing required fields |
| `401` | Invalid or missing API key |
| `403` | API key lacks permission |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
