# NitroPing

Your users' voice, your product's compass.

NitroPing is an open-core feedback platform embeddable in web, iOS, and Android applications.

## Getting started

```bash
bun install
bun run check
bun run dev:api
```

API health check:

```bash
curl http://localhost:8787/health
```

Local D1 migration:

```bash
bunx wrangler d1 migrations apply nitroping --local --config apps/api/wrangler.jsonc
```

Alchemy infrastructure plan/deploy:

```bash
NITROPING_STAGE=production ALCHEMY_STAGE=production bun run infra:plan
NITROPING_STAGE=staging ALCHEMY_STAGE=staging bun run infra:deploy
```

Production Alchemy adoption requires a Cloudflare token with Workers Scripts Edit and Queues Edit permissions. Wrangler deploy remains the operational production path until that token is available.

## Paketler

- `@nitroping/contracts`: ortak domain tipleri
- `@nitroping/web`: web widget ve headless client
- `apps/api`: Effect service boundaries and the Cloudflare Worker API
- `migrations`: D1 schema migrations
- `openapi.yaml`: public API contract

## Not

Production resources are provisioned on Cloudflare. The dashboard landing assets are served by the Worker, the API is available under `/api/v1`, and the native SDKs use the same OpenAPI contract.
