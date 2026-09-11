# Native SDK contract generation

The OpenAPI document at the repository root is the source of truth for public native request and response models.

Run the reproducible validation command with Bun:

```bash
bun run codegen:native:check
```

To materialize generated model sources for local SDK work:

```bash
bun run codegen:native
```

Generated model output is committed and compiled as a dedicated native contract target. The SDKs keep a small, ergonomic façade and do not expose the OpenAPI generator's transport internals, but generated request/response models are available to advanced consumers and are used by the native packages as the wire-contract boundary. A native model change must be accompanied by the corresponding OpenAPI schema change; CI regenerates and validates both Swift and Kotlin on every change.

The generator version is pinned by `openapitools.json`. The generated files are model-only: API transport, authentication, offline queues, attachment handling, and platform UI remain implemented by the native SDKs.
