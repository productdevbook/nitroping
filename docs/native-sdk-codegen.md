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

Generated output is intentionally ignored because the SDKs keep a small, ergonomic public API and use generated models as a contract check rather than exposing the OpenAPI generator's transport internals. A native model change must be accompanied by the corresponding OpenAPI schema change; CI runs the generator for both Swift and Kotlin on every change.

The generator version is pinned by `openapitools.json`. The generated files are model-only: API transport, authentication, offline queues, attachment handling, and platform UI remain implemented by the native SDKs.
