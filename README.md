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

Stripe billing is provider-isolated and disabled until production secrets are configured:

```bash
bunx wrangler secret put STRIPE_SECRET_KEY --config apps/api/wrangler.jsonc
bunx wrangler secret put STRIPE_PRICE_PRO --config apps/api/wrangler.jsonc
bunx wrangler secret put STRIPE_PRICE_BUSINESS --config apps/api/wrangler.jsonc
bunx wrangler secret put STRIPE_WEBHOOK_SECRET --config apps/api/wrangler.jsonc
```

## Dashboard architecture

The dashboard is a React 19 application built with Vite 8 and Bun. It uses a small local design system instead of a large UI kit so the panel stays fast, brand-consistent, and easy to embed in the Worker asset pipeline.

- `apps/dashboard/src/main.tsx`: feature-oriented dashboard shell and API orchestration
- `apps/dashboard/src/styles.css`: NitroPing visual tokens, responsive layout, panels, tables, status pills, and mobile behavior
- `apps/dashboard/dashboard.html`: Vite entry document
- `apps/api/public/dashboard.html`: generated production entry served by the Worker
- `apps/api/public/assets`: generated JavaScript bundle

The first dashboard surface includes Inbox, Insights, Moderation, Roadmap, Changelog, Audit log, Developer controls, Team, and Settings. Each view talks to the versioned API through the authenticated organization-member boundary, with a project-key/server-key fallback for local development. Authentication is kept outside the visual components.

The hosted public portal is available at `/portal?projectId=<project-id>&projectKey=<public-key>`. It provides feedback submission, community browsing, voting, roadmap, and changelog views without requiring the customer to build a separate public page.

Run the dashboard locally:

```bash
bun run dev:dashboard
```

Build the complete Worker asset bundle:

```bash
bun run build
```

## Packages

- `@nitroping/contracts`: shared domain types
- `@nitroping/web`: web widget and headless client
- `apps/api`: Effect service boundaries and the Cloudflare Worker API
- `migrations`: D1 schema migrations
- `openapi.yaml`: public API contract

## Not

Production resources are provisioned on Cloudflare. The dashboard landing assets are served by the Worker, the API is available under `/api/v1`, and the native SDKs use the same OpenAPI contract.
