# NitroPing Android SDK

The Android library module is based on Kotlin coroutines. It includes ready-to-embed Views and Jetpack Compose feedback forms, while the core network contract matches the web and iOS SDKs. It persists offline submissions, provides `requestFollowUp` and `fetchFollowUp` for status and public replies, and supports `NitroPingAttachment` uploads.

The module publishes as `dev.nitroping:nitroping:0.1.0`; registry credentials are intentionally kept out of the repository.

Use `NitroPingScreenshot.attachment(view)` to capture a rendered Android View and pass the result to `client.submit(feedback, attachments)`.

Compose usage:

```kotlin
NitroPingFeedback(client = nitroPingClient)
```
