# Email (SMTP)

Send transactional emails via any SMTP server.

## Fields Reference

| Field | Description |
|---|---|
| Host | SMTP server hostname |
| Port | `587` for TLS (recommended), `465` for SSL, `25` for plain |
| Username | Your email login |
| Password | Your email password or app-specific password |
| From Address | The sender address shown to recipients |
| From Name | Display name shown in email clients |

## Gmail

Gmail requires an **App Password** — your regular password won't work.

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to **Security → App passwords**
4. Generate a password for "Mail" + "Other device"
5. Use that 16-character password as your SMTP password

```
Host:     smtp.gmail.com
Port:     587
Username: you@gmail.com
Password: [16-char app password]
```

## Common Providers

| Provider | Host | Port |
|---|---|---|
| Gmail | smtp.gmail.com | 587 |
| Outlook / Microsoft 365 | smtp.office365.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Amazon SES | email-smtp.us-east-1.amazonaws.com | 587 |
| Brevo (Sendinblue) | smtp-relay.brevo.com | 587 |

## SendGrid Setup

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Go to **Settings → API Keys** → create a key with **Mail Send** permission
3. Use `apikey` as the username and your API key as the password:

```
Host:     smtp.sendgrid.net
Port:     587
Username: apikey
Password: SG.xxxxxxxxxxxxxxxxxxxx
```
