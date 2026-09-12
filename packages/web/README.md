# NitroPing Web SDK

The Web SDK supports the floating, modal, side-panel, inline, portal, and headless modes from one package. It sends feedback to the NitroPing public API and uploads optional attachments through the private R2 upload lifecycle.

The widget asks two things: which of the `type` tiles the message is about, then the message itself in a single box. The first line of that box becomes the feedback title. The accent defaults to ink (`#1c1c1e`, a light ink in dark mode) so the widget borrows no brand colour until `colors.primary` sets one.

Light and dark are the same surfaces with one set of tokens swapped. `theme` decides which: the default `"system"` follows `prefers-color-scheme`, while `"light"` or `"dark"` pins the widget to the scheme a host with its own switch is already showing. `colors` overrides either scheme — pass `background`, `text` and `muted` together with `primary` when a brand palette should replace the stock one.

```ts
import { NitroPing } from "@nitroping/web";

NitroPing.configure({
  colors: { primary: "#1c1c1e" },
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
