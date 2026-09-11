# NitroPing iOS SDK

Add this package with Swift Package Manager. `NitroPingClient` uses async/await and submits feedback to the NitroPing API with a public project key. It persists offline submissions, including attachment bytes, retries them with the same idempotency key, exposes `requestFollowUp(feedbackId:email:)` plus `fetchFollowUp(token:)` for status and public replies, and uploads `NitroPingAttachment` values through the private upload lifecycle.
