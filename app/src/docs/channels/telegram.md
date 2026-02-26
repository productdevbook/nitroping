# Telegram

Send notifications to any Telegram chat, group, or channel using a bot.

## Step 1 — Create a Bot

1. Open Telegram and search for **@BotFather**
2. Send the command `/newbot`
3. Enter a display name (e.g. *My App Notifications*)
4. Enter a username ending in `bot` (e.g. `myapp_notify_bot`)
5. BotFather replies with your **Bot Token**:

```
1234567890:AAF-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Keep this token secret — it gives full control over your bot.

## Step 2 — Get the Chat ID

### Personal chat

1. Start a conversation with your bot (search by username, press **Start**)
2. Open this URL in your browser (replace `<TOKEN>` with your bot token):

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

3. Send any message to the bot, then refresh the URL
4. Find `"chat":{"id": 123456789}` — that number is your **Chat ID**

### Group chat

1. Add your bot to the group as a member
2. Send any message in the group
3. Use the same `getUpdates` URL above
4. Group Chat IDs are **negative** numbers, e.g. `-1001234567890`

### Channel

1. Add your bot as an **Administrator** of the channel
2. Channel Chat IDs start with `-100`, e.g. `-1001234567890`

## Fields Reference

| Field | Example | Description |
|---|---|---|
| Bot Token | `1234567890:AAF-...` | From BotFather |
| Chat ID | `-1001234567890` | Target chat, group, or channel |

## Test Your Bot

Before saving, verify the bot can send messages:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d chat_id=<CHAT_ID> \
  -d text="NitroPing test message"
```

A successful response returns `"ok": true`.
