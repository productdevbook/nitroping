import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "nitroping",
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const database = yield* Cloudflare.D1.Database("Database", {
      name: "nitroping",
      jurisdiction: "eu",
      primaryLocationHint: "weur",
      migrations: { dir: "../migrations" },
    });
    const attachments = yield* Cloudflare.R2.Bucket("Attachments", {
      name: "nitroping-attachments",
      jurisdiction: "eu",
    });
    const cache = yield* Cloudflare.KV.Namespace("Cache", { title: "nitroping-cache" });
    const events = yield* Cloudflare.Queues.Queue("Events", { name: "nitroping-events" });

    const api = yield* Cloudflare.Worker("Api", {
      name: "nitroping-api",
      main: "../apps/api/src/index.ts",
      env: {
        DB: database,
        ATTACHMENTS: attachments,
        CACHE: cache,
        EVENTS: events,
        ENVIRONMENT: "production",
      },
    });

    return { api, database, attachments, cache, events };
  }),
);
