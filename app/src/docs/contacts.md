# Contacts

Contacts (also called subscribers) represent the people who receive notifications. Each contact belongs to an application.

## Creating a Contact

### Dashboard

Go to **Apps → Contacts → New Contact** and fill in the details.

### SDK

```ts
const contact = await client.identify('user-123', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
})
```

### REST API

```bash
curl -X POST https://your-instance.com/api/v1/contacts \
  -H "Authorization: ApiKey YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "user-123",
    "email": "user@example.com",
    "firstName": "John"
  }'
```

## Contact Fields

| Field | Type | Description |
|---|---|---|
| `externalId` | string | Your system's user ID |
| `email` | string | Email address (required for Email channel) |
| `phone` | string | Phone number (required for SMS channel) |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `metadata` | object | Any additional custom data |

## Using Contacts in Workflows

Pass the contact's NitroPing ID as `subscriberId` when triggering a workflow:

```graphql
mutation {
  triggerWorkflow(input: {
    workflowId: "019c9a99-..."
    subscriberId: "019c9359-..."
    payload: { orderId: "ORD-001" }
  }) {
    id
    status
  }
}
```

The workflow worker automatically resolves the contact's `email` or `phone` from the database for the corresponding SEND step.
