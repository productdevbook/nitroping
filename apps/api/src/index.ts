import { Effect } from "effect";
import { feedbackPriorities, feedbackStatuses, feedbackTypes, jsonResponse, platforms, type CreateFeedbackInput, type Feedback, type FeedbackStatus } from "@nitroping/contracts";
import { changeFeedbackStatus, createFeedback, getFeedback, listFeedback, type FeedbackRepository, type TenantContext } from "./services";
import { clientIp, hmacSha256, randomToken, sha256 } from "./security";
import { type AccessClaims, verifyAccessJwt } from "./access";
import { ProjectEventStream } from "./events";
import { StripeBillingProvider, type BillingPlan } from "./billing";

export { ProjectEventStream };

const id = () => crypto.randomUUID();
const webhookEventTypes = ["feedback.created", "feedback.updated", "feedback.replied"] as const;
type WebhookEventType = (typeof webhookEventTypes)[number];
const planFeedbackLimits: Record<string, number> = { free: 100, pro: 5_000, business: 50_000 };
const planProjectLimits: Record<string, number> = { free: 1, pro: 20, business: 1_000 };
const planAttachmentLimits: Record<string, number> = { free: 25 * 1024 * 1024, pro: 5 * 1024 * 1024 * 1024, business: 50 * 1024 * 1024 * 1024 };
const requestId = (request: Request) => request.headers.get("x-request-id") ?? `req_${id()}`;
const error = (code: string, message: string, requestId: string, status: number, details?: unknown) =>
  jsonResponse({ error: { code, message, requestId, details } }, { status, headers: { "x-request-id": requestId } });

const validateInput = (body: unknown): CreateFeedbackInput | string => {
  if (!body || typeof body !== "object") return "Body must be valid JSON";
  const input = body as Record<string, unknown>;
  if (!feedbackTypes.includes(input.type as never)) return "Invalid feedback type";
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.length > 160) return "Title must be 3-160 characters";
  if (typeof input.body !== "string" || input.body.trim().length < 3 || input.body.length > 20_000) return "Body must be 3-20000 characters";
  if (input.email !== undefined && (typeof input.email !== "string" || input.email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))) return "Invalid email";
  if (input.priority !== undefined && !feedbackPriorities.includes(input.priority as never)) return "Invalid priority";
  if (input.categoryId !== undefined && (typeof input.categoryId !== "string" || input.categoryId.length < 1 || input.categoryId.length > 128)) return "Invalid categoryId";
  if (input.platform !== undefined && !platforms.includes(input.platform as never)) return "Invalid platform";
  if (input.metadata !== undefined && (!input.metadata || typeof input.metadata !== "object" || Array.isArray(input.metadata))) return "Invalid metadata";
  if (input.metadata && Object.keys(input.metadata as object).length > 30) return "A maximum of 30 metadata fields is allowed";
  if (input.metadata && Object.values(input.metadata as Record<string, unknown>).some((value) => !["string", "number", "boolean"].includes(typeof value))) return "Metadata may only contain primitive values";
  return {
    type: input.type as CreateFeedbackInput["type"], title: input.title.trim(), body: input.body.trim(), categoryId: input.categoryId as string | undefined,
    priority: (input.priority as CreateFeedbackInput["priority"]) ?? "normal", email: input.email as string | undefined,
    platform: input.platform as CreateFeedbackInput["platform"], appVersion: input.appVersion as string | undefined,
    osVersion: input.osVersion as string | undefined, locale: input.locale as string | undefined,
    metadata: (input.metadata as CreateFeedbackInput["metadata"]) ?? {},
  };
};

const repository = (env: Env): FeedbackRepository => ({
  async create(context, input, rid) {
    const feedbackId = id();
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO feedback_items (id, organization_id, project_id, category_id, type, status, priority, title, body, email, platform, app_version, os_version, locale, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(feedbackId, context.organizationId, context.projectId, input.categoryId ?? null, input.type, input.priority ?? "normal", input.title, input.body, input.email ?? null, input.platform ?? null, input.appVersion ?? null, input.osVersion ?? null, input.locale ?? null, JSON.stringify(input.metadata ?? {}), now, now).run();
    await env.DB.prepare(`INSERT INTO audit_logs (id, organization_id, project_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, 'feedback.created', 'feedback', ?, ?, ?)`)
      .bind(id(), context.organizationId, context.projectId, feedbackId, JSON.stringify({ requestId: rid }), now).run();
    return { id: feedbackId, organizationId: context.organizationId, projectId: context.projectId, ...input, status: "new", priority: input.priority ?? "normal", metadata: input.metadata ?? {}, createdAt: now, updatedAt: now } as Feedback;
  },
  async get(context, feedbackId) {
    const row = await env.DB.prepare(`SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL`).bind(feedbackId, context.organizationId, context.projectId).first<Record<string, unknown>>();
    return row ? fromRow(row) : null;
  },
  async list(context, cursor, limit = 25) {
    const statement = cursor
      ? env.DB.prepare(`SELECT * FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL AND created_at < ? ORDER BY created_at DESC LIMIT ?`).bind(context.organizationId, context.projectId, cursor, limit + 1)
      : env.DB.prepare(`SELECT * FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?`).bind(context.organizationId, context.projectId, limit + 1);
    const result = await statement.all<Record<string, unknown>>();
    const rows = result.results ?? [];
    const hasNext = rows.length > limit;
    const items = rows.slice(0, limit).map(fromRow);
    return { items, ...(hasNext && items.length ? { nextCursor: items[items.length - 1].createdAt } : {}) };
  },
  async updateStatus(context, feedbackId, status) {
    const previous = await env.DB.prepare("SELECT status FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(feedbackId, context.organizationId, context.projectId).first<{ status: string }>();
    if (!previous) return null;
    const now = new Date().toISOString();
    const result = await env.DB.prepare(`UPDATE feedback_items SET status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL`).bind(status, now, feedbackId, context.organizationId, context.projectId).run();
    if (!result.meta.changes) return null;
    if (previous.status !== status) await env.DB.prepare("INSERT INTO feedback_status_history (id, organization_id, project_id, feedback_id, from_status, to_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id(), context.organizationId, context.projectId, feedbackId, previous.status, status, now).run();
    return this.get(context, feedbackId);
  },
});

const fromRow = (row: Record<string, unknown>): Feedback => ({
  id: String(row.id), organizationId: String(row.organization_id), projectId: String(row.project_id), ...(row.category_id ? { categoryId: String(row.category_id) } : {}), ...(row.assigned_user_id ? { assignedUserId: String(row.assigned_user_id) } : {}), ...(row.merged_into_id ? { mergedIntoId: String(row.merged_into_id) } : {}), type: row.type as Feedback["type"], status: row.status as Feedback["status"], priority: row.priority as Feedback["priority"], title: String(row.title), body: String(row.body),
  ...(row.email ? { email: String(row.email) } : {}), ...(row.platform ? { platform: row.platform as Feedback["platform"] } : {}),
  ...(row.app_version ? { appVersion: String(row.app_version) } : {}), ...(row.os_version ? { osVersion: String(row.os_version) } : {}), ...(row.locale ? { locale: String(row.locale) } : {}),
  metadata: JSON.parse(String(row.metadata_json ?? "{}")), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});

const publicFeedback = (feedback: Feedback) => {
  const { organizationId: _organizationId, email: _email, metadata: _metadata, assignedUserId: _assignedUserId, mergedIntoId: _mergedIntoId, ...safe } = feedback;
  return { ...safe, metadata: {} };
};

const contextFrom = (url: URL): TenantContext => ({ organizationId: url.searchParams.get("organizationId") ?? "demo-org", projectId: url.searchParams.get("projectId") ?? url.pathname.split("/")[3] ?? "demo-project", publicKey: url.searchParams.get("projectKey") ?? undefined });

const projectFromRequest = async (request: Request, env: Env, url: URL, rid: string): Promise<TenantContext | Response> => {
  const projectKey = request.headers.get("x-nitroping-project-key") ?? url.searchParams.get("projectKey");
  if (!projectKey && String(env.ENVIRONMENT) !== "production") return contextFrom(url);
  if (!projectKey) return error("PROJECT_KEY_REQUIRED", "Project key is required", rid, 401);
  const project = await env.DB.prepare("SELECT p.organization_id, p.id, p.public_key FROM projects p WHERE p.public_key = ? AND p.deleted_at IS NULL AND (NOT EXISTS (SELECT 1 FROM project_api_keys k0 WHERE k0.project_id = p.id AND k0.organization_id = p.organization_id AND k0.kind = 'public') OR EXISTS (SELECT 1 FROM project_api_keys k WHERE k.project_id = p.id AND k.organization_id = p.organization_id AND k.kind = 'public' AND k.key_hash = ? AND k.revoked_at IS NULL))").bind(projectKey, await sha256(projectKey)).first<{ organization_id: string; id: string; public_key: string }>();
  return project ? { organizationId: project.organization_id, projectId: project.id, publicKey: project.public_key } : error("INVALID_PROJECT_KEY", "Invalid project key", rid, 401);
};

const requireServerKey = async (request: Request, env: Env, context: TenantContext, rid: string): Promise<Response | null> => {
  const key = request.headers.get("x-nitroping-server-key");
  if (!key) return error("SERVER_KEY_REQUIRED", "Server key is required", rid, 401);
  const hash = await sha256(key);
  const found = await env.DB.prepare("SELECT id FROM project_api_keys WHERE project_id = ? AND organization_id = ? AND kind = 'server' AND key_hash = ? AND revoked_at IS NULL").bind(context.projectId, context.organizationId, hash).first();
  return found ? null : error("INVALID_SERVER_KEY", "Invalid server key", rid, 403);
};

const jsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body = await request.json();
  return body && typeof body === "object" ? body as Record<string, unknown> : {};
};

const projectMatchesPath = (context: TenantContext, projectId: string, rid: string): Response | null =>
  context.projectId === projectId || context.publicKey === projectId ? null : error("PROJECT_SCOPE_MISMATCH", "The project key does not belong to this project", rid, 403);

const allowedMetadata = async (env: Env, context: TenantContext, input: CreateFeedbackInput, rid: string): Promise<Response | null> => {
  const settings = await env.DB.prepare("SELECT allowed_metadata_json FROM project_settings WHERE project_id = ? AND EXISTS (SELECT 1 FROM projects WHERE projects.id = project_settings.project_id AND projects.organization_id = ?)").bind(context.projectId, context.organizationId).first<{ allowed_metadata_json: string }>();
  const allowed = new Set<string>(JSON.parse(settings?.allowed_metadata_json ?? "[]"));
  const metadata = input.metadata ?? {};
  const invalid = Object.keys(metadata).filter((key) => !allowed.has(key));
  return invalid.length ? error("METADATA_FIELD_NOT_ALLOWED", `Metadata fields are not allowed: ${invalid.join(", ")}`, rid, 400) : null;
};

const rateLimit = async (env: Env, request: Request, scope: string): Promise<boolean> => {
  const key = `rate:${scope}:${clientIp(request)}`;
  const current = Number(await env.CACHE.get(key) ?? "0");
  if (current >= 60) return false;
  await env.CACHE.put(key, String(current + 1), { expirationTtl: 60 });
  return true;
};

const requestHeaders = (rid: string, origin?: string): Record<string, string> => ({
  "access-control-allow-origin": origin ?? "*",
  "access-control-allow-headers": "content-type, x-request-id, x-nitroping-project-key, x-nitroping-server-key, authorization, idempotency-key",
  "access-control-allow-methods": "GET,POST,PATCH,PUT,OPTIONS",
  "access-control-expose-headers": "etag, x-request-id",
  "cache-control": "no-store",
  "x-request-id": rid,
});

const requireProjectServer = async (request: Request, env: Env, url: URL, projectId: string, rid: string): Promise<TenantContext | Response> => {
  const context = await projectFromRequest(request, env, url, rid);
  if (context instanceof Response) return context;
  const scopeError = projectMatchesPath(context, projectId, rid);
  if (scopeError) return scopeError;
  const authError = await requireServerKey(request, env, context, rid);
  return authError ?? context;
};

type DashboardCapability =
  | "feedback:read"
  | "feedback:write"
  | "feedback:reply"
  | "feedback:moderate"
  | "project:manage"
  | "developer:manage"
  | "billing:manage"
  | "members:manage"
  | "roadmap:manage"
  | "audit:read"
  | "privacy:manage";

const roleCapabilities: Record<string, readonly DashboardCapability[]> = {
  owner: ["feedback:read", "feedback:write", "feedback:reply", "feedback:moderate", "project:manage", "developer:manage", "billing:manage", "members:manage", "roadmap:manage", "audit:read", "privacy:manage"],
  admin: ["feedback:read", "feedback:write", "feedback:reply", "feedback:moderate", "project:manage", "developer:manage", "members:manage", "roadmap:manage", "audit:read", "privacy:manage"],
  member: ["feedback:read", "feedback:write", "feedback:reply", "roadmap:manage", "audit:read"],
  moderator: ["feedback:read", "feedback:reply", "feedback:moderate", "audit:read"],
  viewer: ["feedback:read", "audit:read"],
  billing_admin: ["feedback:read", "billing:manage", "audit:read"],
};

const roleHasCapability = (role: string, capability: DashboardCapability): boolean => roleCapabilities[role]?.includes(capability) ?? false;

const requireDashboardProject = async (request: Request, env: Env, url: URL, projectId: string, rid: string, capability: DashboardCapability = "feedback:read"): Promise<TenantContext | Response> => {
  if (!String(env.ACCESS_TEAM_DOMAIN ?? "") || !String(env.ACCESS_AUDIENCE ?? "")) return requireProjectServer(request, env, url, projectId, rid);
  const identity = await requireIdentity(request, env, rid);
  if (identity instanceof Response) return identity;
  const userId = await userForIdentity(env, identity);
  const project = await env.DB.prepare(`SELECT p.id, p.organization_id AS organizationId, m.role
    FROM projects p
    JOIN organization_members m ON m.organization_id = p.organization_id
    WHERE p.id = ? AND m.user_id = ? AND p.deleted_at IS NULL`)
    .bind(projectId, userId).first<{ id: string; organizationId: string; role: string }>();
  if (!project) return error("PROJECT_NOT_FOUND", "The project was not found for this account", rid, 404);
  return roleHasCapability(project.role, capability)
    ? { organizationId: project.organizationId, projectId: project.id }
    : error("FORBIDDEN", `The ${project.role} role cannot perform ${capability}`, rid, 403);
};

const requireDashboardAccess = async (request: Request, env: Env, rid: string): Promise<Response | null> => {
  if (!String(env.ACCESS_TEAM_DOMAIN ?? "") || !String(env.ACCESS_AUDIENCE ?? "")) return null;
  return await verifyAccessJwt(request, env) ? null : error("DASHBOARD_AUTH_REQUIRED", "Cloudflare Access authentication is required", rid, 401);
};

const requireIdentity = async (request: Request, env: Env, rid: string): Promise<AccessClaims | Response> => {
  if (!String(env.ACCESS_TEAM_DOMAIN ?? "") || !String(env.ACCESS_AUDIENCE ?? "")) return error("DASHBOARD_ACCESS_NOT_CONFIGURED", "Cloudflare Access must be configured for organization management", rid, 503);
  const claims = await verifyAccessJwt(request, env);
  return claims?.email ? claims : error("DASHBOARD_AUTH_REQUIRED", "Cloudflare Access authentication is required", rid, 401);
};

const userForIdentity = async (env: Env, identity: AccessClaims): Promise<string> => {
  const userId = await sha256(`access:${identity.sub ?? identity.email}`);
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT OR IGNORE INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)").bind(userId, identity.email, now, now).run();
  return userId;
};

const requireOrganizationMember = async (env: Env, organizationId: string, userId: string, roles: string[] = ["owner", "admin"]): Promise<boolean> => {
  const placeholders = roles.map(() => "?").join(",");
  const member = await env.DB.prepare(`SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ? AND role IN (${placeholders})`).bind(organizationId, userId, ...roles).first();
  return Boolean(member);
};

const etagged = async (data: unknown, request: Request, headers: Record<string, string>, status = 200): Promise<Response> => {
  const etag = `W/\"${await sha256(JSON.stringify(data))}\"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...headers, etag } });
  return jsonResponse(data, { status, headers: { ...headers, etag } });
};

const enqueueWebhookDeliveries = async (env: Env, projectId: string, feedbackId: string, eventType: WebhookEventType, sourceEventId: string): Promise<void> => {
  const webhooks = await env.DB.prepare("SELECT id, events_json AS events FROM webhooks WHERE project_id = ? AND active = 1").bind(projectId).all<{ id: string; events: string }>();
  for (const webhook of webhooks.results ?? []) {
    const events = JSON.parse(webhook.events || "[]") as string[];
    if (!events.includes(eventType)) continue;
    const deliveryId = id();
    const inserted = await env.DB.prepare("INSERT OR IGNORE INTO webhook_deliveries (id, webhook_id, event_id, status, attempts, created_at) VALUES (?, ?, ?, 'pending', 0, ?)")
      .bind(deliveryId, webhook.id, sourceEventId, new Date().toISOString()).run();
    if (inserted.meta.changes) await env.EVENTS.send({ type: "webhook.deliver", deliveryId, webhookId: webhook.id, eventId: deliveryId, sourceEventId, eventType, feedbackId, projectId });
  }
};

const deliverWebhook = async (env: Env, event: { deliveryId: string; webhookId: string; sourceEventId: string; eventType: WebhookEventType; feedbackId: string; projectId: string }): Promise<boolean> => {
  const webhook = await env.DB.prepare("SELECT url FROM webhooks WHERE id = ? AND project_id = ? AND active = 1").bind(event.webhookId, event.projectId).first<{ url: string }>();
  if (!webhook) return true;
  const secret = await env.CACHE.get(`webhook:secret:${event.webhookId}`);
  if (!secret) {
    await env.DB.prepare("UPDATE webhook_deliveries SET status = 'failed', attempts = attempts + 1 WHERE id = ?").bind(event.deliveryId).run();
    return true;
  }
  const feedback = await env.DB.prepare("SELECT id, project_id AS projectId, type, status, priority, title, body, email, platform, app_version AS appVersion, os_version AS osVersion, locale, metadata_json AS metadata, created_at AS createdAt, updated_at AS updatedAt FROM feedback_items WHERE id = ? AND project_id = ? AND deleted_at IS NULL").bind(event.feedbackId, event.projectId).first<Record<string, unknown>>();
  const payload = JSON.stringify({ id: event.sourceEventId, type: event.eventType, projectId: event.projectId, feedback: feedback ? { ...feedback, metadata: JSON.parse(String(feedback.metadata ?? "{}")) } : null, createdAt: new Date().toISOString() });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacSha256(secret, `${timestamp}.${payload}`);
  await env.DB.prepare("UPDATE webhook_deliveries SET attempts = attempts + 1, status = 'pending' WHERE id = ?").bind(event.deliveryId).run();
  try {
    const response = await fetch(webhook.url, { method: "POST", headers: { "content-type": "application/json", "user-agent": "NitroPing-Webhooks/1", "x-nitroping-event": event.eventType, "x-nitroping-signature": `t=${timestamp},v1=${signature}` }, body: payload, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Webhook responded with ${response.status}`);
    await env.DB.prepare("UPDATE webhook_deliveries SET status = 'delivered', next_attempt_at = NULL WHERE id = ?").bind(event.deliveryId).run();
    return true;
  } catch {
    const retryAt = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare("UPDATE webhook_deliveries SET status = 'failed', next_attempt_at = ? WHERE id = ?").bind(retryAt, event.deliveryId).run();
    return false;
  }
};

