# NitroPing Privacy Notice

Last updated: 2026-09-11

This notice describes how the NitroPing hosted service processes data. NitroPing is an open-core project; a self-hosted deployment is controlled by the operator of that deployment.

## Data we process

- Workspace data: organization, project, team-member, role, billing, audit, webhook, and configuration records.
- Feedback data: title, description, feedback type, status, priority, optional email, platform context, approved metadata, comments, votes, and attachments.
- Security and operations data: request ID, limited IP/fingerprint signals, rate-limit state, delivery attempts, and diagnostic metrics. Feedback body text is not written to analytics events.

Anonymous feedback is supported. An end user is not required to create a NitroPing account. An optional email address enables a scoped follow-up link; it does not grant dashboard access.

## Purposes and legal basis

Workspace data is processed to provide the service under the customer agreement. Optional end-user contact data is processed to deliver feedback updates when requested. Security and abuse-prevention data is processed for legitimate security and service-operation interests. Customers remain responsible for defining the lawful basis and notices presented to their own end users.

## Storage and security

Hosted NitroPing uses Cloudflare Workers, D1, R2, KV, Queues, Durable Objects, Email Service, and Analytics Engine. Tenant queries include organization and project scope. Attachments are private R2 objects and are served only through an authorized dashboard route. Webhook payloads are signed with an HMAC secret.

## Consent and email updates

When an end user requests a follow-up email, NitroPing records the email, purpose, grant time, and tenant scope. Every follow-up email contains a token-scoped unsubscribe link. Unsubscribing removes that address from future feedback notifications and records the withdrawal time.

## Retention and deletion

Each project has a configurable retention period. The scheduled cleanup job anonymizes expired feedback, removes comments, watchers, magic-link tokens, status history, and attachment objects, and records a privacy request. Customers can export project data or anonymize individual feedback from the dashboard. Organization deletion removes tenant records and queues attachment deletion.

Deletion requests may take time to propagate through asynchronous queues and provider backups. The service records the request and completion state in the tenant audit/privacy records.

## Data subject requests

For data held by a NitroPing customer, contact that customer first. For a NitroPing Cloud account request, contact the service operator at the address published with the deployment. Requests are verified before export, correction, or deletion.

## Changes

This notice may be updated when the service or subprocessors change. The effective date is shown above.
