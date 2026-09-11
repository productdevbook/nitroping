import { Effect } from "effect";
import { feedbackPriorities, feedbackStatuses, feedbackTypes, jsonResponse, platforms, type CreateFeedbackInput, type Feedback, type FeedbackStatus } from "@nitroping/contracts";
import { changeFeedbackStatus, createFeedback, getFeedback, listFeedback, type FeedbackRepository, type TenantContext } from "./services";
import { clientIp, randomToken, sha256 } from "./security";
import { type AccessClaims, verifyAccessJwt } from "./access";
import { ProjectEventStream } from "./events";

export { ProjectEventStream };

const id = () => crypto.randomUUID();
const requestId = (request: Request) => request.headers.get("x-request-id") ?? `req_${id()}`;
const error = (code: string, message: string, requestId: string, status: number, details?: unknown) =>
  jsonResponse({ error: { code, message, requestId, details } }, { status, headers: { "x-request-id": requestId } });

const validateInput = (body: unknown): CreateFeedbackInput | string => {
  if (!body || typeof body !== "object") return "Body must be valid JSON";
  const input = body as Record<string, unknown>;
  if (!feedbackTypes.includes(input.type as never)) return "Invalid feedback type";
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.length > 160) return "Title must be 3-160 characters";
  if (typeof input.body !== "string" || input.body.trim().length < 3 || input.body.length > 20_000) return "Body must be 3-20000 characters";
  if (input.email !== undefined && (typeof input.email !== "string" || input.email.length > 320)) return "Invalid email";
  if (input.priority !== undefined && !feedbackPriorities.includes(input.priority as never)) return "Invalid priority";
  if (input.platform !== undefined && !platforms.includes(input.platform as never)) return "Invalid platform";
  if (input.metadata !== undefined && (!input.metadata || typeof input.metadata !== "object" || Array.isArray(input.metadata))) return "Invalid metadata";
  if (input.metadata && Object.keys(input.metadata as object).length > 30) return "A maximum of 30 metadata fields is allowed";
  if (input.metadata && Object.values(input.metadata as Record<string, unknown>).some((value) => !["string", "number", "boolean"].includes(typeof value))) return "Metadata may only contain primitive values";
  return {
    type: input.type as CreateFeedbackInput["type"], title: input.title.trim(), body: input.body.trim(),
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
    await env.DB.prepare(`INSERT INTO feedback_items (id, organization_id, project_id, type, status, priority, title, body, email, platform, app_version, os_version, locale, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(feedbackId, context.organizationId, context.projectId, input.type, input.priority ?? "normal", input.title, input.body, input.email ?? null, input.platform ?? null, input.appVersion ?? null, input.osVersion ?? null, input.locale ?? null, JSON.stringify(input.metadata ?? {}), now, now).run();
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
    const now = new Date().toISOString();
    const result = await env.DB.prepare(`UPDATE feedback_items SET status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL`).bind(status, now, feedbackId, context.organizationId, context.projectId).run();
    if (!result.meta.changes) return null;
    return this.get(context, feedbackId);
  },
});

const fromRow = (row: Record<string, unknown>): Feedback => ({
  id: String(row.id), organizationId: String(row.organization_id), projectId: String(row.project_id), type: row.type as Feedback["type"], status: row.status as Feedback["status"], priority: row.priority as Feedback["priority"], title: String(row.title), body: String(row.body),
  ...(row.email ? { email: String(row.email) } : {}), ...(row.platform ? { platform: row.platform as Feedback["platform"] } : {}),
  ...(row.app_version ? { appVersion: String(row.app_version) } : {}), ...(row.os_version ? { osVersion: String(row.os_version) } : {}), ...(row.locale ? { locale: String(row.locale) } : {}),
  metadata: JSON.parse(String(row.metadata_json ?? "{}")), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});

const contextFrom = (url: URL): TenantContext => ({ organizationId: url.searchParams.get("organizationId") ?? "demo-org", projectId: url.searchParams.get("projectId") ?? url.pathname.split("/")[3] ?? "demo-project" });

const projectFromRequest = async (request: Request, env: Env, url: URL, rid: string): Promise<TenantContext | Response> => {
  const projectKey = request.headers.get("x-nitroping-project-key") ?? url.searchParams.get("projectKey");
  if (!projectKey && String(env.ENVIRONMENT) !== "production") return contextFrom(url);
  if (!projectKey) return error("PROJECT_KEY_REQUIRED", "Project key is required", rid, 401);
  const project = await env.DB.prepare("SELECT organization_id, id FROM projects WHERE public_key = ? AND deleted_at IS NULL").bind(projectKey).first<{ organization_id: string; id: string }>();
  return project ? { organizationId: project.organization_id, projectId: project.id } : error("INVALID_PROJECT_KEY", "Invalid project key", rid, 401);
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
  context.projectId === projectId ? null : error("PROJECT_SCOPE_MISMATCH", "The project key does not belong to this project", rid, 403);

const allowedMetadata = async (env: Env, context: TenantContext, input: CreateFeedbackInput, rid: string): Promise<Response | null> => {
  const settings = await env.DB.prepare("SELECT allowed_metadata_json FROM project_settings WHERE project_id = ?").bind(context.projectId).first<{ allowed_metadata_json: string }>();
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const rid = requestId(request);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    const cors = requestHeaders(rid, request.headers.get("origin") ?? "*");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (path === "/health") return jsonResponse({ ok: true, environment: env.ENVIRONMENT, requestId: rid }, { headers: cors });
    try {
      const repo = repository(env);
      const organizationsPath = path === "/api/v1/dashboard/organizations";
      if (organizationsPath && (request.method === "GET" || request.method === "POST")) {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        if (request.method === "GET") {
          const rows = await env.DB.prepare("SELECT o.id, o.name, o.slug, m.role, o.created_at AS createdAt FROM organizations o JOIN organization_members m ON m.organization_id = o.id WHERE m.user_id = ? AND o.deleted_at IS NULL ORDER BY o.created_at ASC").bind(userId).all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
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
        return jsonResponse({ id: organizationId, name, slug, role: "owner", createdAt: now }, { status: 201, headers: cors });
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
        const projectId = id(); const publicKey = randomToken("pk_live"); const serverKey = randomToken("sk_live"); const now = new Date().toISOString();
        try {
          await env.DB.batch([
            env.DB.prepare("INSERT INTO projects (id, organization_id, name, slug, public_key, server_key_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(projectId, projectCreateMatch[1], name, slug, publicKey, await sha256(serverKey), now, now),
            env.DB.prepare("INSERT INTO project_settings (project_id) VALUES (?)").bind(projectId),
            env.DB.prepare("INSERT INTO project_api_keys (id, organization_id, project_id, kind, label, key_prefix, key_hash, created_at) VALUES (?, ?, ?, 'public', 'default public key', ?, ?, ?), (?, ?, ?, 'server', 'default server key', ?, ?, ?)").bind(id(), projectCreateMatch[1], projectId, publicKey.slice(0, 12), await sha256(publicKey), now, id(), projectCreateMatch[1], projectId, serverKey.slice(0, 12), await sha256(serverKey), now),
          ]);
        } catch { return error("PROJECT_SLUG_TAKEN", "Project slug is already in use", rid, 409); }
        return jsonResponse({ id: projectId, organizationId: projectCreateMatch[1], name, slug, publicKey, serverKey, createdAt: now }, { status: 201, headers: cors });
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
        const idem = request.headers.get("idempotency-key");
        if (idem) {
          if (idem.length > 128) return error("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key is too long", rid, 400);
          const previous = await env.DB.prepare("SELECT response_json, status_code FROM idempotency_keys WHERE project_id = ? AND key = ?").bind(context.projectId, idem).first<{ response_json: string; status_code: number }>();
          if (previous) return new Response(previous.response_json, { status: previous.status_code, headers: cors });
        }
        const result = await Effect.runPromise(createFeedback(repo, context, input, rid));
        if (idem) await env.DB.prepare("INSERT OR IGNORE INTO idempotency_keys (organization_id, project_id, key, response_json, status_code, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(context.organizationId, context.projectId, idem, JSON.stringify(result), 201, result.createdAt).run();
        if (env.EVENTS) await env.EVENTS.send({ type: "feedback.created", feedbackId: result.id, projectId: result.projectId, eventId: id() });
        if (env.EVENT_STREAM) ctx.waitUntil(env.EVENT_STREAM.getByName(result.projectId).publish({ type: "feedback.created", feedbackId: result.id, projectId: result.projectId, createdAt: result.createdAt }));
        return jsonResponse(result, { status: 201, headers: cors });
      }
      if (match && request.method === "GET" && match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        const result = await Effect.runPromise(getFeedback(repo, context, match[2]));
        return result ? jsonResponse(result, { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
      }
      if (match && request.method === "GET" && !match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        const result = await Effect.runPromise(listFeedback(repo, context, url.searchParams.get("cursor") ?? undefined));
        return jsonResponse(result, { headers: cors });
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
        const body = await jsonBody(request);
        if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 10_000) return error("VALIDATION_ERROR", "Comment must be 1-10000 characters", rid, 400);
        const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(commentMatch[2], context.organizationId, context.projectId).first();
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
        const voter = await sha256(`${clientIp(request)}:${request.headers.get("user-agent") ?? ""}`);
        await env.DB.prepare("INSERT OR IGNORE INTO feedback_votes (feedback_id, voter_fingerprint, created_at) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL)").bind(voteMatch[2], voter, new Date().toISOString(), voteMatch[2], context.organizationId, context.projectId).run();
        const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM feedback_votes WHERE feedback_id = ?").bind(voteMatch[2]).first<{ count: number }>();
        return jsonResponse({ feedbackId: voteMatch[2], votes: Number(count?.count ?? 0) }, { headers: cors });
      }
      const uploadMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/uploads\/initiate$/);
      if (uploadMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, uploadMatch[1], rid);
        if (scopeError) return scopeError;
        const body = await jsonBody(request);
        const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
        const size = Number(body.size ?? 0);
        if (!Number.isFinite(size) || size < 1 || size > 10 * 1024 * 1024) return error("ATTACHMENT_TOO_LARGE", "Attachments cannot exceed 10 MB", rid, 413);
        if (!/^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/.test(contentType)) return error("UNSUPPORTED_ATTACHMENT", "Desteklenmeyen dosya tipi", rid, 415);
        const token = randomToken("upl");
        const attachmentId = id();
        const objectKey = `${context.organizationId}/${context.projectId}/${attachmentId}`;
        await env.CACHE.put(`upload:${token}`, JSON.stringify({ attachmentId, objectKey, ...context, contentType, size }), { expirationTtl: 900 });
        return jsonResponse({ uploadToken: token, attachmentId, uploadUrl: `/api/v1/uploads/${token}`, expiresIn: 900 }, { status: 201, headers: cors });
      }
      const uploadPut = path.match(/^\/api\/v1\/uploads\/([^/]+)$/);
      if (uploadPut && request.method === "PUT") {
        const raw = await env.CACHE.get(`upload:${uploadPut[1]}`, "json") as { attachmentId: string; objectKey: string; organizationId: string; projectId: string; contentType: string; size: number } | null;
        if (!raw) return error("UPLOAD_EXPIRED", "The upload token is invalid or expired", rid, 404);
        const body = request.body;
        if (!body) return error("EMPTY_UPLOAD", "The upload body is empty", rid, 400);
        await env.ATTACHMENTS.put(raw.objectKey, body, { httpMetadata: { contentType: raw.contentType } });
        await env.DB.prepare("INSERT INTO attachments (id, organization_id, project_id, feedback_id, object_key, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(raw.attachmentId, raw.organizationId, raw.projectId, "unlinked", raw.objectKey, raw.contentType, raw.size, new Date().toISOString()).run();
        await env.CACHE.delete(`upload:${uploadPut[1]}`);
        return jsonResponse({ attachmentId: raw.attachmentId, objectKey: raw.objectKey }, { status: 201, headers: cors });
      }
      const followUpMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/follow-up\/request$/);
      if (followUpMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, followUpMatch[1], rid);
        if (scopeError) return scopeError;
        const body = await jsonBody(request);
        if (typeof body.feedbackId !== "string" || typeof body.email !== "string") return error("VALIDATION_ERROR", "feedbackId and email are required", rid, 400);
        const token = randomToken("follow");
        await env.CACHE.put(`follow:${token}`, JSON.stringify({ feedbackId: body.feedbackId, ...context, email: body.email }), { expirationTtl: 86_400 });
        await env.DB.prepare("INSERT OR IGNORE INTO feedback_watchers (feedback_id, email, created_at) VALUES (?, ?, ?)").bind(body.feedbackId, body.email.toLowerCase(), new Date().toISOString()).run();
        if (env.EVENTS) await env.EVENTS.send({ type: "follow-up.requested", token, email: body.email, feedbackId: body.feedbackId, projectId: context.projectId, eventId: id() });
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
        const context = await requireProjectServer(request, env, url, exportMatch[1], rid);
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
        const context = await requireProjectServer(request, env, url, anonymizeMatch[1], rid);
        if (context instanceof Response) return context;
        const now = new Date().toISOString();
        const result = await env.DB.prepare("UPDATE feedback_items SET email = NULL, body = '[anonymized]', metadata_json = '{}', updated_at = ?, deleted_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(now, now, anonymizeMatch[2], context.organizationId, context.projectId).run();
        if (!result.meta.changes) return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        await env.DB.batch([
          env.DB.prepare("UPDATE feedback_comments SET body = '[anonymized]', deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ?").bind(now, anonymizeMatch[2], context.organizationId, context.projectId),
          env.DB.prepare("INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'anonymize', 'completed', ?, ?)").bind(id(), context.organizationId, context.projectId, now, now),
        ]);
        return jsonResponse({ anonymized: true, feedbackId: anonymizeMatch[2] }, { headers: cors });
      }
      const dashboardListMatch = path.match(/^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback$/);
      if (dashboardListMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, dashboardListMatch[1], rid);
        if (scopeError) return scopeError;
        const authError = await requireServerKey(request, env, context, rid);
        if (authError) return authError;
        const result = await Effect.runPromise(listFeedback(repo, context, url.searchParams.get("cursor") ?? undefined));
        return jsonResponse(result, { headers: cors });
      }
      const statusMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/status$/);
      if (statusMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const body = await request.json() as { status?: FeedbackStatus };
        if (!body.status || !feedbackStatuses.includes(body.status)) return error("VALIDATION_ERROR", "Invalid status", rid, 400);
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const authError = await requireServerKey(request, env, context, rid);
        if (authError) return authError;
        const result = await Effect.runPromise(changeFeedbackStatus(repo, context, statusMatch[1], body.status));
        return result ? jsonResponse(result, { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
      }
      if (env.ASSETS) {
        if (path === "/dashboard" || path === "/dashboard/") return env.ASSETS.fetch(new Request(new URL("/dashboard.html", request.url), request));
        return env.ASSETS.fetch(request);
      }
      return error("NOT_FOUND", "Endpoint was not found", rid, 404);
    } catch (cause) {
      return error("INTERNAL_ERROR", "An unexpected error occurred", rid, 500, String(env.ENVIRONMENT) === "development" ? String(cause) : undefined);
    }
  },
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body as { type?: string; eventId?: string; feedbackId?: string; projectId?: string };
      if (event.eventId) {
        const seen = await env.DB.prepare("SELECT event_id FROM processed_events WHERE event_id = ?").bind(event.eventId).first();
        if (seen) { message.ack(); continue; }
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
