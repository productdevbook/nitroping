# NitroPing self-host deployment

This template deploys the open-core NitroPing API and dashboard to your own Cloudflare account. It uses the same production boundaries as NitroPing Cloud:

- Workers for the API and dashboard assets
- D1 for tenant and product data
- R2 for attachments
- KV for short-lived cache and tokens
- Queues for webhooks, email, and attachment jobs
- Durable Objects for project event streams
- Workers AI and Vectorize for optional moderation assistance and semantic search
- Analytics Engine for aggregate product metrics

The hosted NitroPing account and DNS zone are never required. Use a separate Cloudflare account or resources with a distinct prefix.

## Requirements

- Bun 1.4 or newer
- A Cloudflare API token with Workers, D1, R2, KV, Queues, Vectorize, Workers AI, Analytics Engine, and Email permissions required by the resources you enable
- An existing clone of this repository

## Provision resources

From the repository root, create the resources with names unique to your account:

```bash
export CLOUDFLARE_ACCOUNT_ID="..."
export CLOUDFLARE_API_TOKEN="..."

bunx wrangler d1 create nitroping-self-host
bunx wrangler r2 bucket create nitroping-self-host-attachments --jurisdiction eu
bunx wrangler kv namespace create NITROPING_CACHE_SELF_HOST
bunx wrangler queues create nitroping-self-host-events
bunx wrangler vectorize create nitroping-self-host-search --dimensions=768 --metric=cosine
bunx wrangler vectorize create-metadata-index nitroping-self-host-search --propertyName=organizationId --type=string
```

Create a copy of `wrangler.example.jsonc`, replace every `REPLACE_WITH_*` value with the resource IDs/names returned above, and save it outside the repository as `wrangler.self-host.jsonc`. Set the Analytics Engine dataset name to a unique value; the Worker binding provisions/activates that dataset on deployment in the account. Do not commit that file if it contains account-specific identifiers or custom domains.

## Initialize and deploy

```bash
bun install
bun run build
bunx wrangler d1 migrations apply nitroping-self-host --remote --config deploy/self-host/wrangler.self-host.jsonc
bunx wrangler secret put TURNSTILE_SECRET_KEY --config deploy/self-host/wrangler.self-host.jsonc
bunx wrangler secret put STRIPE_SECRET_KEY --config deploy/self-host/wrangler.self-host.jsonc
bunx wrangler secret put STRIPE_PRICE_PRO --config deploy/self-host/wrangler.self-host.jsonc
bunx wrangler secret put STRIPE_PRICE_BUSINESS --config deploy/self-host/wrangler.self-host.jsonc
bunx wrangler secret put STRIPE_WEBHOOK_SECRET --config deploy/self-host/wrangler.self-host.jsonc
bunx wrangler deploy --config deploy/self-host/wrangler.self-host.jsonc
```

Stripe and Turnstile are optional. Omit those secrets when the corresponding features are not enabled; billing and CAPTCHA remain disabled rather than failing open.

## Access and DNS

Protect `/dashboard.html` and dashboard API routes with Cloudflare Access, or provide an equivalent verified identity adapter. Access JWT signatures must be verified before organization membership is evaluated. Point your chosen hostname at the Worker route and set `PUBLIC_APP_URL` to the public origin.

For a custom domain, configure Cloudflare for SaaS separately and provide the custom-hostname variables and secret described in the main README. A self-hosted installation should use its own zone and fallback origin.

## Upgrade and backup policy

1. Run `bun run check`, `bun run test`, `bun run build`, and `bun run codegen:native:check` before upgrading.
2. Apply migrations with Wrangler; never edit the D1 migration ledger manually.
3. Use D1 exports/backups and R2 lifecycle/versioning according to your operational policy.
4. Deploy compatible code before contract migrations and remove old columns only after backfill validation.
5. Rotate Worker secrets and API keys without committing them to this repository.

The self-host operator is the data controller/operator for that installation and is responsible for its DPA, retention, subprocessors, backups, access policy, and incident response.