const currentUsage = async (env: Env, organizationId: string): Promise<{ plan: string; period: string; feedbackCount: number; attachmentBytes: number; feedbackLimit: number; attachmentLimit: number }> => {
  const period = new Date().toISOString().slice(0, 7);
  const subscription = await env.DB.prepare("SELECT plan FROM subscriptions WHERE organization_id = ?").bind(organizationId).first<{ plan: string }>();
  const usage = await env.DB.prepare("SELECT feedback_count AS feedbackCount, attachment_bytes AS attachmentBytes FROM usage_counters WHERE organization_id = ? AND period = ?").bind(organizationId, period).first<{ feedbackCount: number; attachmentBytes: number }>();
  const plan = subscription?.plan ?? "free";
  return { plan, period, feedbackCount: Number(usage?.feedbackCount ?? 0), attachmentBytes: Number(usage?.attachmentBytes ?? 0), feedbackLimit: planFeedbackLimits[plan] ?? planFeedbackLimits.free, attachmentLimit: planAttachmentLimits[plan] ?? planAttachmentLimits.free };
};

const sendTransactionalEmail = async (env: Env, event: { email: string; subject: string; text: string; html: string }): Promise<void> => {
  await env.EMAIL.send({ to: event.email, from: { email: env.EMAIL_FROM, name: "NitroPing" }, subject: event.subject, text: event.text, html: event.html });
};

const enqueueWatcherEmails = async (env: Env, feedbackId: string, subject: string, text: string, html: string): Promise<void> => {
  const feedback = await env.DB.prepare("SELECT organization_id AS organizationId, project_id AS projectId FROM feedback_items WHERE id = ?").bind(feedbackId).first<{ organizationId: string; projectId: string }>();
  if (!feedback) return;
  const watchers = await env.DB.prepare("SELECT email FROM feedback_watchers WHERE feedback_id = ?").bind(feedbackId).all<{ email: string }>();
  for (const watcher of watchers.results ?? []) await env.EVENTS.send({ type: "email.send", organizationId: feedback.organizationId, projectId: feedback.projectId, email: watcher.email, subject, text, html, eventId: id() });
};

const recordMetric = (env: Env, event: string, organizationId: string, projectId: string, doubles: number[] = []): void => {
  try { env.ANALYTICS.writeDataPoint({ blobs: [event, organizationId, projectId], doubles, indexes: [event] }); } catch { /* Analytics must never break product traffic. */ }
};

