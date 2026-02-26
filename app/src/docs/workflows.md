# Workflows

Workflows are visual automation pipelines that define how and when notifications are sent. Build them in the **Apps → Workflows** editor — a free-form node canvas.

## Node Types

### Trigger

Every workflow starts with a Trigger node. It is created automatically and cannot be deleted. The trigger fires when you call `triggerWorkflow` via the API.

### Send

Sends a notification through a configured channel.

| Config | Description |
|---|---|
| Channel | Select the delivery channel (Email, SMS, Discord, Telegram, etc.) |
| Template | Select the message template to use |

### Delay

Pauses execution for a specified duration before continuing to the next node.

| Config | Description |
|---|---|
| Duration | Delay in seconds, minutes, hours, or days |

### Filter

Conditionally continues the workflow based on a field value.

| Config | Description |
|---|---|
| Field | Payload key or `contact.email`, `contact.phone`, etc. |
| Operator | `eq`, `neq`, `contains` |
| Value | The value to compare against |

If the condition fails, the workflow completes without executing further nodes.

## Building a Workflow

1. Open **Apps → Workflows** and click **New Workflow**
2. Drag nodes from the left palette onto the canvas
3. Connect nodes by dragging from the **right handle** of one node to the **left handle** of the next
4. Click a node to configure it in the right panel
5. Click **Save** when done
6. Set the workflow **status to Active** to allow triggering

## Triggering a Workflow

```graphql
mutation {
  triggerWorkflow(input: {
    workflowId: "019c9a99-8aad-77b4-b2b2-719f3f8e0610"
    subscriberId: "019c9359-fe1d-73bc-90fd-594d284d24f3"
    payload: {
      name: "John"
      orderId: "ORD-001"
    }
  }) {
    id
    status
    startedAt
  }
}
```

### Rules

- The workflow must be **Active** to trigger
- If any SEND step has no hardcoded recipient, a `subscriberId` is **required**
- The `payload` object is available inside templates as `{{ variable }}`

## Execution Order

Nodes are executed in topological order — determined by the edges you draw in the canvas, not their visual position. Use the **Runs** view to monitor execution history.
