# NitroPing Subprocessors

Last updated: 2026-09-11

This list applies to the default NitroPing Cloud deployment. A self-hosted installation may use different providers.

| Provider | Service | Processing role | Default location / note |
| --- | --- | --- | --- |
| Cloudflare | Workers, D1, R2, KV, Queues, Durable Objects, Email Service, Analytics Engine, Access, WAF | Compute, relational data, attachments, cache, asynchronous delivery, email, metrics, dashboard access, and edge security | EU-jurisdiction D1/R2 resources are configured where supported; consult Cloudflare's current terms and location documentation |
| Stripe | Billing | Subscription checkout and billing events only when the operator configures Stripe secrets and prices | Optional; not used by default until billing secrets are configured |

NitroPing does not send feedback body text to Analytics Engine. Customers should review this list and the provider terms for their deployment and contract.
