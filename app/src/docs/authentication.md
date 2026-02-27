# Authentication

All API requests require authentication using your application's API key.

## API Key

Include your API key in the `Authorization` header:

```http
Authorization: ApiKey YOUR_API_KEY
```

You can find your API key under **Apps → Settings**.

> **Security:** Never expose your API key in client-side code or public repositories. Rotate it immediately if compromised.

## GraphQL

The GraphQL endpoint accepts the same `Authorization` header:

```bash
curl -X POST https://your-instance.com/api/graphql \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ apps { id name } }"}'
```

## SDK Authentication

When using the JavaScript SDK, pass your API key during initialization:

```ts
import { NitroPingClient } from 'nitroping'

const client = new NitroPingClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://your-instance.com',
})
```
