# Push Notifications

Send native push notifications to iOS, Android, and web browsers.

## No Extra Configuration Here

A Push channel has no credentials of its own — it uses the **push providers** you've already configured for this app.

## Configure Providers First

Go to **Push Providers** in your app settings and set up at least one provider:

| Platform | Provider | What you need |
|---|---|---|
| iOS / macOS | APNS | Apple Developer certificate or key |
| Android | FCM | Firebase project + service account key |
| Web browsers | Web Push | VAPID key pair (auto-generated) |

## How It Works

```
Workflow SEND step
      ↓
NitroPing selects provider
based on subscriber's device
      ↓
APNS → iOS devices
FCM  → Android devices
WebPush → browsers
```

## After Setup

Once at least one provider is active, create this Push channel and reference it in your workflows. NitroPing will automatically route to the correct provider based on the subscriber's registered device type.
