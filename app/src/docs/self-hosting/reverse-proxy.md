# Reverse Proxy

Run NitroPing behind a reverse proxy to handle TLS termination, domain routing, and HTTP → HTTPS redirects. NitroPing listens on port `3412` — the proxy sits in front and forwards traffic to it.

---

## Traefik

Traefik is the recommended choice for Docker and Kubernetes deployments. It discovers containers automatically and provisions Let's Encrypt certificates with zero configuration.

### Docker Compose with Traefik

Add Traefik to your `docker-compose.yaml` and annotate the NitroPing service:

```yaml
services:
  traefik:
    image: traefik:v3
    restart: always
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  db:
    image: postgres:18
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      retries: 5

  redis:
    image: redis:8.0.6-alpine
    restart: always
    volumes:
      - redis_data:/data

  server:
    profiles: [prod]
    image: ghcr.io/productdevbook/nitroping:latest
    restart: always
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      NITRO_HOST: 0.0.0.0
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nitroping.rule=Host(`notify.example.com`)"
      - "traefik.http.routers.nitroping.entrypoints=websecure"
      - "traefik.http.routers.nitroping.tls.certresolver=letsencrypt"
      - "traefik.http.services.nitroping.loadbalancer.server.port=3412"
      # Redirect HTTP → HTTPS
      - "traefik.http.routers.nitroping-http.rule=Host(`notify.example.com`)"
      - "traefik.http.routers.nitroping-http.entrypoints=web"
      - "traefik.http.routers.nitroping-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"

volumes:
  db_data:
  redis_data:
  letsencrypt:
```

### Traefik Static Config (File Provider)

For more control, use a static config file instead of CLI flags:

```yaml
# traefik.yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: you@example.com
      storage: /letsencrypt/acme.json
      tlsChallenge: {}

providers:
  docker:
    exposedByDefault: false
  file:
    directory: /etc/traefik/conf.d
    watch: true

api:
  dashboard: true
  insecure: false   # secure the dashboard in production
```

### Traefik on Kubernetes (IngressRoute)

If you prefer Traefik's native CRD over standard Ingress:

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: nitroping
  namespace: nitroping
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`notify.example.com`)
      kind: Rule
      services:
        - name: nitroping
          port: 3412
  tls:
    certResolver: letsencrypt
```

---

## Nginx

A proven choice for dedicated VMs and bare-metal servers.

### Install

```bash
# Ubuntu / Debian
apt install -y nginx certbot python3-certbot-nginx

# Fedora / RHEL
dnf install -y nginx certbot python3-certbot-nginx
```

### Config

Create `/etc/nginx/sites-available/nitroping`:

```nginx
server {
    listen 80;
    server_name notify.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name notify.example.com;

    ssl_certificate     /etc/letsencrypt/live/notify.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notify.example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass         http://127.0.0.1:3412;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/nitroping /etc/nginx/sites-enabled/
certbot --nginx -d notify.example.com
nginx -t && systemctl reload nginx
```

---

## Caddy

The simplest option — automatic HTTPS with zero certificate management.

### Install

```bash
# Ubuntu / Debian
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

### Caddyfile

```caddyfile
notify.example.com {
    reverse_proxy localhost:3412
}
```

That's it. Caddy obtains and renews Let's Encrypt certificates automatically.

```bash
systemctl enable caddy
systemctl start caddy
```

For Docker Compose:

```yaml
caddy:
  image: caddy:2-alpine
  restart: always
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile:ro
    - caddy_data:/data
    - caddy_config:/config
```

```caddyfile
# Caddyfile (Docker network — server is the container name)
notify.example.com {
    reverse_proxy server:3412
}
```

---

## Comparison

| Feature | Traefik | Nginx | Caddy |
|---|---|---|---|
| Auto TLS | Yes (built-in) | Via Certbot | Yes (built-in) |
| Docker auto-discovery | Yes | No | No |
| Kubernetes native | Yes (CRDs) | Via Ingress | Via Ingress |
| Config complexity | Low (labels) | Medium | Very low |
| Performance | High | Very high | High |
| Best for | Docker / K8s | Bare metal / VMs | Simple setups |
