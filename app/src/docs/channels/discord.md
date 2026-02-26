# Discord

Send notifications to a Discord channel using an Incoming Webhook.

## Step 1 — Open Server Settings

1. Open Discord and go to the server where you want notifications
2. Click the **server name** at the top-left → **Server Settings**
3. In the left panel, click **Integrations**
4. Click **Webhooks** → **New Webhook**

## Step 2 — Configure the Webhook

1. Give the webhook a name (e.g. *NitroPing*)
2. Select the **channel** where messages will be posted
3. Optionally upload an avatar image
4. Click **Copy Webhook URL** — it looks like:

```
https://discord.com/api/webhooks/1234567890/xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. Click **Save**

## Fields Reference

| Field | Example |
|---|---|
| Webhook URL | `https://discord.com/api/webhooks/...` |

## Test Your Webhook

```bash
curl -X POST "https://discord.com/api/webhooks/<ID>/<TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"content": "NitroPing test message"}'
```

A `204 No Content` response means success.

## Permissions

Make sure the webhook's target channel allows **Send Messages**. If the channel is restricted, the webhook delivery will fail silently.
