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

Headless usage is also available:

```ts
const client = NitroPing.init({ projectKey: "pk_live_xxx", mode: "headless" });
await client.feedback.create({
  type: "bug",
  title: "Checkout is stuck",
  body: "The submit button never completes.",
});
```
