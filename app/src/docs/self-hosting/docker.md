# Docker Compose

The fastest way to run NitroPing in production. A single `docker compose up` spins up the server, PostgreSQL, and Redis — fully configured and ready to accept notifications.

## Prerequisites

- **Docker** 24+ and **Docker Compose** v2+
- A server with at least **1 GB RAM** (2 GB recommended)
- Ports `3412`, `5432`, and `6379` available (or configurable)

```bash
docker --version       # Docker version 24+
docker compose version # Docker Compose v2+
```

---

## Quick Start

### 1. Create your working directory

```bash
mkdir nitroping && cd nitroping
```

### 2. Download `docker-compose.yaml`

```bash
curl -o docker-compose.yaml \
  https://raw.githubusercontent.com/productdevbook/nitroping/main/app/docker-compose.yaml
```

### 3. Generate secrets

Run these commands and save the output — you'll need them in the next step.

```bash
# JWT Secret — signs all API tokens
openssl rand -hex 64

# Encryption Key — protects push certificates and private keys
openssl rand -hex 32

# Webhook Secret — signs delivery callback payloads
openssl rand -hex 32
```

### 4. Create `.env`

```bash
# ── Database ─────────────────────────────────────────────────────────────
POSTGRES_USER=nitroping
POSTGRES_PASSWORD=replace_with_strong_password
POSTGRES_DB=nitroping

# ── Secrets ──────────────────────────────────────────────────────────────
JWT_SECRET=<output of openssl rand -hex 64>
ENCRYPTION_KEY=<output of openssl rand -hex 32>
WEBHOOK_SECRET=<output of openssl rand -hex 32>

# ── Redis ─────────────────────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379

# ── Email channel (optional) ──────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_app_password

# ── Tuning ───────────────────────────────────────────────────────────────
RATE_LIMIT_DEFAULT=1000
RATE_LIMIT_WINDOW=3600
SCHEDULER_ENABLED=true
```

> **Never commit `.env` to version control.** Add it to `.gitignore`.

### 5. Start NitroPing

```bash
docker compose --profile prod up -d
```

This pulls the latest image and starts all three services.

> **Migrations run automatically.** On first boot (and every restart), NitroPing checks for pending Drizzle migrations and applies them before accepting any traffic. If PostgreSQL isn't ready yet, the server retries up to 10 times before giving up.

### 6. Verify

```bash
# Check service status
docker compose ps

# Tail server logs (watch for "[migrate] Migrations applied successfully")
docker compose logs server -f

# Health check
curl http://localhost:3412/api/health
```

---

## Updating

### Manual update

```bash
# Pull the new image
docker compose pull

# Recreate only the server container — migrations run on the new container startup
docker compose --profile prod up -d --force-recreate server
```

> Downtime is ~2–5 seconds during container recreation. For zero-downtime updates, use [Kubernetes](/docs/self-hosting/kubernetes).

### Automatic updates with Watchtower

[Watchtower](https://containrrr.dev/watchtower) monitors your containers and automatically pulls and restarts them when a new image is published.

Add it to your `docker-compose.yaml`:

```yaml
  watchtower:
    image: containrrr/watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_POLL_INTERVAL: 3600        # check every hour
      WATCHTOWER_CLEANUP: "true"             # remove old images
      WATCHTOWER_INCLUDE_STOPPED: "false"
      # Optional email notifications:
      # WATCHTOWER_NOTIFICATIONS: email
      # WATCHTOWER_NOTIFICATION_EMAIL_FROM: you@example.com
      # WATCHTOWER_NOTIFICATION_EMAIL_TO: you@example.com
      # WATCHTOWER_NOTIFICATION_EMAIL_SERVER: smtp.gmail.com
      # WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PORT: "587"
      # WATCHTOWER_NOTIFICATION_EMAIL_SERVER_USER: you@example.com
      # WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PASSWORD: your_app_password
    command: --interval 3600
```

> **Recommendation:** Use a specific version tag (e.g. `image: ghcr.io/productdevbook/nitroping:1.2.0`) in production and update it deliberately, rather than auto-pulling `:latest`. This gives you control over when breaking changes are applied.

---

## How Migrations Work

Migrations are managed by [Drizzle ORM](https://orm.drizzle.team) and run automatically on every container startup:

```
Container starts
     ↓
plugin/migrate.ts runs
     ↓
Connects to PostgreSQL (retries up to 10× if not ready)
     ↓
Acquires advisory lock (pg_advisory_lock) — safe for concurrent startups
     ↓
Applies any pending .sql migration files from /app/migrations
     ↓
Releases lock → server starts accepting requests
```

The migration files are bundled inside the Docker image at `/app/migrations` — no external tooling needed at runtime.

**What this means for you:**
- First boot: database schema is created automatically
- Update: only new migrations run (already-applied ones are tracked in `__drizzle_migrations`)
- Rollback: there is no automatic rollback — if a migration must be reverted, it requires a manual SQL operation

---

## Data Backup

All data lives in named Docker volumes. Back up PostgreSQL regularly:

```bash
# Backup to a compressed file
docker exec postgres_db pg_dump -U nitroping nitroping \
  | gzip > "nitroping-$(date +%Y%m%d-%H%M%S).sql.gz"

# Restore
gunzip -c nitroping-20240101-120000.sql.gz \
  | docker exec -i postgres_db psql -U nitroping nitroping
```

---

## Troubleshooting

**Migrations fail on first boot**

This was a common race condition: the server started before PostgreSQL was ready. The `docker-compose.yaml` now uses `depends_on: condition: service_healthy` and the migration plugin retries automatically, so this should not happen. If you still see it, check:

```bash
docker compose logs db --tail=30   # is PostgreSQL starting correctly?
docker compose logs server --tail=50
```

**Port conflict**

Change the host port in `docker-compose.yaml`:

```yaml
ports:
  - "8080:3412"
```

**Reset everything** (destructive — deletes all data)

```bash
docker compose down -v
```
