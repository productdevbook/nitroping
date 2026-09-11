# NitroPing Android SDK

The Android library module is based on Kotlin coroutines. It includes ready-to-embed Views and Jetpack Compose feedback forms, while the core network contract matches the web and iOS SDKs. It persists offline submissions, including attachment bytes, retries them with the same idempotency key, provides `requestFollowUp` and `fetchFollowUp` for status and public replies, and supports `NitroPingAttachment` uploads.

The module publishes as `dev.nitroping:nitroping:0.1.0`; registry credentials are intentionally kept out of the repository.

`fetchPublicConfig()` loads the safe widget theme and project categories for custom native forms. `NitroPingFollowUp` provides a scoped Jetpack Compose status screen for a magic-link token, including scoped feedback deletion. The client exposes the same operation through `deleteFollowUp(token)`.

When Turnstile is enabled, the host application must obtain a short-lived token using the published `turnstileSiteKey` and pass it as `turnstileToken` in `Feedback`.

Use `NitroPingScreenshot.attachment(view)` to capture a rendered Android View and pass the result to `client.submit(feedback, attachments)`.

Create the client with an Android `Context` to enable persistent, project-scoped offline storage:

```kotlin
val nitroPingClient = NitroPingClient(context, projectKey = "pk_live_xxx")
```

Compose usage:

```kotlin
NitroPingFeedback(client = nitroPingClient)
```

The Compose form includes the system document picker and submits selected files through the same idempotent upload lifecycle. Views integrations can use `NitroPingScreenshot.attachment(view)` or call `client.submit(feedback, attachments)` directly.
