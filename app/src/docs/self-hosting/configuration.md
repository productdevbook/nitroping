# Configuration

NitroPing is configured entirely through environment variables. This page is the complete reference for every variable the server reads at startup.

---

## Generating Secrets

Three secrets are required before first run. Generate them with OpenSSL:

```bash
# JWT Secret — signs and verifies all API tokens
openssl rand -hex 64

# Encryption Key — encrypts push certificates and private keys at rest
openssl rand -hex 32

# Webhook Secret — HMAC-signs delivery callback payloads
openssl rand -hex 32
```

> These values cannot be changed after your first run without re-encrypting all stored data. Generate them once, store them safely (a secrets manager like Vault, AWS Secrets Manager, or 1Password), and never commit them to source control.

---

## Full Reference

### Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string. Format: `postgresql://user:pass@host:5432/db` |
| `POSTGRES_USER` | Docker only | — | PostgreSQL username (used by the `db` container) |
| `POSTGRES_PASSWORD` | Docker only | — | PostgreSQL password |
| `POSTGRES_DB` | Docker only | — | Database name |

**Example:**

```bash
DATABASE_URL=postgresql://nitroping:strongpassword@localhost:5432/nitroping
```

For Docker Compose, the server uses the internal hostname `db`:

```bash
DATABASE_URL=postgresql://nitroping:strongpassword@db:5432/nitroping
```

---

### Authentication

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | Yes | — | Secret key for signing JWT tokens. Use at least 64 hex characters. |

```bash
JWT_SECRET=a3f8c2...  # 128 characters from openssl rand -hex 64
```

---

### Encryption

| Variable | Required | Default | Description |
|---|---|---|---|
| `ENCRYPTION_KEY` | Yes | — | AES encryption key for sensitive data (push certs, private keys). Must be 32 hex bytes (64 chars). |

```bash
ENCRYPTION_KEY=4d9e1a...  # 64 characters from openssl rand -hex 32
```

---

### Webhooks

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEBHOOK_SECRET` | Yes | — | HMAC-SHA256 secret used to sign delivery callback requests. |

```bash
WEBHOOK_SECRET=7b2f40...  # 64 characters from openssl rand -hex 32
```

Delivery callbacks include an `X-NitroPing-Signature` header so your receivers can verify authenticity:

```
X-NitroPing-Signature: sha256=<hmac-hex>
```

---

### Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_HOST` | Yes | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | — | Redis password (leave empty if auth is disabled) |

Redis is used for:
- **BullMQ** job queues (notification delivery workers)
- **Rate limiting** counters
- **Pub/sub** for real-time in-app notifications

---

### Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `NITRO_HOST` | No | `localhost` | Bind address. Set to `0.0.0.0` in Docker/Kubernetes. |
| `NITRO_PORT` | No | `3412` | HTTP port the server listens on. |
| `NITRO_PRESET` | No | — | Nitro output preset. Use `bun` for Bun runtime, leave empty for Node.js. |

---

### Rate Limiting

| Variable | Required | Default | Description |
|---|---|---|---|
| `RATE_LIMIT_DEFAULT` | No | `1000` | Maximum requests per window per IP |
| `RATE_LIMIT_WINDOW` | No | `3600` | Window size in seconds |
| `RATE_LIMIT_DISABLED` | No | `false` | Set to `true` to disable rate limiting (development only) |

---

### Scheduler

| Variable | Required | Default | Description |
|---|---|---|---|
| `SCHEDULER_ENABLED` | No | `true` | Enables the scheduled notification engine. Disable if running multiple replicas and using a dedicated scheduler pod. |

---

### Email (SMTP)

Required only if you use the Email channel.

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMTP_HOST` | No | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port. Use `587` (STARTTLS) or `465` (TLS). |
| `SMTP_USER` | No | — | SMTP username / email address |
| `SMTP_PASS` | No | — | SMTP password or app-specific password |

**Gmail example:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=abcd efgh ijkl mnop   # Google App Password
```

**Resend example:**

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx       # Resend API key
```

**Mailgun example:**

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.example.com
SMTP_PASS=your-mailgun-smtp-password
```

---

## Minimal `.env` Template

Copy this and fill in the values:

```bash
# ── Required ──────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://nitroping:CHANGE_ME@localhost:5432/nitroping
JWT_SECRET=REPLACE_WITH_OPENSSL_RAND_HEX_64
ENCRYPTION_KEY=REPLACE_WITH_OPENSSL_RAND_HEX_32
WEBHOOK_SECRET=REPLACE_WITH_OPENSSL_RAND_HEX_32

# ── Redis ─────────────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ── Docker Compose only ───────────────────────────────────────────────────
POSTGRES_USER=nitroping
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=nitroping

# ── Optional ─────────────────────────────────────────────────────────────
NITRO_HOST=0.0.0.0
SCHEDULER_ENABLED=true
RATE_LIMIT_DEFAULT=1000
RATE_LIMIT_WINDOW=3600

# ── Email channel ─────────────────────────────────────────────────────────
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
```
