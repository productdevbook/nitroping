# SMS (Twilio)

Send SMS notifications worldwide using Twilio.

## Step 1 — Create a Twilio Account

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Verify your email and phone number

## Step 2 — Get Your Credentials

From the **Twilio Console** dashboard ([console.twilio.com](https://console.twilio.com)):

1. Copy your **Account SID** — starts with `AC`
2. Click the eye icon to reveal your **Auth Token**

```
Account SID:  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3 — Get a Phone Number

1. In Twilio Console → **Phone Numbers → Manage → Buy a number**
2. Search for a number in your country
3. Purchase it (free on trial)
4. Use this number as **From Number** in the format `+1234567890`

## Fields Reference

| Field | Example | Where to find |
|---|---|---|
| Account SID | `ACxxx...` | Console dashboard |
| Auth Token | `xxx...` | Console dashboard (click eye icon) |
| From Number | `+12025551234` | Console → Phone Numbers |

## Trial Account Limits

> On a free Twilio trial, you can **only send SMS to verified phone numbers**.
> Go to **Verified Caller IDs** to add test numbers.

Upgrade your account to send to any number without restrictions.

## Test Your Credentials

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/<SID>/Messages.json" \
  -u "<SID>:<AUTH_TOKEN>" \
  --data-urlencode "To=+1234567890" \
  --data-urlencode "From=+0987654321" \
  --data-urlencode "Body=NitroPing test"
```
