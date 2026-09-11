# Security policy

## Reporting a vulnerability

Please do not disclose an unpatched vulnerability in a public issue. Send a report to the security contact configured by the repository operator, including the affected version/commit, reproduction steps, impact, and any minimal proof of concept. Do not include real customer data or credentials.

If no monitored security address has been configured yet, use a private GitHub security advisory for this repository.

## Security boundaries

NitroPing treats organization and project identifiers as authorization context. Public project keys are not dashboard credentials. Dashboard access is validated with Cloudflare Access JWT verification when configured, then checked against the organization membership and capability. Server keys are required for server-only project operations.

Attachments are MIME- and size-validated, stored privately in R2, and downloaded only through an authorized route. Webhook destinations must use public HTTPS hosts; deliveries include an HMAC signature and retry idempotently.

## Supported versions

The `main` branch is the actively maintained hosted-service source. Operators should deploy tagged releases or reviewed commits, rotate secrets, apply migrations using the expand/backfill/contract process, and keep Cloudflare dependencies current.
