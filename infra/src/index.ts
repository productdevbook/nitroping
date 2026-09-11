import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import type { ProjectEventStream } from "../../apps/api/src/events";

const stage = process.env.NITROPING_STAGE ?? "production";
const suffix = stage === "production" ? "" : `-${stage}`;

export default Alchemy.Stack(
  `nitroping-${stage}`,
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function* () {
    const database = yield* Cloudflare.D1.Database("Database", {
      name: `nitroping${suffix}`,
      jurisdiction: "eu",
      primaryLocationHint: "weur",
      // Production D1 is already managed by Wrangler's migration ledger. Alchemy
      // adopts that database without replaying the full history; fresh staging
      // and development stacks still receive the complete migration directory.
      ...(stage === "production" ? {} : { migrations: { dir: "../migrations" } }),
    });
    const attachments = yield* Cloudflare.R2.Bucket("Attachments", {
      name: `nitroping-attachments${suffix}`,
      jurisdiction: "eu",
    });
    const cache = yield* Cloudflare.KV.Namespace("Cache", { title: `nitroping-cache${suffix}` });
    const events = yield* Cloudflare.Queues.Queue("Events", { name: `nitroping-events${suffix}` });
    const analytics = yield* Cloudflare.AnalyticsEngine.Dataset("Analytics", { dataset: `nitroping_metrics${suffix}` });
    const email = yield* Cloudflare.Email.SendEmail("Email", { allowedSenderAddresses: ["notifications@nitroping.dev"] });
    const eventStream = Cloudflare.DurableObject<ProjectEventStream>("EventStream", { className: "ProjectEventStream" });

    const api = yield* Cloudflare.Worker("Api", {
      name: `nitroping-api${suffix}`,
      main: "../apps/api/src/index.ts",
      assets: {
        directory: "../apps/api/public",
        runWorkerFirst: true,
        htmlHandling: "none",
      },
      compatibility: { date: "2026-09-11", flags: ["nodejs_compat"] },
      observability: { enabled: true, headSamplingRate: 0.1, logs: { enabled: true, invocationLogs: true }, traces: { enabled: true, headSamplingRate: 0.1 } },
      crons: ["0 3 * * *"],
      routes: stage === "production" ? [
        { pattern: "nitroping.dev/*", zoneId: "9e147a2369f9b648e53feee23b5d091e" },
        { pattern: "api.nitroping.dev/*", zoneId: "9e147a2369f9b648e53feee23b5d091e" },
      ] : [],
      env: {
        DB: database,
        ATTACHMENTS: attachments,
        CACHE: cache,
        EVENTS: events,
        ANALYTICS: analytics,
        EMAIL: email,
        EVENT_STREAM: eventStream,
        AI: Cloudflare.Workers.AI(),
        ENVIRONMENT: stage,
        ACCESS_TEAM_DOMAIN: process.env.ACCESS_TEAM_DOMAIN ?? "",
        ACCESS_AUDIENCE: process.env.ACCESS_AUDIENCE ?? "",
        EMAIL_FROM: "notifications@nitroping.dev",
        PUBLIC_APP_URL: stage === "production" ? "https://nitroping.dev" : `https://nitroping-${stage}.dev`,
        TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY ?? "",
        CUSTOM_HOSTNAME_ZONE_ID: process.env.CUSTOM_HOSTNAME_ZONE_ID ?? "",
        CUSTOM_HOSTNAME_ZONE_NAME: process.env.CUSTOM_HOSTNAME_ZONE_NAME ?? "nitroping.dev",
        CUSTOM_HOSTNAME_FALLBACK_ORIGIN: process.env.CUSTOM_HOSTNAME_FALLBACK_ORIGIN ?? "",
      },
    });
    const consumer = yield* Cloudflare.Queues.Consumer("EventsConsumer", {
      queueId: events.queueId,
      scriptName: api.workerName,
      settings: { batchSize: 10, maxRetries: 5, maxWaitTimeMs: 5000 },
    });

    return { api, database, attachments, cache, events, analytics, email, eventStream, consumer };
  }),
);
