import { Effect } from "effect";
import { feedbackStatuses, feedbackTypes, jsonResponse, type CreateFeedbackInput, type Feedback, type FeedbackStatus } from "@nitroping/contracts";
import { changeFeedbackStatus, createFeedback, getFeedback, listFeedback, type FeedbackRepository, type TenantContext } from "./services";
import { clientIp, randomToken, sha256 } from "./security";

const id = () => crypto.randomUUID();
const requestId = (request: Request) => request.headers.get("x-request-id") ?? `req_${id()}`;
const error = (code: string, message: string, requestId: string, status: number, details?: unknown) =>
  jsonResponse({ error: { code, message, requestId, details } }, { status, headers: { "x-request-id": requestId } });

const validateInput = (body: unknown): CreateFeedbackInput | string => {
  if (!body || typeof body !== "object") return "Body JSON olmalıdır";
  const input = body as Record<string, unknown>;
  if (!feedbackTypes.includes(input.type as never)) return "Geçersiz feedback type";
  if (typeof input.title !== "string" || input.title.trim().length < 3 || input.title.length > 160) return "title 3-160 karakter olmalıdır";
  if (typeof input.body !== "string" || input.body.trim().length < 3 || input.body.length > 20_000) return "body 3-20000 karakter olmalıdır";
  if (input.email !== undefined && (typeof input.email !== "string" || input.email.length > 320)) return "Geçersiz email";
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
  if (!projectKey) return error("PROJECT_KEY_REQUIRED", "Project key gereklidir", rid, 401);
  const project = await env.DB.prepare("SELECT organization_id, id FROM projects WHERE public_key = ? AND deleted_at IS NULL").bind(projectKey).first<{ organization_id: string; id: string }>();
  return project ? { organizationId: project.organization_id, projectId: project.id } : error("INVALID_PROJECT_KEY", "Geçersiz project key", rid, 401);
};

const requireServerKey = async (request: Request, env: Env, context: TenantContext, rid: string): Promise<Response | null> => {
  const key = request.headers.get("x-nitroping-server-key");
  if (!key) return error("SERVER_KEY_REQUIRED", "Server key gereklidir", rid, 401);
  const hash = await sha256(key);
  const found = await env.DB.prepare("SELECT id FROM project_api_keys WHERE project_id = ? AND organization_id = ? AND kind = 'server' AND key_hash = ? AND revoked_at IS NULL").bind(context.projectId, context.organizationId, hash).first();
  return found ? null : error("INVALID_SERVER_KEY", "Geçersiz server key", rid, 403);
};

const jsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body = await request.json();
  return body && typeof body === "object" ? body as Record<string, unknown> : {};
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const rid = requestId(request);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, x-request-id, authorization, idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS", "x-request-id": rid };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (path === "/health") return jsonResponse({ ok: true, environment: env.ENVIRONMENT, requestId: rid }, { headers: cors });
    try {
      const repo = repository(env);
      const match = path.match(/^\/api\/v1\/projects\/([^/]+)\/feedback(?:\/([^/]+))?$/);
      if (match && request.method === "POST" && !match[2]) {
        const input = validateInput(await request.json());
        if (typeof input === "string") return error("VALIDATION_ERROR", input, rid, 400);
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(createFeedback(repo, context, input, rid));
        if (env.EVENTS) await env.EVENTS.send({ type: "feedback.created", feedbackId: result.id, projectId: result.projectId, eventId: id() });
        return jsonResponse(result, { status: 201, headers: cors });
      }
      if (match && request.method === "GET" && match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(getFeedback(repo, context, match[2]));
        return result ? jsonResponse(result, { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback bulunamadı", rid, 404);
      }
      if (match && request.method === "GET" && !match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(listFeedback(repo, context, url.searchParams.get("cursor") ?? undefined));
        return jsonResponse(result, { headers: cors });
      }
      const commentMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/feedback\/([^/]+)\/comments$/);
      if (commentMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 10_000) return error("VALIDATION_ERROR", "Yorum 1-10000 karakter olmalıdır", rid, 400);
        const feedback = await env.DB.prepare("SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL").bind(commentMatch[2], context.organizationId, context.projectId).first();
        if (!feedback) return error("FEEDBACK_NOT_FOUND", "Feedback bulunamadı", rid, 404);
        const comment = { id: id(), feedbackId: commentMatch[2], body: body.body.trim(), createdAt: new Date().toISOString() };
        await env.DB.prepare("INSERT INTO feedback_comments (id, organization_id, project_id, feedback_id, body, is_internal, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)").bind(comment.id, context.organizationId, context.projectId, comment.feedbackId, comment.body, comment.createdAt).run();
        return jsonResponse(comment, { status: 201, headers: cors });
      }
      const voteMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/feedback\/([^/]+)\/vote$/);
      if (voteMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const voter = await sha256(`${clientIp(request)}:${request.headers.get("user-agent") ?? ""}`);
        await env.DB.prepare("INSERT OR IGNORE INTO feedback_votes (feedback_id, voter_fingerprint, created_at) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL)").bind(voteMatch[2], voter, new Date().toISOString(), voteMatch[2], context.organizationId, context.projectId).run();
        const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM feedback_votes WHERE feedback_id = ?").bind(voteMatch[2]).first<{ count: number }>();
        return jsonResponse({ feedbackId: voteMatch[2], votes: Number(count?.count ?? 0) }, { headers: cors });
      }
      const uploadMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/uploads\/initiate$/);
      if (uploadMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
        const size = Number(body.size ?? 0);
        if (!Number.isFinite(size) || size < 1 || size > 10 * 1024 * 1024) return error("ATTACHMENT_TOO_LARGE", "Attachment 10 MB sınırını aşamaz", rid, 413);
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
        if (!raw) return error("UPLOAD_EXPIRED", "Upload token geçersiz veya süresi dolmuş", rid, 404);
        const body = request.body;
        if (!body) return error("EMPTY_UPLOAD", "Dosya gövdesi boş", rid, 400);
        await env.ATTACHMENTS.put(raw.objectKey, body, { httpMetadata: { contentType: raw.contentType } });
        await env.DB.prepare("INSERT INTO attachments (id, organization_id, project_id, feedback_id, object_key, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(raw.attachmentId, raw.organizationId, raw.projectId, "unlinked", raw.objectKey, raw.contentType, raw.size, new Date().toISOString()).run();
        await env.CACHE.delete(`upload:${uploadPut[1]}`);
        return jsonResponse({ attachmentId: raw.attachmentId, objectKey: raw.objectKey }, { status: 201, headers: cors });
      }
      const followUpMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/follow-up\/request$/);
      if (followUpMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        if (typeof body.feedbackId !== "string" || typeof body.email !== "string") return error("VALIDATION_ERROR", "feedbackId ve email gereklidir", rid, 400);
        const token = randomToken("follow");
        await env.CACHE.put(`follow:${token}`, JSON.stringify({ feedbackId: body.feedbackId, ...context, email: body.email }), { expirationTtl: 86_400 });
        await env.DB.prepare("INSERT OR IGNORE INTO feedback_watchers (feedback_id, email, created_at) VALUES (?, ?, ?)").bind(body.feedbackId, body.email.toLowerCase(), new Date().toISOString()).run();
        if (env.EVENTS) await env.EVENTS.send({ type: "follow-up.requested", token, email: body.email, feedbackId: body.feedbackId, projectId: context.projectId, eventId: id() });
        return jsonResponse({ accepted: true }, { status: 202, headers: cors });
      }
      const statusMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/status$/);
      if (statusMatch && request.method === "POST") {
        const body = await request.json() as { status?: FeedbackStatus };
        if (!body.status || !feedbackStatuses.includes(body.status)) return error("VALIDATION_ERROR", "Geçersiz status", rid, 400);
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const authError = await requireServerKey(request, env, context, rid);
        if (authError) return authError;
        const result = await Effect.runPromise(changeFeedbackStatus(repo, context, statusMatch[1], body.status));
        return result ? jsonResponse(result, { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback bulunamadı", rid, 404);
      }
      return error("NOT_FOUND", "Endpoint bulunamadı", rid, 404);
    } catch (cause) {
      return error("INTERNAL_ERROR", "Beklenmeyen bir hata oluştu", rid, 500, String(env.ENVIRONMENT) === "development" ? String(cause) : undefined);
    }
  },
};
