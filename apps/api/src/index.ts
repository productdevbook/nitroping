import { Effect } from "effect";
import { feedbackStatuses, feedbackTypes, jsonResponse, type CreateFeedbackInput, type Feedback, type FeedbackStatus } from "@nitroping/contracts";
import { changeFeedbackStatus, createFeedback, getFeedback, listFeedback, type FeedbackRepository, type TenantContext } from "./services";

export interface Env {
  DB: D1Database;
  ATTACHMENTS: R2Bucket;
  CACHE: KVNamespace;
  EVENTS?: Queue;
  ENVIRONMENT: string;
}

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
        const result = await Effect.runPromise(createFeedback(repo, contextFrom(url), input, rid));
        if (env.EVENTS) await env.EVENTS.send({ type: "feedback.created", feedbackId: result.id, projectId: result.projectId, eventId: id() });
        return jsonResponse(result, { status: 201, headers: cors });
      }
      if (match && request.method === "GET" && match[2]) {
        const result = await Effect.runPromise(getFeedback(repo, contextFrom(url), match[2]));
        return result ? jsonResponse(result, { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback bulunamadı", rid, 404);
      }
      if (match && request.method === "GET" && !match[2]) {
        const result = await Effect.runPromise(listFeedback(repo, contextFrom(url), url.searchParams.get("cursor") ?? undefined));
        return jsonResponse(result, { headers: cors });
      }
      const statusMatch = path.match(/^\/api\/v1\/dashboard\/feedback\/([^/]+)\/status$/);
      if (statusMatch && request.method === "POST") {
        const body = await request.json() as { status?: FeedbackStatus };
        if (!body.status || !feedbackStatuses.includes(body.status)) return error("VALIDATION_ERROR", "Geçersiz status", rid, 400);
        const result = await Effect.runPromise(changeFeedbackStatus(repo, contextFrom(url), statusMatch[1], body.status));
        return result ? jsonResponse(result, { headers: cors }) : error("FEEDBACK_NOT_FOUND", "Feedback bulunamadı", rid, 404);
      }
      return error("NOT_FOUND", "Endpoint bulunamadı", rid, 404);
    } catch (cause) {
      return error("INTERNAL_ERROR", "Beklenmeyen bir hata oluştu", rid, 500, env.ENVIRONMENT === "development" ? String(cause) : undefined);
    }
  },
};