const writeAudit = async (env: Env, context: TenantContext, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}): Promise<void> => {
  await env.DB.prepare("INSERT INTO audit_logs (id, organization_id, project_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id(), context.organizationId, context.projectId, action, entityType, entityId, JSON.stringify(metadata), new Date().toISOString()).run();
};

const writeOrganizationAudit = async (env: Env, organizationId: string, action: string, entityType: string, entityId: string, actorUserId: string | null, metadata: Record<string, unknown> = {}): Promise<void> => {
  await env.DB.prepare("INSERT INTO audit_logs (id, organization_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id(), organizationId, actorUserId, action, entityType, entityId, JSON.stringify(metadata), new Date().toISOString()).run();
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const rid = requestId(request);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    const cors = requestHeaders(rid, request.headers.get("origin") ?? "*");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (path === "/health") return jsonResponse({ ok: true, environment: env.ENVIRONMENT, requestId: rid }, { headers: cors });
    try {
      const origin = request.headers.get("origin");
      const projectKey = request.headers.get("x-nitroping-project-key") ?? url.searchParams.get("projectKey");
      if (origin && projectKey) {
        const project = await env.DB.prepare("SELECT id, organization_id FROM projects WHERE public_key = ? AND deleted_at IS NULL").bind(projectKey).first<{ id: string; organization_id: string }>();
        if (project) {
          const settings = await env.DB.prepare("SELECT origins_json FROM project_settings WHERE project_id = ? AND project_id IN (SELECT id FROM projects WHERE organization_id = ?)").bind(project.id, project.organization_id).first<{ origins_json: string }>();
          const origins = JSON.parse(settings?.origins_json ?? "[]") as string[];
          if (origins.length > 0 && !origins.includes(origin)) return error("ORIGIN_NOT_ALLOWED", "This origin is not allowed for the project", rid, 403);
        }
      }
      const repo = repository(env);
      const organizationsPath = path === "/api/v1/dashboard/organizations";
      if (organizationsPath && (request.method === "GET" || request.method === "POST")) {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response || !identity.email) return identity instanceof Response ? identity : error("DASHBOARD_AUTH_REQUIRED", "An authenticated email is required", rid, 401);
        const userId = await userForIdentity(env, identity);
        const organizationCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM organization_members m JOIN organizations o ON o.id = m.organization_id WHERE m.user_id = ? AND o.deleted_at IS NULL").bind(userId).first<{ count: number }>();
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT o.id, o.name, o.slug, m.role, o.created_at AS createdAt FROM organizations o JOIN organization_members m ON m.organization_id = o.id WHERE m.user_id = ? AND o.deleted_at IS NULL ORDER BY o.created_at ASC").bind(userId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        if (Number(organizationCount?.count ?? 0) >= 1) return error("PLAN_LIMIT_REACHED", "The free plan includes one organization", rid, 402, { limit: 1, resource: "organizations" });
        const body = await jsonBody(request);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (name.length < 2 || name.length > 120 || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) return error("VALIDATION_ERROR", "Organization name or slug is invalid", rid, 400);
        const organizationId = id(); const now = new Date().toISOString();
        try {
          await env.DB.batch([
            env.DB.prepare("INSERT INTO organizations (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").bind(organizationId, name, slug, now, now),
            env.DB.prepare("INSERT INTO organization_members (organization_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").bind(organizationId, userId, now),
            env.DB.prepare("INSERT INTO subscriptions (organization_id, plan, status, created_at, updated_at) VALUES (?, 'free', 'active', ?, ?)").bind(organizationId, now, now),
          ]);
        } catch { return error("ORGANIZATION_SLUG_TAKEN", "Organization slug is already in use", rid, 409); }
        await writeOrganizationAudit(env, organizationId, "organization.created", "organization", organizationId, userId);
        return jsonResponse({ id: organizationId, name, slug, role: "owner", createdAt: now }, { status: 201, headers: cors });
      }
      const organizationDeleteMatch = path.match(/^\/api\/v1\/dashboard\/organizations\/([^/]+)$/);
      if (organizationDeleteMatch && request.method === "DELETE") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        if (!(await requireOrganizationMember(env, organizationDeleteMatch[1], userId, ["owner"]))) return error("FORBIDDEN", "Organization owner access is required", rid, 403);
        const attachments = await env.DB.prepare("SELECT object_key AS objectKey, project_id AS projectId FROM attachments WHERE organization_id = ? AND deleted_at IS NULL").bind(organizationDeleteMatch[1]).all<{ objectKey: string; projectId: string }>();
        const webhooks = await env.DB.prepare("SELECT id FROM webhooks WHERE organization_id = ?").bind(organizationDeleteMatch[1]).all<{ id: string }>();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE feedback_items SET email = NULL, body = '[organization deleted]', metadata_json = '{}', deleted_at = ?, updated_at = ? WHERE organization_id = ? AND deleted_at IS NULL").bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare("UPDATE feedback_comments SET body = '[organization deleted]', deleted_at = ? WHERE organization_id = ? AND deleted_at IS NULL").bind(now, organizationDeleteMatch[1]),
          env.DB.prepare("UPDATE attachments SET deleted_at = ? WHERE organization_id = ? AND deleted_at IS NULL").bind(now, organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM feedback_votes WHERE feedback_id IN (SELECT id FROM feedback_items WHERE organization_id = ?)").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM feedback_watchers WHERE feedback_id IN (SELECT id FROM feedback_items WHERE organization_id = ?)").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM feedback_status_history WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM feedback_tag_links WHERE tag_id IN (SELECT id FROM feedback_tags WHERE organization_id = ?)").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM roadmap_feedback_links WHERE roadmap_id IN (SELECT id FROM roadmap_items WHERE organization_id = ?)").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM changelog_feedback_links WHERE changelog_id IN (SELECT id FROM changelog_items WHERE organization_id = ?)").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM feedback_tags WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM categories WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM roadmap_items WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM changelog_items WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM project_api_keys WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM webhooks WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM organization_invites WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM notification_preferences WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM idempotency_keys WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM usage_counters WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM subscriptions WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM organization_members WHERE organization_id = ?").bind(organizationDeleteMatch[1]),
          env.DB.prepare("UPDATE projects SET deleted_at = ?, updated_at = ? WHERE organization_id = ? AND deleted_at IS NULL").bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare("UPDATE organizations SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL").bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare("INSERT INTO privacy_requests (id, organization_id, kind, status, requested_by, created_at, completed_at) VALUES (?, ?, 'delete', 'completed', ?, ?, ?)").bind(id(), organizationDeleteMatch[1], userId, now, now),
        ]);
        for (const attachment of attachments.results ?? []) ctx.waitUntil(env.EVENTS.send({ type: "attachment.delete", objectKey: attachment.objectKey, projectId: attachment.projectId, eventId: id() }));
        for (const webhook of webhooks.results ?? []) ctx.waitUntil(env.CACHE.delete(`webhook:secret:${webhook.id}`));
        for (const prefix of ["follow:", "upload:"]) {
          const tokenKeys = await env.CACHE.list({ prefix });
          for (const key of tokenKeys.keys) {
            const value = await env.CACHE.get(key.name, "json") as { organizationId?: string } | null;
            if (value?.organizationId === organizationDeleteMatch[1]) ctx.waitUntil(env.CACHE.delete(key.name));
          }
        }
        await writeOrganizationAudit(env, organizationDeleteMatch[1], "organization.deleted", "organization", organizationDeleteMatch[1], userId);
        return new Response(null, { status: 204, headers: cors });
      }
      const membersMatch = path.match(/^\/api\/v1\/dashboard\/organizations\/([^/]+)\/members(?:\/([^/]+))?$/);
      if (membersMatch && ["GET", "DELETE"].includes(request.method)) {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        const canManage = await requireOrganizationMember(env, membersMatch[1], userId, ["owner", "admin"]);
        if (!canManage) return error("FORBIDDEN", "Organization administrator access is required", rid, 403);
        if (request.method === "GET") {
          const rows = await env.DB.prepare(`SELECT m.user_id AS userId, u.email, m.role, m.created_at AS createdAt
            FROM organization_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? ORDER BY m.created_at ASC`)
            .bind(membersMatch[1]).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        if (!membersMatch[2]) return error("MEMBER_ID_REQUIRED", "Member ID is required", rid, 400);
        if (membersMatch[2] === userId) return error("MEMBER_SELF_REMOVE", "You cannot remove yourself from an organization", rid, 400);
        const removed = await env.DB.prepare("DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?").bind(membersMatch[1], membersMatch[2]).run();
        if (!removed.meta.changes) return error("MEMBER_NOT_FOUND", "Member was not found", rid, 404);
        await writeOrganizationAudit(env, membersMatch[1], "member.removed", "user", membersMatch[2], userId);
        return new Response(null, { status: 204, headers: cors });
      }
      const inviteMatch = path.match(/^\/api\/v1\/dashboard\/organizations\/([^/]+)\/invites$/);
      if (inviteMatch && request.method === "POST") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        if (!(await requireOrganizationMember(env, inviteMatch[1], userId, ["owner", "admin"]))) return error("FORBIDDEN", "Organization administrator access is required", rid, 403);
        const body = await jsonBody(request);
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const role = ["admin", "member", "moderator", "viewer", "billing_admin"].includes(String(body.role)) ? String(body.role) : "member";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return error("VALIDATION_ERROR", "A valid email is required", rid, 400);
        const existing = await env.DB.prepare("SELECT 1 FROM users u JOIN organization_members m ON m.user_id = u.id WHERE m.organization_id = ? AND u.email = ?").bind(inviteMatch[1], email).first();
        if (existing) return error("MEMBER_ALREADY_EXISTS", "This user is already a member", rid, 409);
        const token = randomToken("invite"); const now = new Date().toISOString(); const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
        try { await env.DB.prepare("INSERT INTO organization_invites (id, organization_id, email, role, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id(), inviteMatch[1], email, role, await sha256(token), expiresAt, now).run(); }
        catch { return error("INVITE_ALREADY_EXISTS", "An active invite already exists for this email", rid, 409); }
        const link = `${env.PUBLIC_APP_URL}/api/v1/dashboard/invites/${token}/accept`;
        await env.EVENTS.send({ type: "email.send", organizationId: inviteMatch[1], email, subject: "You have been invited to NitroPing", text: `You have been invited to join a NitroPing organization. Accept the invitation: ${link}`, html: `<p>You have been invited to join a NitroPing organization.</p><p><a href="${link}">Accept invitation</a></p>`, eventId: id() });
        await writeOrganizationAudit(env, inviteMatch[1], "member.invited", "organization_invite", email, userId, { role });
        return jsonResponse({ accepted: false, email, role, expiresAt }, { status: 202, headers: cors });
      }
      const inviteAcceptMatch = path.match(/^\/api\/v1\/dashboard\/invites\/([^/]+)\/accept$/);
      if (inviteAcceptMatch && request.method === "POST") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response || !identity.email) return identity instanceof Response ? identity : error("DASHBOARD_AUTH_REQUIRED", "An authenticated email is required", rid, 401);
        const invite = await env.DB.prepare("SELECT id, organization_id AS organizationId, email, role, expires_at AS expiresAt, accepted_at AS acceptedAt FROM organization_invites WHERE token_hash = ?").bind(await sha256(inviteAcceptMatch[1])).first<{ id: string; organizationId: string; email: string; role: string; expiresAt: string; acceptedAt: string | null }>();
        if (!invite || invite.acceptedAt || Date.parse(invite.expiresAt) <= Date.now() || invite.email.toLowerCase() !== identity.email.toLowerCase()) return error("INVITE_INVALID", "This invitation is invalid, expired, or belongs to another email", rid, 400);
        const userId = await userForIdentity(env, identity); const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("INSERT OR IGNORE INTO organization_members (organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?)").bind(invite.organizationId, userId, invite.role, now),
          env.DB.prepare("UPDATE organization_invites SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL").bind(now, invite.id),
        ]);
        await writeOrganizationAudit(env, invite.organizationId, "member.joined", "user", userId, userId, { role: invite.role });
        return jsonResponse({ accepted: true, organizationId: invite.organizationId, role: invite.role }, { headers: cors });
      }
      const projectsPath = path === "/api/v1/dashboard/projects";
      if (projectsPath && request.method === "GET") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        const rows = await env.DB.prepare("SELECT p.id, p.organization_id AS organizationId, p.name, p.slug, p.public_key AS publicKey, p.created_at AS createdAt FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id WHERE m.user_id = ? AND p.deleted_at IS NULL ORDER BY p.created_at ASC").bind(userId).all();
        return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
      }
      const projectCreateMatch = path.match(/^\/api\/v1\/dashboard\/organizations\/([^/]+)\/projects$/);
      if (projectCreateMatch && request.method === "POST") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        if (!(await requireOrganizationMember(env, projectCreateMatch[1], userId))) return error("FORBIDDEN", "Organization administrator access is required", rid, 403);
        const body = await jsonBody(request);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (name.length < 2 || name.length > 120 || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) return error("VALIDATION_ERROR", "Project name or slug is invalid", rid, 400);
        const subscription = await env.DB.prepare("SELECT plan FROM subscriptions WHERE organization_id = ?").bind(projectCreateMatch[1]).first<{ plan: string }>();
        const plan = subscription?.plan ?? "free";
        const projectCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM projects WHERE organization_id = ? AND deleted_at IS NULL").bind(projectCreateMatch[1]).first<{ count: number }>();
        const projectLimit = planProjectLimits[plan] ?? planProjectLimits.free;
        if (Number(projectCount?.count ?? 0) >= projectLimit) return error("PLAN_LIMIT_REACHED", `The ${plan} plan has reached its project limit`, rid, 402, { limit: projectLimit, resource: "projects" });
        const projectId = id(); const publicKey = randomToken("pk_live"); const serverKey = randomToken("sk_live"); const now = new Date().toISOString();
        try {
          await env.DB.batch([
            env.DB.prepare("INSERT INTO projects (id, organization_id, name, slug, public_key, server_key_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(projectId, projectCreateMatch[1], name, slug, publicKey, await sha256(serverKey), now, now),
            env.DB.prepare("INSERT INTO project_settings (project_id) VALUES (?)").bind(projectId),
            env.DB.prepare("INSERT INTO project_api_keys (id, organization_id, project_id, kind, label, key_prefix, key_hash, created_at) VALUES (?, ?, ?, 'public', 'default public key', ?, ?, ?), (?, ?, ?, 'server', 'default server key', ?, ?, ?)").bind(id(), projectCreateMatch[1], projectId, publicKey.slice(0, 12), await sha256(publicKey), now, id(), projectCreateMatch[1], projectId, serverKey.slice(0, 12), await sha256(serverKey), now),
          ]);
        } catch { return error("PROJECT_SLUG_TAKEN", "Project slug is already in use", rid, 409); }
        await writeOrganizationAudit(env, projectCreateMatch[1], "project.created", "project", projectId, userId);
        return jsonResponse({ id: projectId, organizationId: projectCreateMatch[1], name, slug, publicKey, serverKey, createdAt: now }, { status: 201, headers: cors });
      }
      if (path === "/api/v1/webhooks/stripe" && request.method === "POST") {
        const billingEnv = env as Env & { STRIPE_WEBHOOK_SECRET?: string };
        if (!billingEnv.STRIPE_WEBHOOK_SECRET) return error("BILLING_NOT_CONFIGURED", "Stripe webhooks are not configured for this deployment", rid, 503);
        const payload = await request.text();
        const signature = request.headers.get("stripe-signature") ?? "";
        const provider = new StripeBillingProvider("unused", { pro: "", business: "" }, billingEnv.STRIPE_WEBHOOK_SECRET);
        if (!(await provider.verifyWebhook(payload, signature))) return error("INVALID_STRIPE_SIGNATURE", "The Stripe webhook signature is invalid", rid, 401);
        const event = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
        const object = event.data?.object ?? {};
        if (event.type === "checkout.session.completed") {
          const organizationId = typeof object.client_reference_id === "string" ? object.client_reference_id : typeof (object.subscription as Record<string, unknown> | undefined)?.metadata === "object" ? String(((object.subscription as Record<string, unknown>).metadata as Record<string, unknown>).organizationId ?? "") : "";
          const subscriptionId = typeof object.subscription === "string" ? object.subscription : "";
          const customerId = typeof object.customer === "string" ? object.customer : null;
          const plan = typeof (object.metadata as Record<string, unknown> | undefined)?.plan === "string" ? String((object.metadata as Record<string, unknown>).plan) : "pro";
          if (organizationId && subscriptionId) await env.DB.prepare("INSERT INTO subscriptions (organization_id, plan, status, provider_customer_id, provider_subscription_id, created_at, updated_at) VALUES (?, ?, 'active', ?, ?, ?, ?) ON CONFLICT(organization_id) DO UPDATE SET plan = excluded.plan, status = 'active', provider_customer_id = excluded.provider_customer_id, provider_subscription_id = excluded.provider_subscription_id, updated_at = excluded.updated_at").bind(organizationId, plan, customerId, subscriptionId, new Date().toISOString(), new Date().toISOString()).run();
        }
        if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
          const subscriptionId = typeof object.id === "string" ? object.id : "";
          const existing = await env.DB.prepare("SELECT organization_id AS organizationId FROM subscriptions WHERE provider_subscription_id = ?").bind(subscriptionId).first<{ organizationId: string }>();
          if (existing) {
            const status = event.type === "customer.subscription.deleted" ? "canceled" : String(object.status ?? "active");
            const currentPeriodEnd = typeof object.current_period_end === "number" ? new Date(object.current_period_end * 1000).toISOString() : null;
            await env.DB.prepare("UPDATE subscriptions SET status = ?, current_period_end = ?, updated_at = ? WHERE organization_id = ?").bind(status, currentPeriodEnd, new Date().toISOString(), existing.organizationId).run();
          }
        }
        return jsonResponse({ received: true }, { headers: cors });
      }
      const webhookMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/webhooks(?:\/([^/]+))?$/);
      if (webhookMatch && ["GET", "POST", "DELETE"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, webhookMatch[1], rid, "developer:manage");
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT id, url, events_json AS events, active, created_at AS createdAt FROM webhooks WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC").bind(context.organizationId, context.projectId).all<Record<string, unknown>>();
          return jsonResponse({ items: (rows.results ?? []).map((row) => ({ ...row, events: JSON.parse(String(row.events ?? "[]")), active: Boolean(row.active) })) }, { headers: cors });
        }
        if (request.method === "DELETE") {
          if (!webhookMatch[2]) return error("WEBHOOK_ID_REQUIRED", "Webhook ID is required", rid, 400);
          const result = await env.DB.prepare("UPDATE webhooks SET active = 0 WHERE id = ? AND organization_id = ? AND project_id = ?").bind(webhookMatch[2], context.organizationId, context.projectId).run();
          if (!result.meta.changes) return error("WEBHOOK_NOT_FOUND", "Webhook was not found", rid, 404);
          await env.CACHE.delete(`webhook:secret:${webhookMatch[2]}`);
          await writeAudit(env, context, "webhook.disabled", "webhook", webhookMatch[2]);
          return new Response(null, { status: 204, headers: cors });
        }
        const body = await jsonBody(request);
        let webhookUrl: URL;
        try { webhookUrl = new URL(typeof body.url === "string" ? body.url : ""); } catch { return error("VALIDATION_ERROR", "Webhook URL is invalid", rid, 400); }
        if (webhookUrl.protocol !== "https:") return error("VALIDATION_ERROR", "Webhook URL must use HTTPS", rid, 400);
        const events = Array.isArray(body.events) ? body.events.filter((event): event is WebhookEventType => typeof event === "string" && webhookEventTypes.includes(event as WebhookEventType)) : [...webhookEventTypes];
        if (!events.length) return error("VALIDATION_ERROR", "At least one webhook event is required", rid, 400);
        const webhookId = id();
        const secret = randomToken("whsec");
        const now = new Date().toISOString();
        await env.DB.prepare("INSERT INTO webhooks (id, organization_id, project_id, url, secret_hash, events_json, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)").bind(webhookId, context.organizationId, context.projectId, webhookUrl.toString(), await sha256(secret), JSON.stringify(events), now).run();
        await env.CACHE.put(`webhook:secret:${webhookId}`, secret);
        await writeAudit(env, context, "webhook.created", "webhook", webhookId, { events });
        return jsonResponse({ id: webhookId, url: webhookUrl.toString(), events, active: true, secret, createdAt: now }, { status: 201, headers: cors });
      }
      const settingsMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/settings$/);
      if (settingsMatch && ["GET", "PATCH"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, settingsMatch[1], rid, "project:manage");
        if (context instanceof Response) return context;
        await env.DB.prepare("INSERT OR IGNORE INTO project_settings (project_id) VALUES (?)").bind(context.projectId).run();
        if (request.method === "GET") {
          const settings = await env.DB.prepare("SELECT theme_json AS theme, allowed_metadata_json AS allowedMetadata, retention_days AS retentionDays, origins_json AS origins FROM project_settings WHERE project_id = ?").bind(context.projectId).first<Record<string, unknown>>();
          return jsonResponse({ theme: JSON.parse(String(settings?.theme ?? "{}")), allowedMetadata: JSON.parse(String(settings?.allowedMetadata ?? "[]")), retentionDays: Number(settings?.retentionDays ?? 365), origins: JSON.parse(String(settings?.origins ?? "[]")) }, { headers: cors });
        }
        const body = await jsonBody(request);
        const current = await env.DB.prepare("SELECT theme_json, allowed_metadata_json, retention_days, origins_json FROM project_settings WHERE project_id = ?").bind(context.projectId).first<{ theme_json: string; allowed_metadata_json: string; retention_days: number; origins_json: string }>();
        if (!current) return error("PROJECT_SETTINGS_NOT_FOUND", "Project settings were not found", rid, 404);
        const theme = body.theme && typeof body.theme === "object" && !Array.isArray(body.theme) ? body.theme : JSON.parse(current.theme_json);
        const allowedMetadata = body.allowedMetadata === undefined ? JSON.parse(current.allowed_metadata_json) : body.allowedMetadata;
        const retentionDays = body.retentionDays === undefined ? current.retention_days : Number(body.retentionDays);
        const origins = body.origins === undefined ? JSON.parse(current.origins_json) : body.origins;
        if (!Array.isArray(allowedMetadata) || allowedMetadata.length > 100 || allowedMetadata.some((field) => typeof field !== "string" || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(field))) return error("VALIDATION_ERROR", "Allowed metadata fields are invalid", rid, 400);
        if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) return error("VALIDATION_ERROR", "Retention must be between 1 and 3650 days", rid, 400);
        if (!Array.isArray(origins) || origins.length > 50 || origins.some((origin) => typeof origin !== "string" || !/^https:\/\//.test(origin))) return error("VALIDATION_ERROR", "Origins must be HTTPS URLs", rid, 400);
        await env.DB.prepare("UPDATE project_settings SET theme_json = ?, allowed_metadata_json = ?, retention_days = ?, origins_json = ? WHERE project_id = ?").bind(JSON.stringify(theme), JSON.stringify(allowedMetadata), retentionDays, JSON.stringify(origins), context.projectId).run();
        await writeAudit(env, context, "project.settings.updated", "project", context.projectId, { retentionDays, originCount: origins.length, metadataFieldCount: allowedMetadata.length });
        return jsonResponse({ theme, allowedMetadata, retentionDays, origins }, { headers: cors });
      }
      const usageMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/usage$/);
      if (usageMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, usageMatch[1], rid);
        if (context instanceof Response) return context;
        const usage = await currentUsage(env, context.organizationId);
        return jsonResponse({ ...usage, projectId: context.projectId }, { headers: cors });
      }
      const analyticsMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/analytics$/);
      if (analyticsMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, analyticsMatch[1], rid);
        if (context instanceof Response) return context;
        const [total, statuses, platforms, types, volume, responseTime, resolutionTime] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(context.organizationId, context.projectId).first<{ count: number }>(),
          env.DB.prepare("SELECT status, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL GROUP BY status ORDER BY count DESC").bind(context.organizationId, context.projectId).all(),
          env.DB.prepare("SELECT COALESCE(platform, 'unknown') AS platform, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL GROUP BY platform ORDER BY count DESC").bind(context.organizationId, context.projectId).all(),
          env.DB.prepare("SELECT type, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL GROUP BY type ORDER BY count DESC").bind(context.organizationId, context.projectId).all(),
          env.DB.prepare("SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL AND datetime(created_at) >= datetime('now', '-30 days') GROUP BY substr(created_at, 1, 10) ORDER BY date ASC").bind(context.organizationId, context.projectId).all(),
          env.DB.prepare("SELECT AVG((julianday(replies.repliedAt) - julianday(f.created_at)) * 1440) AS averageMinutes FROM feedback_items f JOIN (SELECT feedback_id, MIN(created_at) AS repliedAt FROM feedback_comments WHERE organization_id = ? AND project_id = ? AND is_internal = 0 AND deleted_at IS NULL GROUP BY feedback_id) replies ON replies.feedback_id = f.id WHERE f.organization_id = ? AND f.project_id = ? AND f.deleted_at IS NULL").bind(context.organizationId, context.projectId, context.organizationId, context.projectId).first<{ averageMinutes: number | null }>(),
          env.DB.prepare("SELECT AVG((julianday(resolved.resolvedAt) - julianday(f.created_at)) * 1440) AS averageMinutes FROM feedback_items f JOIN (SELECT feedback_id, MIN(created_at) AS resolvedAt FROM feedback_status_history WHERE organization_id = ? AND project_id = ? AND to_status = 'resolved' GROUP BY feedback_id) resolved ON resolved.feedback_id = f.id WHERE f.organization_id = ? AND f.project_id = ? AND f.deleted_at IS NULL").bind(context.organizationId, context.projectId, context.organizationId, context.projectId).first<{ averageMinutes: number | null }>(),
        ]);
        return jsonResponse({
          total: Number(total?.count ?? 0),
          statuses: statuses.results ?? [],
          platforms: platforms.results ?? [],
          types: types.results ?? [],
          volume: volume.results ?? [],
          averageResponseMinutes: responseTime?.averageMinutes == null ? null : Math.round(Number(responseTime.averageMinutes)),
          averageResolutionMinutes: resolutionTime?.averageMinutes == null ? null : Math.round(Number(resolutionTime.averageMinutes)),
          generatedAt: new Date().toISOString(),
        }, { headers: cors });
      }
      const apiKeysMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/api-keys(?:\/([^/]+))?$/);
      if (apiKeysMatch && ["GET", "POST", "DELETE"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, apiKeysMatch[1], rid, "developer:manage");
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT id, kind, label, key_prefix AS keyPrefix, created_at AS createdAt, revoked_at AS revokedAt FROM project_api_keys WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC").bind(context.organizationId, context.projectId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        if (request.method === "DELETE") {
          if (!apiKeysMatch[2]) return error("API_KEY_ID_REQUIRED", "API key ID is required", rid, 400);
          const result = await env.DB.prepare("UPDATE project_api_keys SET revoked_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND revoked_at IS NULL").bind(new Date().toISOString(), apiKeysMatch[2], context.organizationId, context.projectId).run();
          if (!result.meta.changes) return error("API_KEY_NOT_FOUND", "API key was not found", rid, 404);
          await writeAudit(env, context, "api_key.revoked", "api_key", apiKeysMatch[2]);
          return new Response(null, { status: 204, headers: cors });
        }
        const body = await jsonBody(request);
        const kind = body.kind === "public" ? "public" : body.kind === "server" ? "server" : "";
        const label = typeof body.label === "string" && body.label.trim().length > 0 ? body.label.trim().slice(0, 120) : `rotated ${kind} key`;
        if (!kind) return error("VALIDATION_ERROR", "API key kind must be public or server", rid, 400);
        const key = randomToken(kind === "public" ? "pk_live" : "sk_live");
        const keyId = id();
        const now = new Date().toISOString();
        if (kind === "public") await env.DB.prepare("UPDATE projects SET public_key = ?, updated_at = ? WHERE id = ? AND organization_id = ?").bind(key, now, context.projectId, context.organizationId).run();
        await env.DB.prepare("INSERT INTO project_api_keys (id, organization_id, project_id, kind, label, key_prefix, key_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(keyId, context.organizationId, context.projectId, kind, label, key.slice(0, 12), await sha256(key), now).run();
        await writeAudit(env, context, "api_key.created", "api_key", keyId, { kind, label });
        return jsonResponse({ id: keyId, kind, label, key, keyPrefix: key.slice(0, 12), createdAt: now }, { status: 201, headers: cors });
      }
      if (path === "/api/v1/dashboard/billing" && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "billing:manage");
        if (context instanceof Response) return context;
        const subscription = await env.DB.prepare("SELECT plan, status, provider_customer_id AS providerCustomerId, provider_subscription_id AS providerSubscriptionId, current_period_end AS currentPeriodEnd, created_at AS createdAt, updated_at AS updatedAt FROM subscriptions WHERE organization_id = ?").bind(context.organizationId).first();
        return jsonResponse(subscription ?? { plan: "free", status: "active" }, { headers: cors });
      }
      if (path === "/api/v1/dashboard/billing/checkout" && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "billing:manage");
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const plan = body.plan === "pro" || body.plan === "business" ? body.plan as BillingPlan : null;
        if (!plan) return error("VALIDATION_ERROR", "A valid billing plan is required", rid, 400);
        const billingEnv = env as Env & { STRIPE_SECRET_KEY?: string; STRIPE_PRICE_PRO?: string; STRIPE_PRICE_BUSINESS?: string };
        if (!billingEnv.STRIPE_SECRET_KEY || !billingEnv.STRIPE_PRICE_PRO || !billingEnv.STRIPE_PRICE_BUSINESS) return error("BILLING_NOT_CONFIGURED", "Stripe billing is not configured for this deployment", rid, 503);
        const subscription = await env.DB.prepare("SELECT provider_customer_id AS providerCustomerId FROM subscriptions WHERE organization_id = ?").bind(context.organizationId).first<{ providerCustomerId: string | null }>();
        const provider = new StripeBillingProvider(billingEnv.STRIPE_SECRET_KEY, { pro: billingEnv.STRIPE_PRICE_PRO, business: billingEnv.STRIPE_PRICE_BUSINESS });
        const checkout = await provider.createCheckoutSession({ organizationId: context.organizationId, plan, customerId: subscription?.providerCustomerId ?? undefined, successUrl: `${env.PUBLIC_APP_URL}/dashboard?billing=success`, cancelUrl: `${env.PUBLIC_APP_URL}/dashboard?billing=cancelled` });
        return jsonResponse(checkout, { status: 201, headers: cors });
      }
      const categoriesDashboardMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/categories$/);
      if (categoriesDashboardMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, categoriesDashboardMatch[1], rid, "project:manage");
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT id, name, slug, created_at AS createdAt FROM categories WHERE organization_id = ? AND project_id = ? ORDER BY name ASC").bind(context.organizationId, context.projectId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (name.length < 2 || name.length > 80 || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) return error("VALIDATION_ERROR", "Category name or slug is invalid", rid, 400);
        const category = { id: id(), name, slug, createdAt: new Date().toISOString() };
        try { await env.DB.prepare("INSERT INTO categories (id, organization_id, project_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(category.id, context.organizationId, context.projectId, name, slug, category.createdAt).run(); }
        catch { return error("CATEGORY_SLUG_TAKEN", "Category slug is already in use", rid, 409); }
        await writeAudit(env, context, "category.created", "category", category.id, { name, slug });
        return jsonResponse(category, { status: 201, headers: cors });
      }
      const tagsDashboardMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/tags$/);
      if (tagsDashboardMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, tagsDashboardMatch[1], rid, request.method === "GET" ? "feedback:read" : "project:manage");
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT id, name, slug, created_at AS createdAt FROM feedback_tags WHERE organization_id = ? AND project_id = ? ORDER BY name ASC").bind(context.organizationId, context.projectId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (name.length < 1 || name.length > 80 || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) return error("VALIDATION_ERROR", "Tag name or slug is invalid", rid, 400);
        const tag = { id: id(), name, slug, createdAt: new Date().toISOString() };
        try { await env.DB.prepare("INSERT INTO feedback_tags (id, organization_id, project_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(tag.id, context.organizationId, context.projectId, name, slug, tag.createdAt).run(); }
        catch { return error("TAG_SLUG_TAKEN", "Tag slug is already in use", rid, 409); }
        await writeAudit(env, context, "tag.created", "tag", tag.id, { name, slug });
        return jsonResponse(tag, { status: 201, headers: cors });
      }
      const feedbackTagsMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/tags(?:\/([^/]+))?$/);
      if (feedbackTagsMatch && ["GET", "POST", "DELETE"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, request.method === "GET" ? "feedback:read" : "feedback:write");
        if (context instanceof Response) return context;
        const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(feedbackTagsMatch[1], context.organizationId, context.projectId).first();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT t.id, t.name, t.slug, t.created_at AS createdAt FROM feedback_tags t JOIN feedback_tag_links l ON l.tag_id = t.id WHERE l.feedback_id = ? AND t.organization_id = ? AND t.project_id = ? ORDER BY t.name ASC").bind(feedbackTagsMatch[1], context.organizationId, context.projectId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const tagId = feedbackTagsMatch[2] ?? (typeof body.tagId === "string" ? body.tagId : "");
        if (!tagId) return error("TAG_ID_REQUIRED", "tagId is required", rid, 400);
        const tag = await env.DB.prepare("SELECT id FROM feedback_tags WHERE id = ? AND organization_id = ? AND project_id = ?").bind(tagId, context.organizationId, context.projectId).first();
        if (!tag) return error("TAG_NOT_FOUND", "Tag was not found", rid, 404);
        if (request.method === "POST") await env.DB.prepare("INSERT OR IGNORE INTO feedback_tag_links (feedback_id, tag_id, created_at) VALUES (?, ?, ?)").bind(feedbackTagsMatch[1], tagId, new Date().toISOString()).run();
        else await env.DB.prepare("DELETE FROM feedback_tag_links WHERE feedback_id = ? AND tag_id = ?").bind(feedbackTagsMatch[1], tagId).run();
        await writeAudit(env, context, request.method === "POST" ? "feedback.tag.added" : "feedback.tag.removed", "feedback", feedbackTagsMatch[1], { tagId });
        return request.method === "POST" ? jsonResponse({ feedbackId: feedbackTagsMatch[1], tagId }, { status: 201, headers: cors }) : new Response(null, { status: 204, headers: cors });
      }
      const roadmapDashboardMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/roadmap$/);
      if (roadmapDashboardMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, roadmapDashboardMatch[1], rid, request.method === "GET" ? "feedback:read" : "roadmap:manage");
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT id, title, body, status, created_at AS createdAt, updated_at AS updatedAt FROM roadmap_items WHERE organization_id = ? AND project_id = ? ORDER BY updated_at DESC").bind(context.organizationId, context.projectId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.body === "string" ? body.body.trim() : "";
        const status = typeof body.status === "string" ? body.status : "planned";
        if (title.length < 2 || title.length > 160 || description.length > 20_000 || !["planned", "in_progress", "completed"].includes(status)) return error("VALIDATION_ERROR", "Roadmap item is invalid", rid, 400);
        const now = new Date().toISOString();
        const item = { id: id(), title, body: description, status, createdAt: now, updatedAt: now };
        await env.DB.prepare("INSERT INTO roadmap_items (id, organization_id, project_id, title, body, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(item.id, context.organizationId, context.projectId, title, description, status, now, now).run();
        await writeAudit(env, context, "roadmap.created", "roadmap", item.id, { status });
        return jsonResponse(item, { status: 201, headers: cors });
      }
      const roadmapUpdateMatch = path.match(/^\/api\/v1\/dashboard\/roadmap\/([^/]+)$/);
      if (roadmapUpdateMatch && request.method === "PATCH") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "roadmap:manage");
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const current = await env.DB.prepare("SELECT title, body, status FROM roadmap_items WHERE id = ? AND organization_id = ? AND project_id = ?").bind(roadmapUpdateMatch[1], context.organizationId, context.projectId).first<{ title: string; body: string; status: string }>();
        if (!current) return error("ROADMAP_NOT_FOUND", "Roadmap item was not found", rid, 404);
        const title = body.title === undefined ? current.title : String(body.title).trim();
        const description = body.body === undefined ? current.body : String(body.body).trim();
        const status = body.status === undefined ? current.status : String(body.status);
        if (title.length < 2 || title.length > 160 || description.length > 20_000 || !["planned", "in_progress", "completed"].includes(status)) return error("VALIDATION_ERROR", "Roadmap item is invalid", rid, 400);
        const updatedAt = new Date().toISOString();
        await env.DB.prepare("UPDATE roadmap_items SET title = ?, body = ?, status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ?").bind(title, description, status, updatedAt, roadmapUpdateMatch[1], context.organizationId, context.projectId).run();
        await writeAudit(env, context, "roadmap.updated", "roadmap", roadmapUpdateMatch[1], { status });
        return jsonResponse({ id: roadmapUpdateMatch[1], title, body: description, status, updatedAt }, { headers: cors });
      }
      const changelogDashboardMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/changelog$/);
      if (changelogDashboardMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, changelogDashboardMatch[1], rid, request.method === "GET" ? "feedback:read" : "roadmap:manage");
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT id, title, body, published_at AS publishedAt, created_at AS createdAt, updated_at AS updatedAt FROM changelog_items WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC").bind(context.organizationId, context.projectId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.body === "string" ? body.body.trim() : "";
        const publishedAt = body.publishedAt === null ? null : typeof body.publishedAt === "string" ? body.publishedAt : new Date().toISOString();
        if (title.length < 2 || title.length > 160 || description.length < 1 || description.length > 20_000 || (publishedAt !== null && Number.isNaN(Date.parse(publishedAt)))) return error("VALIDATION_ERROR", "Changelog item is invalid", rid, 400);
        const now = new Date().toISOString();
        const item = { id: id(), title, body: description, publishedAt, createdAt: now, updatedAt: now };
        await env.DB.prepare("INSERT INTO changelog_items (id, organization_id, project_id, title, body, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(item.id, context.organizationId, context.projectId, title, description, publishedAt, now, now).run();
        await writeAudit(env, context, "changelog.created", "changelog", item.id, { published: Boolean(publishedAt) });
        return jsonResponse(item, { status: 201, headers: cors });
      }
      const match = path.match(/^\/api\/v1\/projects\/([^/]+)\/feedback(?:\/([^/]+))?$/);
      if (match && request.method === "POST" && !match[2]) {
        const input = validateInput(await request.json());
        if (typeof input === "string") return error("VALIDATION_ERROR", input, rid, 400);
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
  if (!(await rateLimit(env, request, context.projectId))) return error("RATE_LIMITED", "Too many requests", rid, 429);
        const metadataError = await allowedMetadata(env, context, input, rid);
        if (metadataError) return metadataError;
        if (input.categoryId) {
          const category = await env.DB.prepare("SELECT id FROM categories WHERE id = ? AND organization_id = ? AND project_id = ?").bind(input.categoryId, context.organizationId, context.projectId).first();
          if (!category) return error("CATEGORY_NOT_FOUND", "The category does not belong to this project", rid, 400);
        }
        const idem = request.headers.get("idempotency-key");
        if (idem) {
          if (idem.length > 128) return error("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key is too long", rid, 400);
          const previous = await env.DB.prepare("SELECT response_json, status_code FROM idempotency_keys WHERE project_id = ? AND key = ?").bind(context.projectId, idem).first<{ response_json: string; status_code: number }>();
          if (previous) return new Response(previous.response_json, { status: previous.status_code, headers: cors });
        }
        const usage = await currentUsage(env, context.organizationId);
        if (usage.feedbackCount >= usage.feedbackLimit) return error("PLAN_LIMIT_REACHED", `The ${usage.plan} plan has reached its monthly feedback limit`, rid, 402, { period: usage.period, limit: usage.feedbackLimit });
        const result = await Effect.runPromise(createFeedback(repo, context, input, rid));
        await env.DB.prepare("INSERT INTO usage_counters (organization_id, period, feedback_count, attachment_bytes) VALUES (?, ?, 1, 0) ON CONFLICT(organization_id, period) DO UPDATE SET feedback_count = feedback_count + 1").bind(context.organizationId, usage.period).run();
        recordMetric(env, "feedback.created", context.organizationId, context.projectId, [1]);
        if (idem) await env.DB.prepare("INSERT OR IGNORE INTO idempotency_keys (organization_id, project_id, key, response_json, status_code, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(context.organizationId, context.projectId, idem, JSON.stringify(result), 201, result.createdAt).run();
        if (env.EVENTS) {
          const eventId = id();
          await env.EVENTS.send({ type: "feedback.created", feedbackId: result.id, projectId: result.projectId, eventId });
          ctx.waitUntil(enqueueWebhookDeliveries(env, result.projectId, result.id, "feedback.created", eventId));
        }
        if (env.EVENT_STREAM) ctx.waitUntil(env.EVENT_STREAM.getByName(result.projectId).publish({ type: "feedback.created", feedbackId: result.id, projectId: result.projectId, createdAt: result.createdAt }));
        return jsonResponse(result, { status: 201, headers: cors });
      }
      if (match && request.method === "GET" && match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        const result = await Effect.runPromise(getFeedback(repo, context, match[2]));
        return result && result.status !== "spam" ? jsonResponse(publicFeedback(result), { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
      }
      if (match && request.method === "GET" && !match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        const result = await Effect.runPromise(listFeedback(repo, context, url.searchParams.get("cursor") ?? undefined));
        return jsonResponse({ ...result, items: result.items.filter((item) => item.status !== "spam").map(publicFeedback) }, { headers: cors });
      }
      const categoriesMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/public\/categories$/);
      if (categoriesMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, categoriesMatch[1], rid);
        if (scopeError) return scopeError;
        const rows = await env.DB.prepare("SELECT id, name, slug FROM categories WHERE organization_id = ? AND project_id = ? ORDER BY name ASC").bind(context.organizationId, context.projectId).all();
        return await etagged({ items: rows.results ?? [] }, request, cors);
      }
      const roadmapMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/public\/roadmap$/);
      if (roadmapMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, roadmapMatch[1], rid);
        if (scopeError) return scopeError;
        const rows = await env.DB.prepare("SELECT id, title, body, status, created_at AS createdAt, updated_at AS updatedAt FROM roadmap_items WHERE organization_id = ? AND project_id = ? ORDER BY updated_at DESC").bind(context.organizationId, context.projectId).all();
        return await etagged({ items: rows.results ?? [] }, request, cors);
      }
      const changelogMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/public\/changelog$/);
      if (changelogMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, changelogMatch[1], rid);
        if (scopeError) return scopeError;
        const rows = await env.DB.prepare("SELECT id, title, body, published_at AS publishedAt, created_at AS createdAt FROM changelog_items WHERE organization_id = ? AND project_id = ? AND published_at IS NOT NULL ORDER BY published_at DESC").bind(context.organizationId, context.projectId).all();
        return await etagged({ items: rows.results ?? [] }, request, cors);
      }
      const eventsMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/events$/);
      if (eventsMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, eventsMatch[1], rid);
        if (scopeError) return scopeError;
        if (!env.EVENT_STREAM) return error("REALTIME_NOT_CONFIGURED", "Realtime event streaming is not configured", rid, 503);
        return env.EVENT_STREAM.getByName(context.projectId).fetch(request);
      }
      const commentMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/feedback\/([^/]+)\/comments$/);
      if (commentMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, commentMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `comment:${context.projectId}`))) return error("RATE_LIMITED", "Too many requests", rid, 429);
        const body = await jsonBody(request);
        if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 10_000) return error("VALIDATION_ERROR", "Comment must be 1-10000 characters", rid, 400);
        const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL").bind(commentMatch[2], context.organizationId, context.projectId).first();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        const comment = { id: id(), feedbackId: commentMatch[2], body: body.body.trim(), createdAt: new Date().toISOString() };
        await env.DB.prepare("INSERT INTO feedback_comments (id, organization_id, project_id, feedback_id, body, is_internal, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)").bind(comment.id, context.organizationId, context.projectId, comment.feedbackId, comment.body, comment.createdAt).run();
        return jsonResponse(comment, { status: 201, headers: cors });
      }
      const voteMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/feedback\/([^/]+)\/vote$/);
      if (voteMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, voteMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `vote:${context.projectId}`))) return error("RATE_LIMITED", "Too many requests", rid, 429);
        const voter = await sha256(`${clientIp(request)}:${request.headers.get("user-agent") ?? ""}`);
        await env.DB.prepare("INSERT OR IGNORE INTO feedback_votes (feedback_id, voter_fingerprint, created_at) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL)").bind(voteMatch[2], voter, new Date().toISOString(), voteMatch[2], context.organizationId, context.projectId).run();
        const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM feedback_votes WHERE feedback_id = ?").bind(voteMatch[2]).first<{ count: number }>();
        return jsonResponse({ feedbackId: voteMatch[2], votes: Number(count?.count ?? 0) }, { headers: cors });
      }
      const uploadMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/uploads\/initiate$/);
      if (uploadMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, uploadMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `upload:${context.projectId}`))) return error("RATE_LIMITED", "Too many requests", rid, 429);
        const body = await jsonBody(request);
        const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
        const size = Number(body.size ?? 0);
        if (!Number.isFinite(size) || size < 1 || size > 10 * 1024 * 1024) return error("ATTACHMENT_TOO_LARGE", "Attachments cannot exceed 10 MB", rid, 413);
        if (!/^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/.test(contentType)) return error("UNSUPPORTED_ATTACHMENT", "Unsupported attachment type", rid, 415);
        const feedbackId = typeof body.feedbackId === "string" ? body.feedbackId : "unlinked";
        if (feedbackId !== "unlinked") {
          const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(feedbackId, context.organizationId, context.projectId).first();
          if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        }
        const token = randomToken("upl");
        const attachmentId = id();
        const objectKey = `${context.organizationId}/${context.projectId}/${feedbackId}/${attachmentId}`;
        await env.CACHE.put(`upload:${token}`, JSON.stringify({ attachmentId, objectKey, feedbackId, ...context, contentType, size }), { expirationTtl: 900 });
        return jsonResponse({ uploadToken: token, attachmentId, uploadUrl: `/api/v1/uploads/${token}`, expiresIn: 900 }, { status: 201, headers: cors });
      }
      const uploadPut = path.match(/^\/api\/v1\/uploads\/([^/]+)$/);
      if (uploadPut && request.method === "PUT") {
        const raw = await env.CACHE.get(`upload:${uploadPut[1]}`, "json") as { attachmentId: string; objectKey: string; feedbackId: string; organizationId: string; projectId: string; contentType: string; size: number } | null;
        if (!raw) return error("UPLOAD_EXPIRED", "The upload token is invalid or expired", rid, 404);
        const body = request.body;
        if (!body) return error("EMPTY_UPLOAD", "The upload body is empty", rid, 400);
        const contentLength = Number(request.headers.get("content-length") ?? raw.size);
        if (!Number.isFinite(contentLength) || contentLength !== raw.size || contentLength > 10 * 1024 * 1024) return error("ATTACHMENT_SIZE_MISMATCH", "The uploaded file size does not match the initiated upload", rid, 400);
        const bytes = await request.arrayBuffer();
        if (bytes.byteLength !== raw.size) return error("ATTACHMENT_SIZE_MISMATCH", "The uploaded file size does not match the initiated upload", rid, 400);
        const usage = await currentUsage(env, raw.organizationId);
        if (usage.attachmentBytes + raw.size > usage.attachmentLimit) return error("PLAN_LIMIT_REACHED", `The ${usage.plan} plan has reached its attachment limit`, rid, 402, { limit: usage.attachmentLimit, resource: "attachments" });
        await env.ATTACHMENTS.put(raw.objectKey, bytes, { httpMetadata: { contentType: raw.contentType } });
        await env.DB.prepare("INSERT INTO attachments (id, organization_id, project_id, feedback_id, object_key, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(raw.attachmentId, raw.organizationId, raw.projectId, raw.feedbackId, raw.objectKey, raw.contentType, raw.size, new Date().toISOString()).run();
        await env.DB.prepare("INSERT INTO usage_counters (organization_id, period, feedback_count, attachment_bytes) VALUES (?, ?, 0, ?) ON CONFLICT(organization_id, period) DO UPDATE SET attachment_bytes = attachment_bytes + excluded.attachment_bytes").bind(raw.organizationId, new Date().toISOString().slice(0, 7), raw.size).run();
        recordMetric(env, "attachment.created", raw.organizationId, raw.projectId, [raw.size]);
        await env.CACHE.delete(`upload:${uploadPut[1]}`);
        return jsonResponse({ attachmentId: raw.attachmentId, objectKey: raw.objectKey }, { status: 201, headers: cors });
      }
      const attachmentDownloadMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/attachments\/([^/]+)$/);
      if (attachmentDownloadMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, attachmentDownloadMatch[1], rid, "feedback:read");
        if (context instanceof Response) return context;
        const attachment = await env.DB.prepare("SELECT object_key AS objectKey, content_type AS contentType FROM attachments WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(attachmentDownloadMatch[2], context.organizationId, context.projectId).first<{ objectKey: string; contentType: string }>();
        if (!attachment) return error("ATTACHMENT_NOT_FOUND", "Attachment was not found", rid, 404);
        const object = await env.ATTACHMENTS.get(attachment.objectKey);
        if (!object) return error("ATTACHMENT_NOT_FOUND", "Attachment was not found", rid, 404);
        return new Response(object.body, { headers: { ...cors, "content-type": attachment.contentType, "cache-control": "private, max-age=60" } });
      }
      const followUpMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/follow-up\/request$/);
      if (followUpMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, followUpMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `follow-up:${context.projectId}`))) return error("RATE_LIMITED", "Too many requests", rid, 429);
        const body = await jsonBody(request);
        if (typeof body.feedbackId !== "string" || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 320) return error("VALIDATION_ERROR", "A valid feedbackId and email are required", rid, 400);
        const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL").bind(body.feedbackId, context.organizationId, context.projectId).first();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        const token = randomToken("follow");
        await env.CACHE.put(`follow:${token}`, JSON.stringify({ feedbackId: body.feedbackId, ...context, email: body.email }), { expirationTtl: 86_400 });
        await env.DB.prepare("INSERT OR IGNORE INTO feedback_watchers (feedback_id, email, created_at) VALUES (?, ?, ?)").bind(body.feedbackId, body.email.toLowerCase(), new Date().toISOString()).run();
        if (env.EVENTS) await env.EVENTS.send({ type: "follow-up.requested", token, email: body.email, feedbackId: body.feedbackId, organizationId: context.organizationId, projectId: context.projectId, eventId: id() });
        return jsonResponse({ accepted: true }, { status: 202, headers: cors });
      }
      const followUpReadMatch = path.match(/^\/api\/v1\/follow-up\/([^/]+)$/);
      if (followUpReadMatch && request.method === "GET") {
        const raw = await env.CACHE.get(`follow:${followUpReadMatch[1]}`, "json") as { feedbackId: string; organizationId: string; projectId: string } | null;
        if (!raw) return error("FOLLOW_UP_EXPIRED", "The follow-up link is invalid or expired", rid, 404);
        const feedback = await env.DB.prepare("SELECT id, type, status, priority, title, body, platform, app_version AS appVersion, created_at AS createdAt, updated_at AS updatedAt FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(raw.feedbackId, raw.organizationId, raw.projectId).first();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        const comments = await env.DB.prepare("SELECT id, body, created_at AS createdAt FROM feedback_comments WHERE feedback_id = ? AND project_id = ? AND is_internal = 0 AND deleted_at IS NULL ORDER BY created_at ASC").bind(raw.feedbackId, raw.projectId).all();
        return jsonResponse({ feedback, comments: comments.results ?? [] }, { headers: cors });
      }
      const exportMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/export$/);
      if (exportMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, exportMatch[1], rid, "privacy:manage");
        if (context instanceof Response) return context;
        const feedback = await env.DB.prepare("SELECT * FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC").bind(context.organizationId, context.projectId).all();
        const comments = await env.DB.prepare("SELECT * FROM feedback_comments WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC").bind(context.organizationId, context.projectId).all();
        const attachments = await env.DB.prepare("SELECT id, feedback_id, content_type, size_bytes, created_at FROM attachments WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC").bind(context.organizationId, context.projectId).all();
        await env.DB.prepare("INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'export', 'completed', ?, ?)").bind(id(), context.organizationId, context.projectId, new Date().toISOString(), new Date().toISOString()).run();
        return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), feedback: feedback.results ?? [], comments: comments.results ?? [], attachments: attachments.results ?? [] }), { status: 200, headers: { ...cors, "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename=nitroping-${context.projectId}-export.json` } });
      }
      const anonymizeMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback\/([^/]+)\/anonymize$/);
      if (anonymizeMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, anonymizeMatch[1], rid, "privacy:manage");
        if (context instanceof Response) return context;
        const now = new Date().toISOString();
        const result = await env.DB.prepare("UPDATE feedback_items SET email = NULL, body = '[anonymized]', metadata_json = '{}', updated_at = ?, deleted_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(now, now, anonymizeMatch[2], context.organizationId, context.projectId).run();
        if (!result.meta.changes) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        const attachments = await env.DB.prepare("SELECT object_key AS objectKey FROM attachments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(anonymizeMatch[2], context.organizationId, context.projectId).all<{ objectKey: string }>();
        await env.DB.batch([
          env.DB.prepare("UPDATE feedback_comments SET body = '[anonymized]', deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ?").bind(now, anonymizeMatch[2], context.organizationId, context.projectId),
          env.DB.prepare("UPDATE attachments SET deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(now, anonymizeMatch[2], context.organizationId, context.projectId),
          env.DB.prepare("INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'anonymize', 'completed', ?, ?)").bind(id(), context.organizationId, context.projectId, now, now),
        ]);
        for (const attachment of attachments.results ?? []) ctx.waitUntil(env.EVENTS.send({ type: "attachment.delete", objectKey: attachment.objectKey, projectId: context.projectId, eventId: id() }));
        return jsonResponse({ anonymized: true, feedbackId: anonymizeMatch[2] }, { headers: cors });
      }
      const moderationMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/moderation$/);
      if (moderationMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, moderationMatch[1], rid, request.method === "GET" ? "feedback:read" : "feedback:moderate");
        if (context instanceof Response) return context;
        const identity = String(env.ACCESS_TEAM_DOMAIN ?? "") && String(env.ACCESS_AUDIENCE ?? "") ? await verifyAccessJwt(request, env) : null;
        const actorUserId = identity?.email ? await userForIdentity(env, identity) : null;
        if (request.method === "GET") {
          const rows = await env.DB.prepare(`SELECT m.id, m.feedback_id AS feedbackId, m.kind, m.outcome, m.metadata_json AS metadata, m.created_at AS createdAt,
            f.type, f.status, f.priority, f.title, f.body, f.email, f.platform, f.created_at AS feedbackCreatedAt
            FROM moderation_events m JOIN feedback_items f ON f.id = m.feedback_id AND f.organization_id = m.organization_id AND f.project_id = m.project_id
            WHERE m.organization_id = ? AND m.project_id = ? AND m.outcome = 'pending' AND f.deleted_at IS NULL ORDER BY m.created_at ASC LIMIT 100`)
            .bind(context.organizationId, context.projectId).all<Record<string, unknown>>();
          return jsonResponse({ items: (rows.results ?? []).map((row) => ({ ...row, metadata: JSON.parse(String(row.metadata ?? "{}")) })) }, { headers: cors });
        }
        const body = await jsonBody(request);
        const feedbackId = typeof body.feedbackId === "string" ? body.feedbackId : "";
        const outcome = body.outcome === "approved" || body.outcome === "rejected" || body.outcome === "spam" ? body.outcome : "";
        if (!feedbackId || !outcome) return error("VALIDATION_ERROR", "feedbackId and a valid outcome are required", rid, 400);
        const event = await env.DB.prepare("SELECT id FROM moderation_events WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND outcome = 'pending' ORDER BY created_at ASC LIMIT 1").bind(feedbackId, context.organizationId, context.projectId).first<{ id: string }>();
        if (!event) return error("MODERATION_EVENT_NOT_FOUND", "The moderation event was not found", rid, 404);
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE moderation_events SET outcome = ?, metadata_json = ? WHERE id = ? AND organization_id = ? AND project_id = ?").bind(outcome, JSON.stringify({ actorUserId, requestId: rid }), event.id, context.organizationId, context.projectId),
          ...(outcome === "spam" ? [env.DB.prepare("UPDATE feedback_items SET status = 'spam', updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(now, feedbackId, context.organizationId, context.projectId)] : []),
          env.DB.prepare("INSERT INTO audit_logs (id, organization_id, project_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, 'feedback', ?, ?, ?)").bind(id(), context.organizationId, context.projectId, actorUserId, `moderation.${outcome}`, feedbackId, JSON.stringify({ requestId: rid }), now),
        ]);
        return jsonResponse({ feedbackId, outcome }, { headers: cors });
      }
      const auditMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/audit-logs$/);
      if (auditMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, auditMatch[1], rid, "audit:read");
        if (context instanceof Response) return context;
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
        const rows = await env.DB.prepare(`SELECT id, action, entity_type AS entityType, entity_id AS entityId, actor_user_id AS actorUserId, metadata_json AS metadata, created_at AS createdAt
          FROM audit_logs WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC LIMIT ?`)
          .bind(context.organizationId, context.projectId, limit).all<Record<string, unknown>>();
        return jsonResponse({ items: (rows.results ?? []).map((row) => ({ ...row, metadata: JSON.parse(String(row.metadata ?? "{}")) })) }, { headers: cors });
      }
      const dashboardListMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback$/);
      if (dashboardListMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(request, env, url, dashboardListMatch[1], rid, "feedback:read");
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(listFeedback(repo, context, url.searchParams.get("cursor") ?? undefined));
        return jsonResponse(result, { headers: cors });
      }
      const assignMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/assign$/);
      if (assignMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "feedback:write");
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const assigneeUserId = body.assigneeUserId === null || body.assigneeUserId === undefined || body.assigneeUserId === "" ? null : String(body.assigneeUserId);
        if (assigneeUserId) {
          const member = await env.DB.prepare("SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ?").bind(context.organizationId, assigneeUserId).first();
          if (!member) return error("ASSIGNEE_NOT_FOUND", "The assignee is not a member of this organization", rid, 400);
        }
        const now = new Date().toISOString();
        const updated = await env.DB.prepare("UPDATE feedback_items SET assigned_user_id = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(assigneeUserId, now, assignMatch[1], context.organizationId, context.projectId).run();
        if (!updated.meta.changes) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        await writeAudit(env, context, "feedback.assigned", "feedback", assignMatch[1], { assigneeUserId });
        const feedback = await env.DB.prepare("SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ?").bind(assignMatch[1], context.organizationId, context.projectId).first<Record<string, unknown>>();
        return feedback ? jsonResponse(fromRow(feedback), { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
      }
      const mergeMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/merge$/);
      if (mergeMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "feedback:write");
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const targetFeedbackId = typeof body.targetFeedbackId === "string" ? body.targetFeedbackId : "";
        if (!targetFeedbackId || targetFeedbackId === mergeMatch[1]) return error("VALIDATION_ERROR", "A different targetFeedbackId is required", rid, 400);
        const [source, target] = await Promise.all([
          env.DB.prepare("SELECT id, status FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(mergeMatch[1], context.organizationId, context.projectId).first<{ id: string; status: string }>(),
          env.DB.prepare("SELECT id, status FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(targetFeedbackId, context.organizationId, context.projectId).first<{ id: string; status: string }>(),
        ]);
        if (!source || !target) return error("FEEDBACK_NOT_FOUND", "Source or target feedback was not found", rid, 404);
        if (target.status === "spam") return error("INVALID_MERGE_TARGET", "Spam feedback cannot be a merge target", rid, 400);
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE feedback_items SET status = 'closed', merged_into_id = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(targetFeedbackId, now, mergeMatch[1], context.organizationId, context.projectId),
          env.DB.prepare("INSERT INTO feedback_status_history (id, organization_id, project_id, feedback_id, from_status, to_status, created_at) VALUES (?, ?, ?, ?, ?, 'closed', ?)").bind(id(), context.organizationId, context.projectId, mergeMatch[1], source.status, now),
        ]);
        await writeAudit(env, context, "feedback.merged", "feedback", mergeMatch[1], { targetFeedbackId });
        return jsonResponse({ sourceFeedbackId: mergeMatch[1], targetFeedbackId, status: "closed" }, { headers: cors });
      }
      const dashboardFeedbackMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)$/);
      if (dashboardFeedbackMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "feedback:read");
        if (context instanceof Response) return context;
        const feedback = await env.DB.prepare("SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(dashboardFeedbackMatch[1], context.organizationId, context.projectId).first<Record<string, unknown>>();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        const [comments, history, tags] = await Promise.all([
          env.DB.prepare("SELECT id, feedback_id AS feedbackId, body, author_user_id AS authorUserId, is_internal AS isInternal, created_at AS createdAt FROM feedback_comments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC").bind(dashboardFeedbackMatch[1], context.organizationId, context.projectId).all(),
          env.DB.prepare("SELECT id, from_status AS fromStatus, to_status AS toStatus, actor_user_id AS actorUserId, created_at AS createdAt FROM feedback_status_history WHERE feedback_id = ? AND organization_id = ? AND project_id = ? ORDER BY created_at ASC").bind(dashboardFeedbackMatch[1], context.organizationId, context.projectId).all(),
          env.DB.prepare("SELECT t.id, t.name, t.slug FROM feedback_tags t JOIN feedback_tag_links l ON l.tag_id = t.id WHERE l.feedback_id = ? AND t.organization_id = ? AND t.project_id = ? ORDER BY t.name ASC").bind(dashboardFeedbackMatch[1], context.organizationId, context.projectId).all(),
        ]);
        return jsonResponse({ feedback: fromRow(feedback), comments: comments.results ?? [], statusHistory: history.results ?? [], tags: tags.results ?? [] }, { headers: cors });
      }
      const replyMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/reply$/);
      if (replyMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "feedback:reply");
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 10_000) return error("VALIDATION_ERROR", "Reply must be 1-10000 characters", rid, 400);
        const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(replyMatch[1], context.organizationId, context.projectId).first();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        const internal = body.internal === true;
        const comment = { id: id(), feedbackId: replyMatch[1], body: body.body.trim(), isInternal: internal, createdAt: new Date().toISOString() };
        await env.DB.prepare("INSERT INTO feedback_comments (id, organization_id, project_id, feedback_id, body, is_internal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(comment.id, context.organizationId, context.projectId, comment.feedbackId, comment.body, internal ? 1 : 0, comment.createdAt).run();
        await writeAudit(env, context, internal ? "feedback.internal_note.created" : "feedback.reply.created", "feedback", replyMatch[1]);
        if (!internal) {
          recordMetric(env, "feedback.replied", context.organizationId, context.projectId, [1]);
          const eventId = id();
          ctx.waitUntil(enqueueWebhookDeliveries(env, context.projectId, replyMatch[1], "feedback.replied", eventId));
          ctx.waitUntil(enqueueWatcherEmails(env, replyMatch[1], "New reply to your NitroPing feedback", "Your feedback received a new reply. Open your NitroPing follow-up link to read it.", "<p>Your feedback received a new reply.</p><p>Open your NitroPing follow-up link to read it.</p>"));
          if (env.EVENT_STREAM) ctx.waitUntil(env.EVENT_STREAM.getByName(context.projectId).publish({ type: "feedback.replied", feedbackId: replyMatch[1], projectId: context.projectId, createdAt: comment.createdAt }));
        }
        return jsonResponse(comment, { status: 201, headers: cors });
      }
      const statusMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/status$/);
      if (statusMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const body = await request.json() as { status?: FeedbackStatus };
        if (!body.status || !feedbackStatuses.includes(body.status)) return error("VALIDATION_ERROR", "Invalid status", rid, 400);
        const projectId = url.searchParams.get("projectId");
        if (!projectId) return error("PROJECT_ID_REQUIRED", "projectId is required", rid, 400);
        const context = await requireDashboardProject(request, env, url, projectId, rid, "feedback:write");
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(changeFeedbackStatus(repo, context, statusMatch[1], body.status));
        if (!result) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        await writeAudit(env, context, "feedback.status.updated", "feedback", result.id, { status: result.status });
        recordMetric(env, "feedback.updated", context.organizationId, context.projectId, [1]);
        const eventId = id();
        ctx.waitUntil(enqueueWebhookDeliveries(env, context.projectId, result.id, "feedback.updated", eventId));
        ctx.waitUntil(enqueueWatcherEmails(env, result.id, "Your NitroPing feedback was updated", `The status of your feedback changed to ${result.status}.`, `<p>The status of your feedback changed to <strong>${result.status}</strong>.</p>`));
        if (env.EVENT_STREAM) ctx.waitUntil(env.EVENT_STREAM.getByName(context.projectId).publish({ type: "feedback.updated", feedbackId: result.id, projectId: context.projectId, createdAt: result.updatedAt }));
        return jsonResponse(result, { headers: cors });
      }
      if (env.ASSETS) {
        if (path === "/dashboard" || path === "/dashboard/") return env.ASSETS.fetch(new Request(new URL("/dashboard.html", request.url), request));
        if (path === "/portal" || path === "/portal/") return env.ASSETS.fetch(new Request(new URL("/portal.html", request.url), request));
        return env.ASSETS.fetch(request);
      }
      return error("NOT_FOUND", "Endpoint was not found", rid, 404);
    } catch (cause) {
      return error("INTERNAL_ERROR", "An unexpected error occurred", rid, 500, String(env.ENVIRONMENT) === "development" ? String(cause) : undefined);
    }
  },
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body as { type?: string; eventId?: string; sourceEventId?: string; feedbackId?: string; webhookId?: string; deliveryId?: string; eventType?: WebhookEventType; organizationId?: string; projectId?: string; email?: string; subject?: string; text?: string; html?: string; token?: string };
      if (event.eventId) {
        const seen = await env.DB.prepare("SELECT event_id FROM processed_events WHERE event_id = ?").bind(event.eventId).first();
        if (seen) { message.ack(); continue; }
      }
      if (event.type === "webhook.deliver" && event.deliveryId && event.webhookId && event.sourceEventId && event.eventType && event.feedbackId && event.projectId) {
        const delivered = await deliverWebhook(env, { deliveryId: event.deliveryId, webhookId: event.webhookId, sourceEventId: event.sourceEventId, eventType: event.eventType, feedbackId: event.feedbackId, projectId: event.projectId });
        if (!delivered) { message.retry({ delaySeconds: Math.min(900, 10 * 2 ** message.attempts) }); continue; }
      }
      if (event.type === "follow-up.requested" && event.email && event.token) {
        if (event.organizationId && await env.DB.prepare("SELECT 1 FROM organizations WHERE id = ? AND deleted_at IS NULL").bind(event.organizationId).first() === null) { message.ack(); continue; }
        try {
          const link = `${env.PUBLIC_APP_URL}/api/v1/follow-up/${event.token}`;
          await sendTransactionalEmail(env, { email: event.email, subject: "Track your NitroPing feedback", text: `Your feedback was received. Follow this link to track updates: ${link}`, html: `<p>Your feedback was received.</p><p><a href="${link}">Track your feedback</a></p>` });
        } catch { message.retry({ delaySeconds: Math.min(900, 10 * 2 ** message.attempts) }); continue; }
      }
      if (event.type === "email.send" && event.email && event.subject && event.text && event.html) {
        if (event.organizationId && await env.DB.prepare("SELECT 1 FROM organizations WHERE id = ? AND deleted_at IS NULL").bind(event.organizationId).first() === null) { message.ack(); continue; }
        try { await sendTransactionalEmail(env, { email: event.email, subject: event.subject, text: event.text, html: event.html }); }
        catch { message.retry({ delaySeconds: Math.min(900, 10 * 2 ** message.attempts) }); continue; }
      }
      if (event.type === "attachment.delete" && typeof (event as { objectKey?: unknown }).objectKey === "string") {
        await env.ATTACHMENTS.delete((event as { objectKey: string }).objectKey);
      }
      if (event.type === "feedback.created" && event.feedbackId && event.projectId) {
        await env.DB.prepare("INSERT INTO moderation_events (id, organization_id, project_id, feedback_id, kind, outcome, metadata_json, created_at) SELECT ?, organization_id, project_id, id, 'automated', 'pending', ?, ? FROM feedback_items WHERE id = ? AND project_id = ?")
          .bind(id(), "{}", new Date().toISOString(), event.feedbackId, event.projectId).run();
      }
      if (event.eventId) await env.DB.prepare("INSERT OR IGNORE INTO processed_events (event_id, event_type, processed_at) VALUES (?, ?, ?)").bind(event.eventId, event.type ?? "unknown", new Date().toISOString()).run();
      message.ack();
    }
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const candidates = await env.DB.prepare("SELECT f.id, f.organization_id AS organizationId, f.project_id AS projectId FROM feedback_items f JOIN project_settings s ON s.project_id = f.project_id WHERE f.deleted_at IS NULL AND datetime(f.created_at) < datetime('now', '-' || s.retention_days || ' days') LIMIT 100").all<{ id: string; organizationId: string; projectId: string }>();
    for (const feedback of candidates.results ?? []) {
      const attachments = await env.DB.prepare("SELECT object_key AS objectKey FROM attachments WHERE feedback_id = ? AND project_id = ? AND deleted_at IS NULL").bind(feedback.id, feedback.projectId).all<{ objectKey: string }>();
      for (const attachment of attachments.results ?? []) await env.EVENTS.send({ type: "attachment.delete", objectKey: attachment.objectKey, eventId: id(), projectId: feedback.projectId });
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare("UPDATE feedback_items SET email = NULL, body = '[retained data removed]', metadata_json = '{}', deleted_at = ?, updated_at = ? WHERE id = ? AND project_id = ?").bind(now, now, feedback.id, feedback.projectId),
        env.DB.prepare("UPDATE attachments SET deleted_at = ? WHERE feedback_id = ? AND project_id = ?").bind(now, feedback.id, feedback.projectId),
        env.DB.prepare("INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'delete', 'completed', ?, ?)").bind(id(), feedback.organizationId, feedback.projectId, now, now),
      ]);
    }
  },
};
