# NitroPing Web SDK

The Web SDK supports the floating, modal, side-panel, inline, portal, and headless modes from one package. It sends feedback to the NitroPing public API and uploads optional attachments through the private R2 upload lifecycle.

```ts
import { NitroPing } from "@nitroping/web";

NitroPing.configure({
  colors: { primary: "#7c3aed" },
  fields: ["type", "title", "description", "attachment", "email"],
});

const client = NitroPing.init({
  projectKey: "pk_live_xxx",
  mode: "floating",
  locale: "en",
});
```

To consume the project configuration saved in the NitroPing dashboard, use the asynchronous initializer. It loads only the safe public theme and category data; no dashboard credentials are returned.

```ts
const client = await NitroPing.initAsync({
  projectKey: "pk_live_xxx",
  mode: "floating", // explicit options override the saved project mode
});
```

The lower-level loader is available when an application needs to render its own UI:

```ts
import { loadNitroPingConfig } from "@nitroping/web";

const config = await loadNitroPingConfig({ projectKey: "pk_live_xxx" });
```

Headless usage is also available:

```ts
const client = NitroPing.init({ projectKey: "pk_live_xxx", mode: "headless" });
await client.feedback.create({
  type: "bug",
  title: "Checkout is stuck",
  body: "The submit button never completes.",
});
```
