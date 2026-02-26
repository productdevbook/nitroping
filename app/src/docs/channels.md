# Channels

Channels are delivery providers that NitroPing uses to send notifications. Each channel is scoped to an application.

Navigate to **Apps → Channels → Add Channel** to configure a new channel.

## Email (SMTP)

Send emails via any SMTP server (Gmail, SendGrid, Mailgun, custom, etc.).

| Field | Description |
|---|---|
| Host | SMTP server hostname (e.g. `smtp.gmail.com`) |
| Port | Usually `587` (TLS) or `465` (SSL) |
| Username | Your SMTP login email |
| Password | Your SMTP password or app password |
| From Address | The `From:` address for outgoing emails |
| From Name | Display name shown in the inbox |

## SMS (Twilio)

Send SMS messages via Twilio.

| Field | Description |
|---|---|
| Account SID | From your Twilio Console |
| Auth Token | From your Twilio Console |
| From Number | A Twilio phone number (e.g. `+1234567890`) |

## Discord

Send messages to a Discord channel via a webhook URL.

| Field | Description |
|---|---|
| Webhook URL | Created in Discord → Server Settings → Integrations → Webhooks |

## Telegram

Send messages via a Telegram Bot.

| Field | Description |
|---|---|
| Bot Token | From [@BotFather](https://t.me/botfather) — format: `123456:ABC-DEF...` |
| Chat ID | Target chat or channel ID (e.g. `-1001234567890`) |

To get a Chat ID: add your bot to the group/channel, then call `https://api.telegram.org/botTOKEN/getUpdates` and find the `chat.id` field.

## Push Notifications

For push notifications (FCM, APNs, Web Push), configure a **Push Provider** under **Apps → Push Providers** instead of a channel.

## Using Channels in Workflows

Once a channel is configured, it becomes available when adding a **Send** node to your workflow. Select the channel and template in the node's configuration panel.
