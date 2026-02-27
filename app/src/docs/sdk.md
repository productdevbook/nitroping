# SDK & Examples

## JavaScript / TypeScript SDK

Install the official NitroPing SDK:

```bash
npm install nitroping
# or
pnpm add nitroping
```

### Initialize

```ts
import { NitroPingClient } from 'nitroping'

const client = new NitroPingClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://your-instance.com',
})
```

### Register a contact

```ts
await client.identify('user-123', {
  email: 'user@example.com',
  firstName: 'John',
})
```

### Register a device

```ts
await client.registerDevice({
  token: 'fcm-or-apns-token',
  platform: 'android', // 'ios' | 'android' | 'web'
  userId: 'user-123',
})
```

### Trigger a workflow

```ts
// Via GraphQL directly
const result = await fetch('https://your-instance.com/api/graphql', {
  method: 'POST',
  headers: {
    'Authorization': 'ApiKey YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      mutation TriggerWorkflow($input: TriggerWorkflowInput!) {
        triggerWorkflow(input: $input) {
          id
          status
          startedAt
        }
      }
    `,
    variables: {
      input: {
        workflowId: 'YOUR_WORKFLOW_ID',
        subscriberId: 'CONTACT_ID',
        payload: { name: 'John', orderId: 'ORD-001' },
      },
    },
  }),
})
```

## Python

```python
import requests

API_KEY = 'YOUR_API_KEY'
BASE_URL = 'https://your-instance.com/api/v1'

headers = {
    'Authorization': f'ApiKey {API_KEY}',
    'Content-Type': 'application/json',
}

# Register device
requests.post(f'{BASE_URL}/devices/register', json={
    'token': 'device_token',
    'platform': 'android',
    'userId': 'user-123',
}, headers=headers)

# Send notification
requests.post(f'{BASE_URL}/notifications/send', json={
    'title': 'Hello',
    'body': 'World!',
}, headers=headers)
```

## cURL

```bash
# Register a device
curl -X POST https://your-instance.com/api/v1/devices/register \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token":"device_token","platform":"android","userId":"user-123"}'

# Trigger a workflow
curl -X POST https://your-instance.com/api/graphql \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { triggerWorkflow(input: { workflowId: \"ID\", subscriberId: \"SID\" }) { id status } }"}'
```
