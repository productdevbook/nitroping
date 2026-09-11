# NitroPing

Your users' voice, your product's compass.

NitroPing is an open-core feedback platform embeddable in web, iOS, and Android applications.

## Getting started

```bash
bun install
bun run check
bun run dev:api
```

Run the deployment configuration preflight without printing secret values:

```bash
bun run preflight
bun run preflight -- --strict
```

The default mode reports optional integrations that are intentionally disabled. Strict mode fails on incomplete configuration and is intended for production deployment gates.

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
set -a; source /home/opensrc/.cf.env; set +a
CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" CLOUDFLARE_API_TOKEN="$ACCOUNT_TOKEN" NITROPING_STAGE=staging bun run infra:plan
CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" CLOUDFLARE_API_TOKEN="$ACCOUNT_TOKEN" NITROPING_STAGE=staging bun run infra:deploy
```

The verified staging Worker endpoint is `https://nitroping-api-staging.srvrun.workers.dev`. After deployment, rerun `NITROPING_STAGE=staging bun run infra:plan`; a healthy stack should report no changes. Staging uses the same migration directory as the repository and is isolated from the production resources.

The Alchemy stack is intentionally isolated in `infra/` and uses the same Cloudflare account credentials as the operational tooling. Review the plan before deploying: an empty Alchemy state will propose new resources rather than adopting resources already managed by Wrangler. Staging is fully managed by Alchemy. Production infrastructure resources are Alchemy-managed, while the production `nitroping-api` Worker remains Wrangler-managed because its live Durable Object uses Wrangler's declarative `exports` flow; Alchemy beta.77 cannot safely switch that existing Worker to its migration flow. Do not run a production Alchemy deploy against the Worker until that provider limitation is resolved.

Stripe billing is provider-isolated and disabled until production secrets are configured:

```bash
bunx wrangler secret put STRIPE_SECRET_KEY --config apps/api/wrangler.jsonc
bunx wrangler secret put STRIPE_PRICE_PRO --config apps/api/wrangler.jsonc
bunx wrangler secret put STRIPE_PRICE_BUSINESS --config apps/api/wrangler.jsonc
bunx wrangler secret put STRIPE_WEBHOOK_SECRET --config apps/api/wrangler.jsonc
```

Turnstile is opt-in for public feedback. Set the public site key as a Worker variable and the secret with Wrangler; when the secret is present, every public feedback submission must pass server-side Siteverify validation:

```bash
bunx wrangler secret put TURNSTILE_SECRET_KEY --config apps/api/wrangler.jsonc
# Add TURNSTILE_SITE_KEY to the deployment variables, then redeploy.
```

Custom domains are a Business feature backed by Cloudflare for SaaS custom hostnames. After validation completes, the Worker resolves the hostname to its tenant-scoped project and serves the public portal at both `/` and `/portal`; API routes remain versioned under `/api/v1`. The API is intentionally disabled with `CUSTOM_DOMAIN_NOT_CONFIGURED` until the Cloudflare for SaaS zone, fallback origin, and token are configured. The token must be stored as a secret and must have the custom-hostname certificate permission required by Cloudflare:

Moderation is rule-based by default. When the Workers AI binding is available, dashboard moderators can request an `AI assist` review for a feedback item. The result is stored as a pending `moderation_events` record and audit event; it can suggest a type, sentiment, risk, summary, and confidence, but it never changes status, deletes content, or bans a user automatically. Workers AI usage is optional and may incur Cloudflare AI charges.

```bash
bunx wrangler secret put CUSTOM_HOSTNAME_API_TOKEN --config apps/api/wrangler.jsonc
# Set these deployment variables before redeploying:
# CUSTOM_HOSTNAME_ZONE_ID=<Cloudflare zone id>
# CUSTOM_HOSTNAME_ZONE_NAME=nitroping.dev
# CUSTOM_HOSTNAME_FALLBACK_ORIGIN=https://origin.nitroping.dev
```

Customers manage one custom hostname per project through `GET`, `POST`, and `DELETE /api/v1/dashboard/projects/:projectId/custom-domain`. Creation returns the Cloudflare SSL validation records that the customer must publish in DNS. The route is tenant-scoped, Business-plan gated, audited, and removed during organization deletion. Cloudflare for SaaS setup and custom-hostname API permissions are external prerequisites; configuring the variables alone does not activate hostname routing.

Self-hosted deployments can use Cloudflare Access or the built-in OIDC adapter. Set `OIDC_ISSUER_URL` and `OIDC_AUDIENCE` when an external identity provider should authenticate dashboard requests; signed bearer tokens are verified against the provider's discovery document and JWKS before tenant membership is checked. See [`deploy/self-host/README.md`](deploy/self-host/README.md).

## Dashboard architecture

The dashboard is a React 19 application built with Vite 8 and Bun. It uses a small local design system instead of a large UI kit so the panel stays fast, brand-consistent, and easy to embed in the Worker asset pipeline.

- `apps/dashboard/src/main.tsx`: feature-oriented dashboard shell and API orchestration
- `apps/dashboard/src/styles.css`: NitroPing visual tokens, responsive layout, panels, tables, status pills, and mobile behavior
- `apps/dashboard/dashboard.html`: Vite entry document
- `apps/api/public/dashboard.html`: generated production entry served by the Worker
- `apps/api/public/assets`: generated JavaScript bundle

The first dashboard surface includes Inbox, Insights, Moderation, Roadmap, Changelog, Audit log, Developer controls, Team, Notifications, Billing, Widget Builder, and Settings. It also supports creating organizations and projects from the workspace switcher, linking feedback to roadmap and changelog items, and unlinking it without leaving the tenant boundary. Each view talks to the versioned API through the authenticated organization-member boundary, with a project-key/server-key fallback for local development. Authentication is kept outside the visual components.

The hosted public portal is available at `/portal?projectId=<project-id>&projectKey=<public-key>`. It provides feedback submission, community browsing, voting, roadmap, and changelog views without requiring the customer to build a separate public page.

Public clients can load the safe project configuration from `/api/v1/projects/:projectId/public/config`. The response contains the published widget theme and categories only; retention settings, allowed origins, API keys, and organization data are never exposed. Theme fields, colors, metadata keys, metadata values, and SDK context lengths are validated server-side. The Web SDK wraps this endpoint with `loadNitroPingConfig` and `NitroPing.initAsync`.

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

## Privacy and security documents

- [`docs/privacy.md`](docs/privacy.md): hosted-service privacy notice
- [`docs/dpa.md`](docs/dpa.md): deployment-aligned DPA template
- [`docs/subprocessors.md`](docs/subprocessors.md): default hosted-service subprocessors
- [`SECURITY.md`](SECURITY.md): vulnerability reporting and security boundaries

Public package artifacts are built into `dist/` for `@nitroping/contracts` and `@nitroping/web`. A `v*` tag (or the manually dispatched `Release SDKs` workflow) publishes the npm packages and, when Maven credentials are configured, the Android artifact to GitHub Packages. Configure `NPM_TOKEN`, `MAVEN_USERNAME`, and `MAVEN_TOKEN` as GitHub Actions secrets before creating a release.

## Notes

Production resources are provisioned on Cloudflare. The dashboard landing assets are served by the Worker, the API is available under `/api/v1`, and the native SDKs use the same OpenAPI contract.
