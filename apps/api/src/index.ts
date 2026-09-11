import { Effect } from "effect";
import {
  feedbackPriorities,
  feedbackStatuses,
  feedbackTypes,
  jsonResponse,
  platforms,
  type CreateFeedbackInput,
  type Feedback,
  type FeedbackStatus,
} from "@nitroping/contracts";
import {
  changeFeedbackStatus,
  createFeedback,
  getFeedback,
  listFeedback,
  type FeedbackListOptions,
  type FeedbackRepository,
  type TenantContext,
} from "./services";
import { clientIp, hmacSha256, randomToken, sha256 } from "./security";
import { type AccessClaims, verifyAccessJwt } from "./access";
import { verifyOidcJwt } from "./oidc";
import { ProjectEventStream } from "./events";
import { StripeBillingProvider, type BillingPlan } from "./billing";
import {
  verifyTurnstile,
  type TurnstileEnvironment,
} from "./turnstile";
import {
  CloudflareCustomHostnameProvider,
  validateCustomHostname,
} from "./custom-domains";
import { analyzeModeration } from "./moderation";
import { reviewWithWorkersAI } from "./ai-moderation";
import {
  deleteFeedbackEmbedding,
  queryFeedbackEmbeddings,
  upsertFeedbackEmbedding,
} from "./semantic-search";
import { attachmentSignatureMatches } from "./attachments";
import {
  entitlementsFor,
  hasEntitlement,
  normalizePlan,
  type EntitlementFeature,
} from "./entitlements";

export { ProjectEventStream };

const id = () => crypto.randomUUID();
const webhookEventTypes = [
  "feedback.created",
  "feedback.updated",
  "feedback.replied",
] as const;
type WebhookEventType = (typeof webhookEventTypes)[number];
const notificationEventTypes = [
  "feedback.created",
  "feedback.updated",
  "feedback.replied",
  "moderation.created",
] as const;
type CustomDomainEnvironment = Env & {
  CUSTOM_HOSTNAME_API_TOKEN?: string;
  CUSTOM_HOSTNAME_ZONE_ID?: string;
  CUSTOM_HOSTNAME_ZONE_NAME?: string;
  CUSTOM_HOSTNAME_FALLBACK_ORIGIN?: string;
};

const customDomainProvider = (
  env: Env,
): CloudflareCustomHostnameProvider | null => {
  const customEnv = env as CustomDomainEnvironment;
  if (
    !customEnv.CUSTOM_HOSTNAME_API_TOKEN ||
    !customEnv.CUSTOM_HOSTNAME_ZONE_ID ||
    !customEnv.CUSTOM_HOSTNAME_FALLBACK_ORIGIN
  )
    return null;
  return new CloudflareCustomHostnameProvider(
    customEnv.CUSTOM_HOSTNAME_API_TOKEN,
    customEnv.CUSTOM_HOSTNAME_ZONE_ID,
    customEnv.CUSTOM_HOSTNAME_FALLBACK_ORIGIN,
  );
};
export const requestId = (request: Request): string => {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied)
    ? supplied
    : `req_${id()}`;
};
const error = (
  code: string,
  message: string,
  requestId: string,
  status: number,
  details?: unknown,
) =>
  jsonResponse(
    { error: { code, message, requestId, details: details ?? {} } },
    { status, headers: { "x-request-id": requestId } },
  );
const htmlEscape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
export const isPrivateWebhookHost = (hostname: string): boolean => {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::" ||
    host === "::1"
  )
    return true;
  const isPrivateIpv4 = (ipv4: string[]): boolean => {
    if (ipv4.length !== 4 || !ipv4.every((part) => /^\d+$/.test(part)))
      return false;
    const [first, second] = ipv4.map(Number);
    if (first === 0 || first === 10 || first === 127 || first >= 224)
      return true;
    if (first === 100 && second >= 64 && second <= 127) return true;
    if (first === 169 && second === 254) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && (second === 0 || second === 168)) return true;
    if (first === 192 && second === 0) return true;
    if (first === 198 && (second === 18 || second === 19 || second === 51))
      return true;
    if (first === 203 && second === 0) return true;
    return false;
  };
  if (isPrivateIpv4(host.split("."))) return true;
  // URL normalizes IPv4-mapped IPv6 literals to hexadecimal, for example
  // ::ffff:127.0.0.1 becomes ::ffff:7f00:1. Treat the mapped address as
  // IPv4 before applying the private/reserved range policy.
  const mapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mapped) {
    const high = Number.parseInt(mapped[1], 16);
    const low = Number.parseInt(mapped[2], 16);
    if (isPrivateIpv4([
      String(high >> 8),
      String(high & 0xff),
      String(low >> 8),
      String(low & 0xff),
    ]))
      return true;
  }
  return /^(fc|fd)[0-9a-f]*:/i.test(host) || /^fe80:/i.test(host) || /^ff[0-9a-f]*:/i.test(host) || /^2001:db8:/i.test(host);
};

const validateInput = (body: unknown): CreateFeedbackInput | string => {
  if (!body || typeof body !== "object") return "Body must be valid JSON";
  const input = body as Record<string, unknown>;
  if (!feedbackTypes.includes(input.type as never))
    return "Invalid feedback type";
  if (
    typeof input.title !== "string" ||
    input.title.trim().length < 3 ||
    input.title.length > 160
  )
    return "Title must be 3-160 characters";
  if (
    typeof input.body !== "string" ||
    input.body.trim().length < 3 ||
    input.body.length > 20_000
  )
    return "Body must be 3-20000 characters";
  if (
    input.email !== undefined &&
    (typeof input.email !== "string" ||
      input.email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
  )
    return "Invalid email";
  if (
    input.priority !== undefined &&
    !feedbackPriorities.includes(input.priority as never)
  )
    return "Invalid priority";
  if (
    input.categoryId !== undefined &&
    (typeof input.categoryId !== "string" ||
      input.categoryId.length < 1 ||
      input.categoryId.length > 128)
  )
    return "Invalid categoryId";
  if (
    input.platform !== undefined &&
    !platforms.includes(input.platform as never)
  )
    return "Invalid platform";
  if (
    input.appVersion !== undefined &&
    (typeof input.appVersion !== "string" || input.appVersion.length > 128)
  )
    return "Invalid appVersion";
  if (
    input.osVersion !== undefined &&
    (typeof input.osVersion !== "string" || input.osVersion.length > 128)
  )
    return "Invalid osVersion";
  if (
    input.locale !== undefined &&
    (typeof input.locale !== "string" || input.locale.length > 32)
  )
    return "Invalid locale";
  if (
    input.metadata !== undefined &&
    (!input.metadata ||
      typeof input.metadata !== "object" ||
      Array.isArray(input.metadata))
  )
    return "Invalid metadata";
  if (input.metadata && Object.keys(input.metadata as object).length > 30)
    return "A maximum of 30 metadata fields is allowed";
  if (
    input.metadata &&
    Object.keys(input.metadata as object).some(
      (key) => !/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(key),
    )
  )
    return "Metadata field names are invalid";
  if (
    input.metadata &&
    Object.values(input.metadata as Record<string, unknown>).some(
      (value) => typeof value === "string" && value.length > 512,
    )
  )
    return "Metadata string values cannot exceed 512 characters";
  if (
    input.metadata &&
    Object.values(input.metadata as Record<string, unknown>).some(
      (value) => !["string", "number", "boolean"].includes(typeof value),
    )
  )
    return "Metadata may only contain primitive values";
  if (input.metadata && JSON.stringify(input.metadata).length > 8_192)
    return "Metadata cannot exceed 8 KB";
  return {
    type: input.type as CreateFeedbackInput["type"],
    title: input.title.trim(),
    body: input.body.trim(),
    categoryId: input.categoryId as string | undefined,
    priority: (input.priority as CreateFeedbackInput["priority"]) ?? "normal",
    email: input.email as string | undefined,
    platform: input.platform as CreateFeedbackInput["platform"],
    appVersion: input.appVersion as string | undefined,
    osVersion: input.osVersion as string | undefined,
    locale: input.locale as string | undefined,
    metadata: (input.metadata as CreateFeedbackInput["metadata"]) ?? {},
  };
};

const repository = (env: Env): FeedbackRepository => ({
  async create(context, input, rid) {
    const feedbackId = id();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO feedback_items (id, organization_id, project_id, category_id, type, status, priority, title, body, email, platform, app_version, os_version, locale, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        feedbackId,
        context.organizationId,
        context.projectId,
        input.categoryId ?? null,
        input.type,
        input.priority ?? "normal",
        input.title,
        input.body,
        input.email ?? null,
        input.platform ?? null,
        input.appVersion ?? null,
        input.osVersion ?? null,
        input.locale ?? null,
        JSON.stringify(input.metadata ?? {}),
        now,
        now,
      )
      .run();
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, organization_id, project_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, 'feedback.created', 'feedback', ?, ?, ?)`,
    )
      .bind(
        id(),
        context.organizationId,
        context.projectId,
        feedbackId,
        JSON.stringify({ requestId: rid }),
        now,
      )
      .run();
    return {
      id: feedbackId,
      organizationId: context.organizationId,
      projectId: context.projectId,
      ...input,
      status: "new",
      priority: input.priority ?? "normal",
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    } as Feedback;
  },
  async get(context, feedbackId) {
    const row = await env.DB.prepare(
      `SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL`,
    )
      .bind(feedbackId, context.organizationId, context.projectId)
      .first<Record<string, unknown>>();
    return row ? fromRow(row) : null;
  },
  async list(context, options: FeedbackListOptions = {}) {
    const limit = Math.min(100, Math.max(1, Number(options.limit ?? 25)));
    const conditions = [
      "organization_id = ?",
      "project_id = ?",
      "deleted_at IS NULL",
    ];
    const bindings: unknown[] = [context.organizationId, context.projectId];
    if (options.cursor) {
      conditions.push("created_at < ?");
      bindings.push(options.cursor);
    }
    if (options.query) {
      conditions.push("(title LIKE ? OR body LIKE ?)");
      const query = `%${options.query.slice(0, 120)}%`;
      bindings.push(query, query);
    }
    if (options.status) {
      conditions.push("status = ?");
      bindings.push(options.status);
    }
    if (options.type) {
      conditions.push("type = ?");
      bindings.push(options.type);
    }
    if (options.priority) {
      conditions.push("priority = ?");
      bindings.push(options.priority);
    }
    bindings.push(limit + 1);
    const statement = env.DB.prepare(
      `SELECT * FROM feedback_items WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT ?`,
    ).bind(...bindings);
    const result = await statement.all<Record<string, unknown>>();
    const rows = result.results ?? [];
    const hasNext = rows.length > limit;
    const items = rows.slice(0, limit).map(fromRow);
    return {
      items,
      ...(hasNext && items.length
        ? { nextCursor: items[items.length - 1].createdAt }
        : {}),
    };
  },
  async updateStatus(context, feedbackId, status) {
    const previous = await env.DB.prepare(
      "SELECT status FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
    )
      .bind(feedbackId, context.organizationId, context.projectId)
      .first<{ status: string }>();
    if (!previous) return null;
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `UPDATE feedback_items SET status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL`,
    )
      .bind(status, now, feedbackId, context.organizationId, context.projectId)
      .run();
    if (!result.meta.changes) return null;
    if (previous.status !== status)
      await env.DB.prepare(
        "INSERT INTO feedback_status_history (id, organization_id, project_id, feedback_id, from_status, to_status, actor_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          id(),
          context.organizationId,
          context.projectId,
          feedbackId,
          previous.status,
          status,
          context.actorUserId ?? null,
          now,
        )
        .run();
    return this.get(context, feedbackId);
  },
});

const fromRow = (row: Record<string, unknown>): Feedback => ({
  id: String(row.id),
  organizationId: String(row.organization_id),
  projectId: String(row.project_id),
  ...(row.category_id ? { categoryId: String(row.category_id) } : {}),
  ...(row.assigned_user_id
    ? { assignedUserId: String(row.assigned_user_id) }
    : {}),
  ...(row.merged_into_id ? { mergedIntoId: String(row.merged_into_id) } : {}),
  type: row.type as Feedback["type"],
  status: row.status as Feedback["status"],
  priority: row.priority as Feedback["priority"],
  title: String(row.title),
  body: String(row.body),
  ...(row.email ? { email: String(row.email) } : {}),
  ...(row.platform ? { platform: row.platform as Feedback["platform"] } : {}),
  ...(row.app_version ? { appVersion: String(row.app_version) } : {}),
  ...(row.os_version ? { osVersion: String(row.os_version) } : {}),
  ...(row.locale ? { locale: String(row.locale) } : {}),
  metadata: JSON.parse(String(row.metadata_json ?? "{}")),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

const publicFeedback = (feedback: Feedback) => {
  const {
    organizationId: _organizationId,
    email: _email,
    metadata: _metadata,
    assignedUserId: _assignedUserId,
    mergedIntoId: _mergedIntoId,
    ...safe
  } = feedback;
  return { ...safe, metadata: {} };
};

const publicFeedbackWithVotes = async (
  env: Env,
  context: TenantContext,
  feedback: Feedback[],
) => {
  if (!feedback.length) return [];
  const placeholders = feedback.map(() => "?").join(",");
  const rows = await env.DB.prepare(
    `SELECT feedback_id AS feedbackId, COUNT(*) AS count
     FROM feedback_votes
     WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL
       AND feedback_id IN (${placeholders})
     GROUP BY feedback_id`,
  )
    .bind(context.organizationId, context.projectId, ...feedback.map((item) => item.id))
    .all<{ feedbackId: string; count: number }>();
  const counts = new Map(
    (rows.results ?? []).map((row) => [row.feedbackId, Number(row.count)]),
  );
  return feedback.map((item) => ({
    ...publicFeedback(item),
    votes: counts.get(item.id) ?? 0,
  }));
};

export const publicWidgetConfig = (
  themeJson: string,
  categories: unknown[],
  turnstileSiteKey?: string,
): { theme: Record<string, unknown>; categories: unknown[]; turnstileSiteKey?: string } => {
  let raw: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(themeJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      raw = parsed as Record<string, unknown>;
  } catch {
    raw = {};
  }
  const theme: Record<string, unknown> = {};
  if (
    [
      "floating",
      "modal",
      "side-panel",
      "inline",
      "portal",
      "headless",
    ].includes(String(raw.mode))
  )
    theme.mode = raw.mode;
  if (typeof raw.buttonLabel === "string")
    theme.buttonLabel = raw.buttonLabel.slice(0, 40);
  if (typeof raw.brandName === "string")
    theme.brandName = raw.brandName.slice(0, 80);
  if (typeof raw.logoUrl === "string" && /^https:\/\//i.test(raw.logoUrl))
    theme.logoUrl = raw.logoUrl.slice(0, 2_048);
  if (typeof raw.showPoweredBy === "boolean")
    theme.showPoweredBy = raw.showPoweredBy;
  if (Array.isArray(raw.fields))
    theme.fields = raw.fields.filter(
      (field): field is string =>
        typeof field === "string" &&
        [
          "type",
          "category",
          "title",
          "description",
          "attachment",
          "email",
        ].includes(field),
    );
  if (Array.isArray(raw.customFields))
    theme.customFields = raw.customFields
      .filter((field): field is Record<string, unknown> => {
        if (!field || typeof field !== "object" || Array.isArray(field))
          return false;
        const item = field as Record<string, unknown>;
        return (
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.type === "string"
        );
      })
      .map((field) => ({
        id: String(field.id),
        label: String(field.label).slice(0, 80),
        type: field.type,
        ...(field.required === true ? { required: true } : {}),
        ...(Array.isArray(field.options)
          ? {
              options: field.options
                .filter(
                  (option): option is string => typeof option === "string",
                )
                .slice(0, 20)
                .map((option) => option.slice(0, 80)),
            }
          : {}),
      }));
  const colorSource =
    raw.colors && typeof raw.colors === "object" && !Array.isArray(raw.colors)
      ? (raw.colors as Record<string, unknown>)
      : raw;
  if (colorSource && typeof colorSource === "object") {
    const colors: Record<string, string> = {};
    for (const key of ["primary", "background", "text", "muted"]) {
      const value = colorSource[key];
      if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value))
        colors[key] = value;
    }
    if (Object.keys(colors).length) theme.colors = colors;
  }
  return {
    theme,
    categories,
    ...(turnstileSiteKey ? { turnstileSiteKey } : {}),
  };
};


export const validateWidgetTheme = (theme: unknown): string | null => {
  if (!theme || typeof theme !== "object" || Array.isArray(theme))
    return "Theme must be an object";
  const raw = theme as Record<string, unknown>;
  if (
    raw.mode !== undefined &&
    ![
      "floating",
      "modal",
      "side-panel",
      "inline",
      "portal",
      "headless",
    ].includes(String(raw.mode))
  )
    return "Widget mode is invalid";
  if (
    raw.buttonLabel !== undefined &&
    (typeof raw.buttonLabel !== "string" || raw.buttonLabel.length > 80)
  )
    return "Button label must be 80 characters or fewer";
  if (
    raw.brandName !== undefined &&
    (typeof raw.brandName !== "string" || raw.brandName.length > 80)
  )
    return "Brand name must be 80 characters or fewer";
  if (
    raw.logoUrl !== undefined &&
    (typeof raw.logoUrl !== "string" ||
      raw.logoUrl.length > 2_048 ||
      !/^https:\/\//i.test(raw.logoUrl))
  )
    return "Logo URL must be an HTTPS URL";
  if (
    raw.showPoweredBy !== undefined &&
    typeof raw.showPoweredBy !== "boolean"
  )
    return "showPoweredBy must be boolean";
  if (
    raw.fields !== undefined &&
    (!Array.isArray(raw.fields) ||
      raw.fields.length > 20 ||
      raw.fields.some(
        (field) =>
          typeof field !== "string" ||
          ![
            "type",
            "category",
            "title",
            "description",
            "attachment",
            "email",
          ].includes(field),
      ))
  )
    return "Widget fields are invalid";
  if (
    raw.customFields !== undefined &&
    (!Array.isArray(raw.customFields) || raw.customFields.length > 20)
  )
    return "Custom widget fields are invalid";
  const customTypes = ["text", "textarea", "select", "number", "boolean"];
  if (Array.isArray(raw.customFields)) {
    const ids = new Set<string>();
    for (const field of raw.customFields) {
      if (!field || typeof field !== "object" || Array.isArray(field))
        return "Custom widget fields are invalid";
      const item = field as Record<string, unknown>;
      if (
        typeof item.id !== "string" ||
        !/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(item.id) ||
        ids.has(item.id)
      )
        return "Custom field IDs must be unique and use letters, numbers, dots, dashes, or underscores";
      if (
        typeof item.label !== "string" ||
        item.label.trim().length < 1 ||
        item.label.length > 80
      )
        return "Custom field labels are invalid";
      if (typeof item.type !== "string" || !customTypes.includes(item.type))
        return "Custom field type is invalid";
      if (item.required !== undefined && typeof item.required !== "boolean")
        return "Custom field required must be boolean";
      if (
        item.type === "select" &&
        (!Array.isArray(item.options) ||
          item.options.length < 1 ||
          item.options.length > 20 ||
          item.options.some(
            (option) =>
              typeof option !== "string" ||
              option.length < 1 ||
              option.length > 80,
          ))
      )
        return "Select custom fields require 1-20 options";
      ids.add(item.id);
    }
  }
  const colors = raw.colors ?? raw;
  if (colors && typeof colors === "object" && !Array.isArray(colors)) {
    for (const key of ["primary", "background", "text", "muted"]) {
      const value = (colors as Record<string, unknown>)[key];
      if (
        value !== undefined &&
        (typeof value !== "string" || !/^#[0-9a-f]{3,8}$/i.test(value))
      )
        return "Widget colors must be hexadecimal values";
    }
  }
  return JSON.stringify(theme).length <= 16_384
    ? null
    : "Widget theme cannot exceed 16 KB";
};

export const validateCustomFieldMetadata = (
  themeJson: string,
  metadata: Record<string, string | number | boolean>,
): string | null => {
  let theme: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(themeJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      theme = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!Array.isArray(theme.customFields)) return null;
  for (const field of theme.customFields) {
    if (!field || typeof field !== "object" || Array.isArray(field)) continue;
    const definition = field as Record<string, unknown>;
    const fieldId = typeof definition.id === "string" ? definition.id : "";
    if (!fieldId) continue;
    const value = metadata[fieldId];
    if (value === undefined) {
      if (definition.required === true)
        return `Custom field is required: ${fieldId}`;
      continue;
    }
    const fieldType = definition.type;
    if (["text", "textarea", "select"].includes(String(fieldType))) {
      if (typeof value !== "string")
        return `Custom field must be text: ${fieldId}`;
      if (fieldType === "select") {
        const options = Array.isArray(definition.options)
          ? definition.options.filter(
              (option): option is string => typeof option === "string",
            )
          : [];
        if (!options.includes(value))
          return `Custom field has an invalid option: ${fieldId}`;
      }
    } else if (fieldType === "number") {
      if (typeof value !== "number" || !Number.isFinite(value))
        return `Custom field must be a finite number: ${fieldId}`;
    } else if (fieldType === "boolean" && typeof value !== "boolean") {
      return `Custom field must be boolean: ${fieldId}`;
    }
  }
  return null;
};

export const contextFrom = (url: URL): TenantContext => ({
  organizationId: url.searchParams.get("organizationId") ?? "demo-org",
  projectId:
    url.searchParams.get("projectId") ??
    url.pathname.split("/")[4] ??
    "demo-project",
  publicKey: url.searchParams.get("projectKey") ?? undefined,
});

export const allowsDevelopmentFallback = (environment: string): boolean =>
  ["development", "test"].includes(environment.toLowerCase());

const projectFromRequest = async (
  request: Request,
  env: Env,
  url: URL,
  rid: string,
): Promise<TenantContext | Response> => {
  const projectKey =
    request.headers.get("x-nitroping-project-key") ??
    url.searchParams.get("projectKey");
  // Only local development may use the fixture context. Staging is a real
  // tenant-isolated environment and must exercise the same public-key gate as
  // production.
  if (
    !projectKey &&
    allowsDevelopmentFallback(String(env.ENVIRONMENT))
  )
    return contextFrom(url);
  if (!projectKey)
    return error("PROJECT_KEY_REQUIRED", "Project key is required", rid, 401);
  const project = await env.DB.prepare(
    "SELECT p.organization_id, p.id, p.public_key FROM projects p WHERE p.public_key = ? AND p.deleted_at IS NULL AND (NOT EXISTS (SELECT 1 FROM project_api_keys k0 WHERE k0.project_id = p.id AND k0.organization_id = p.organization_id AND k0.kind = 'public') OR EXISTS (SELECT 1 FROM project_api_keys k WHERE k.project_id = p.id AND k.organization_id = p.organization_id AND k.kind = 'public' AND k.key_hash = ? AND k.revoked_at IS NULL))",
  )
    .bind(projectKey, await sha256(projectKey))
    .first<{ organization_id: string; id: string; public_key: string }>();
  return project
    ? {
        organizationId: project.organization_id,
        projectId: project.id,
        publicKey: project.public_key,
      }
    : error("INVALID_PROJECT_KEY", "Invalid project key", rid, 401);
};

const requireServerKey = async (
  request: Request,
  env: Env,
  context: TenantContext,
  rid: string,
): Promise<Response | null> => {
  const key = request.headers.get("x-nitroping-server-key");
  if (!key)
    return error("SERVER_KEY_REQUIRED", "Server key is required", rid, 401);
  const hash = await sha256(key);
  const found = await env.DB.prepare(
    "SELECT id FROM project_api_keys WHERE project_id = ? AND organization_id = ? AND kind = 'server' AND key_hash = ? AND revoked_at IS NULL",
  )
    .bind(context.projectId, context.organizationId, hash)
    .first();
  return found
    ? null
    : error("INVALID_SERVER_KEY", "Invalid server key", rid, 403);
};

const jsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {};
  }
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};
};

const projectMatchesPath = (
  context: TenantContext,
  projectId: string,
  rid: string,
): Response | null =>
  context.projectId === projectId || context.publicKey === projectId
    ? null
    : error(
        "PROJECT_SCOPE_MISMATCH",
        "The project key does not belong to this project",
        rid,
        403,
      );

const allowedMetadata = async (
  env: Env,
  context: TenantContext,
  input: CreateFeedbackInput,
  rid: string,
): Promise<Response | null> => {
  const settings = await env.DB.prepare(
    "SELECT allowed_metadata_json, theme_json FROM project_settings WHERE project_id = ? AND organization_id = ?",
  )
    .bind(context.projectId, context.organizationId)
    .first<{ allowed_metadata_json: string; theme_json: string }>();
  const allowed = new Set<string>(
    JSON.parse(settings?.allowed_metadata_json ?? "[]"),
  );
  const metadata = input.metadata ?? {};
  const invalid = Object.keys(metadata).filter((key) => !allowed.has(key));
  if (invalid.length)
    return error(
        "METADATA_FIELD_NOT_ALLOWED",
        `Metadata fields are not allowed: ${invalid.join(", ")}`,
        rid,
        400,
      );
  const customFieldError = validateCustomFieldMetadata(
    settings?.theme_json ?? "{}",
    metadata,
  );
  return customFieldError
    ? error("INVALID_CUSTOM_FIELD", customFieldError, rid, 400)
    : null;
};

const rateLimit = async (
  env: Env,
  request: Request,
  scope: string,
): Promise<boolean> => {
  const key = `rate:${scope}:${clientIp(request)}`;
  const current = Number((await env.CACHE.get(key)) ?? "0");
  if (current >= 60) return false;
  await env.CACHE.put(key, String(current + 1), { expirationTtl: 60 });
  return true;
};

const requestHeaders = (
  rid: string,
  origin?: string,
): Record<string, string> => ({
  "access-control-allow-origin": origin ?? "*",
  "access-control-allow-headers":
    "content-type, x-request-id, x-nitroping-project-key, x-nitroping-server-key, authorization, idempotency-key",
  "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "access-control-expose-headers": "etag, x-request-id",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-request-id": rid,
});

const requireProjectServer = async (
  request: Request,
  env: Env,
  url: URL,
  projectId: string,
  rid: string,
): Promise<TenantContext | Response> => {
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
  owner: [
    "feedback:read",
    "feedback:write",
    "feedback:reply",
    "feedback:moderate",
    "project:manage",
    "developer:manage",
    "billing:manage",
    "members:manage",
    "roadmap:manage",
    "audit:read",
    "privacy:manage",
  ],
  admin: [
    "feedback:read",
    "feedback:write",
    "feedback:reply",
    "feedback:moderate",
    "project:manage",
    "developer:manage",
    "members:manage",
    "roadmap:manage",
    "audit:read",
    "privacy:manage",
  ],
  member: [
    "feedback:read",
    "feedback:write",
    "feedback:reply",
    "roadmap:manage",
    "audit:read",
  ],
  moderator: [
    "feedback:read",
    "feedback:reply",
    "feedback:moderate",
    "audit:read",
  ],
  viewer: ["feedback:read", "audit:read"],
  billing_admin: ["feedback:read", "billing:manage", "audit:read"],
};

const roleHasCapability = (
  role: string,
  capability: DashboardCapability,
): boolean => roleCapabilities[role]?.includes(capability) ?? false;

const requireDashboardProject = async (
  request: Request,
  env: Env,
  url: URL,
  projectId: string,
  rid: string,
  capability: DashboardCapability = "feedback:read",
): Promise<TenantContext | Response> => {
  if (!identityProviderConfigured(env))
    return requireProjectServer(request, env, url, projectId, rid);
  const identity = await requireIdentity(request, env, rid);
  if (identity instanceof Response) return identity;
  const userId = await userForIdentity(env, identity);
  const project = await env.DB.prepare(
    `SELECT p.id, p.organization_id AS organizationId, m.role
    FROM projects p
    JOIN organization_members m ON m.organization_id = p.organization_id
    WHERE p.id = ? AND m.user_id = ? AND m.deleted_at IS NULL AND p.deleted_at IS NULL`,
  )
    .bind(projectId, userId)
    .first<{ id: string; organizationId: string; role: string }>();
  if (!project)
    return error(
      "PROJECT_NOT_FOUND",
      "The project was not found for this account",
      rid,
      404,
    );
  return roleHasCapability(project.role, capability)
    ? {
        organizationId: project.organizationId,
        projectId: project.id,
        actorUserId: userId,
      }
    : error(
        "FORBIDDEN",
        `The ${project.role} role cannot perform ${capability}`,
        rid,
        403,
      );
};

const requireDashboardAccess = async (
  request: Request,
  env: Env,
  rid: string,
): Promise<Response | null> => {
  if (!identityProviderConfigured(env))
    return null;
  return (await verifyConfiguredIdentity(request, env))
    ? null
    : error(
        "DASHBOARD_AUTH_REQUIRED",
        "Cloudflare Access authentication is required",
        rid,
        401,
      );
};

const requireIdentity = async (
  request: Request,
  env: Env,
  rid: string,
): Promise<AccessClaims | Response> => {
  if (!identityProviderConfigured(env))
    return error(
      "DASHBOARD_ACCESS_NOT_CONFIGURED",
      "Cloudflare Access or OIDC must be configured for organization management",
      rid,
      503,
    );
  const claims = await verifyConfiguredIdentity(request, env);
  return claims?.email
    ? claims
    : error(
        "DASHBOARD_AUTH_REQUIRED",
        "Cloudflare Access authentication is required",
        rid,
        401,
      );
};

const verifyConfiguredIdentity = async (
  request: Request,
  env: Env,
): Promise<AccessClaims | null> => {
  const accessClaims = await verifyAccessJwt(request, env);
  if (accessClaims) return accessClaims;
  return verifyOidcJwt(request, env);
};

const identityProviderConfigured = (env: Env): boolean =>
  Boolean(
    (String(env.ACCESS_TEAM_DOMAIN ?? "") &&
      String(env.ACCESS_AUDIENCE ?? "")) ||
      (String(env.OIDC_ISSUER_URL ?? "") && String(env.OIDC_AUDIENCE ?? "")),
  );

const userForIdentity = async (
  env: Env,
  identity: AccessClaims,
): Promise<string> => {
  const userId = await sha256(`access:${identity.sub ?? identity.email}`);
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)",
  )
    .bind(userId, identity.email, now, now)
    .run();
  return userId;
};

const requireOrganizationMember = async (
  env: Env,
  organizationId: string,
  userId: string,
  roles: string[] = ["owner", "admin"],
): Promise<boolean> => {
  const placeholders = roles.map(() => "?").join(",");
  const member = await env.DB.prepare(
    `SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ? AND deleted_at IS NULL AND role IN (${placeholders})`,
  )
    .bind(organizationId, userId, ...roles)
    .first();
  return Boolean(member);
};

const etagged = async (
  data: unknown,
  request: Request,
  headers: Record<string, string>,
  status = 200,
): Promise<Response> => {
  const etag = `W/\"${await sha256(JSON.stringify(data))}\"`;
  if (request.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers: { ...headers, etag } });
  return jsonResponse(data, { status, headers: { ...headers, etag } });
};

const enqueueWebhookDeliveries = async (
  env: Env,
  organizationId: string,
  projectId: string,
  feedbackId: string,
  eventType: WebhookEventType,
  sourceEventId: string,
): Promise<void> => {
  const webhooks = await env.DB.prepare(
    "SELECT id, organization_id AS organizationId, events_json AS events FROM webhooks WHERE organization_id = ? AND project_id = ? AND active = 1",
  )
    .bind(organizationId, projectId)
    .all<{ id: string; organizationId: string; events: string }>();
  for (const webhook of webhooks.results ?? []) {
    const events = JSON.parse(webhook.events || "[]") as string[];
    if (!events.includes(eventType)) continue;
    const deliveryId = id();
    const inserted = await env.DB.prepare(
      "INSERT OR IGNORE INTO webhook_deliveries (id, organization_id, project_id, webhook_id, event_id, status, attempts, created_at) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)",
    )
      .bind(
        deliveryId,
        webhook.organizationId,
        projectId,
        webhook.id,
        sourceEventId,
        new Date().toISOString(),
      )
      .run();
    if (inserted.meta.changes)
      await env.EVENTS.send({
        type: "webhook.deliver",
        deliveryId,
        webhookId: webhook.id,
        eventId: deliveryId,
        sourceEventId,
        eventType,
        feedbackId,
        organizationId,
        projectId,
      });
  }
};

export const deliverWebhook = async (
  env: Env,
  event: {
    deliveryId: string;
    webhookId: string;
    sourceEventId: string;
    eventType: WebhookEventType;
    feedbackId: string;
    organizationId: string;
    projectId: string;
  },
): Promise<boolean> => {
  const delivery = await env.DB.prepare(
    "SELECT status FROM webhook_deliveries WHERE id = ? AND organization_id = ? AND project_id = ?",
  )
    .bind(event.deliveryId, event.organizationId, event.projectId)
    .first<{ status: string }>();
  if (!delivery || delivery.status === "delivered") return true;
  const webhook = await env.DB.prepare(
    "SELECT url FROM webhooks WHERE id = ? AND organization_id = ? AND project_id = ? AND active = 1",
  )
    .bind(event.webhookId, event.organizationId, event.projectId)
    .first<{ url: string }>();
  if (!webhook) return true;
  const secret = await env.CACHE.get(`webhook:secret:${event.webhookId}`);
  if (!secret) {
    await env.DB.prepare(
      "UPDATE webhook_deliveries SET status = 'failed', attempts = attempts + 1 WHERE id = ? AND organization_id = ? AND project_id = ?",
    )
      .bind(event.deliveryId, event.organizationId, event.projectId)
      .run();
    return true;
  }
  const feedback = await env.DB.prepare(
    "SELECT id, project_id AS projectId, type, status, priority, title, body, email, platform, app_version AS appVersion, os_version AS osVersion, locale, metadata_json AS metadata, created_at AS createdAt, updated_at AS updatedAt FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
  )
    .bind(event.feedbackId, event.organizationId, event.projectId)
    .first<Record<string, unknown>>();
  const payload = JSON.stringify({
    id: event.sourceEventId,
    type: event.eventType,
    projectId: event.projectId,
    feedback: feedback
      ? { ...feedback, metadata: JSON.parse(String(feedback.metadata ?? "{}")) }
      : null,
    createdAt: new Date().toISOString(),
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacSha256(secret, `${timestamp}.${payload}`);
  await env.DB.prepare(
    "UPDATE webhook_deliveries SET attempts = attempts + 1, status = 'pending' WHERE id = ? AND organization_id = ? AND project_id = ?",
  )
    .bind(event.deliveryId, event.organizationId, event.projectId)
    .run();
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      redirect: "error",
      headers: {
        "content-type": "application/json",
        "user-agent": "NitroPing-Webhooks/1",
        "x-nitroping-event": event.eventType,
        "x-nitroping-signature": `t=${timestamp},v1=${signature}`,
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      throw new Error(`Webhook responded with ${response.status}`);
    await env.DB.prepare(
      "UPDATE webhook_deliveries SET status = 'delivered', next_attempt_at = NULL WHERE id = ? AND organization_id = ? AND project_id = ?",
    )
      .bind(event.deliveryId, event.organizationId, event.projectId)
      .run();
    return true;
  } catch {
    const retryAt = new Date(Date.now() + 60_000).toISOString();
    await env.DB.prepare(
      "UPDATE webhook_deliveries SET status = 'failed', next_attempt_at = ? WHERE id = ? AND organization_id = ? AND project_id = ?",
    )
      .bind(retryAt, event.deliveryId, event.organizationId, event.projectId)
      .run();
    return false;
  }
};

const currentUsage = async (
  env: Env,
  organizationId: string,
): Promise<{
  plan: string;
  period: string;
  feedbackCount: number;
  attachmentBytes: number;
  feedbackLimit: number;
  attachmentLimit: number;
}> => {
  const period = new Date().toISOString().slice(0, 7);
  const subscription = await env.DB.prepare(
    "SELECT plan FROM subscriptions WHERE organization_id = ?",
  )
    .bind(organizationId)
    .first<{ plan: string }>();
  const usage = await env.DB.prepare(
    "SELECT feedback_count AS feedbackCount, attachment_bytes AS attachmentBytes FROM usage_counters WHERE organization_id = ? AND period = ?",
  )
    .bind(organizationId, period)
    .first<{ feedbackCount: number; attachmentBytes: number }>();
  const plan = normalizePlan(subscription?.plan);
  const limits = entitlementsFor(plan);
  return {
    plan,
    period,
    feedbackCount: Number(usage?.feedbackCount ?? 0),
    attachmentBytes: Number(usage?.attachmentBytes ?? 0),
    feedbackLimit: limits.monthlyFeedback,
    attachmentLimit: limits.attachmentBytes,
  };
};

const releaseAttachmentUsage = async (
  env: Env,
  organizationId: string,
  attachments: Array<{ sizeBytes: number; createdAt: string }>,
): Promise<void> => {
  const bytesByPeriod = new Map<string, number>();
  for (const attachment of attachments) {
    const period = attachment.createdAt.slice(0, 7);
    bytesByPeriod.set(
      period,
      (bytesByPeriod.get(period) ?? 0) + Number(attachment.sizeBytes),
    );
  }
  if (!bytesByPeriod.size) return;
  const now = new Date().toISOString();
  await env.DB.batch(
    [...bytesByPeriod].map(([period, bytes]) =>
      env.DB.prepare(
        "UPDATE usage_counters SET attachment_bytes = MAX(0, attachment_bytes - ?), updated_at = ? WHERE organization_id = ? AND period = ?",
      ).bind(bytes, now, organizationId, period),
    ),
  );
};

const requirePlanFeature = async (
  env: Env,
  organizationId: string,
  feature: EntitlementFeature,
  rid: string,
): Promise<Response | null> => {
  const subscription = await env.DB.prepare(
    "SELECT plan FROM subscriptions WHERE organization_id = ?",
  )
    .bind(organizationId)
    .first<{ plan: string }>();
  if (hasEntitlement(subscription?.plan, feature)) return null;
  return error(
    "PLAN_FEATURE_UNAVAILABLE",
    `The ${normalizePlan(subscription?.plan)} plan does not include ${feature}`,
    rid,
    402,
    { feature, plan: normalizePlan(subscription?.plan) },
  );
};

const sendTransactionalEmail = async (
  env: Env,
  event: { email: string; subject: string; text: string; html: string },
): Promise<void> => {
  await env.EMAIL.send({
    to: event.email,
    from: { email: env.EMAIL_FROM, name: "NitroPing" },
    subject: event.subject,
    text: event.text,
    html: event.html,
  });
};

const claimEmailDelivery = async (
  env: Env,
  event: { eventId?: string; organizationId?: string; projectId?: string },
): Promise<boolean> => {
  if (!event.eventId) return false;
  const result = await env.DB.prepare(
    "INSERT OR IGNORE INTO email_deliveries (event_id, organization_id, project_id, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
  )
    .bind(
      event.eventId,
      event.organizationId ?? null,
      event.projectId ?? null,
      new Date().toISOString(),
    )
    .run();
  return Boolean(result.meta.changes);
};

const markEmailDelivered = async (env: Env, eventId: string): Promise<void> => {
  await env.DB.prepare(
    "UPDATE email_deliveries SET status = 'delivered', delivered_at = ? WHERE event_id = ?",
  )
    .bind(new Date().toISOString(), eventId)
    .run();
};

const releaseEmailDelivery = async (env: Env, eventId: string): Promise<void> => {
  await env.DB.prepare("DELETE FROM email_deliveries WHERE event_id = ?")
    .bind(eventId)
    .run();
};

const enqueueWatcherEmails = async (
  env: Env,
  organizationId: string,
  projectId: string,
  feedbackId: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> => {
  const feedback = await env.DB.prepare(
    "SELECT organization_id AS organizationId, project_id AS projectId FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ?",
  )
    .bind(feedbackId, organizationId, projectId)
    .first<{ organizationId: string; projectId: string }>();
  if (!feedback) return;
  const watchers = await env.DB.prepare(
    "SELECT w.email FROM feedback_watchers w WHERE w.feedback_id = ? AND w.organization_id = ? AND w.project_id = ?",
  )
    .bind(feedbackId, feedback.organizationId, feedback.projectId)
    .all<{ email: string }>();
  for (const watcher of watchers.results ?? [])
    await env.EVENTS.send({
      type: "email.send",
      organizationId: feedback.organizationId,
      projectId: feedback.projectId,
      email: watcher.email,
      subject,
      text,
      html,
      eventId: id(),
    });
};

export const issueFollowUpLink = async (
  env: Env,
  context: TenantContext,
  feedbackId: string,
  email: string,
): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const token = randomToken("follow");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE magic_link_tokens SET used_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND used_at IS NULL AND expires_at > ?",
    ).bind(now, feedbackId, context.organizationId, context.projectId, now),
    env.DB.prepare(
      "INSERT INTO magic_link_tokens (id, organization_id, project_id, feedback_id, token_hash, expires_at, created_at, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      id(),
      context.organizationId,
      context.projectId,
      feedbackId,
      await sha256(token),
      expiresAt,
      now,
      normalizedEmail,
    ),
    env.DB.prepare(
      "INSERT OR IGNORE INTO feedback_watchers (organization_id, project_id, feedback_id, email, created_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(context.organizationId, context.projectId, feedbackId, normalizedEmail, now),
    env.DB.prepare(
      "INSERT INTO consent_records (id, organization_id, project_id, feedback_id, email, purpose, legal_basis, granted_at) VALUES (?, ?, ?, ?, ?, 'feedback_follow_up', 'consent', ?)",
    ).bind(id(), context.organizationId, context.projectId, feedbackId, normalizedEmail, now),
  ]);
  if (env.EVENTS)
    await env.EVENTS.send({
      type: "follow-up.requested",
      token,
      email: normalizedEmail,
      feedbackId,
      organizationId: context.organizationId,
      projectId: context.projectId,
      eventId: id(),
    });
};

const enqueueTeamNotifications = async (
  env: Env,
  organizationId: string,
  projectId: string,
  eventType: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> => {
  const recipients = await env.DB.prepare(
    `SELECT u.email
    FROM organization_members m JOIN users u ON u.id = m.user_id
    LEFT JOIN notification_preferences p ON p.organization_id = m.organization_id AND p.project_id = ? AND p.email = u.email AND p.event_type = ?
    WHERE m.organization_id = ? AND m.deleted_at IS NULL AND COALESCE(p.enabled, 1) = 1`,
  )
    .bind(projectId, eventType, organizationId)
    .all<{ email: string }>();
  for (const recipient of recipients.results ?? []) {
    await env.EVENTS.send({
      type: "email.send",
      organizationId,
      projectId,
      email: recipient.email,
      subject,
      text,
      html,
      eventId: id(),
    });
  }
};

const recordMetric = (
  env: Env,
  event: string,
  organizationId: string,
  projectId: string,
  doubles: number[] = [],
): void => {
  try {
    env.ANALYTICS.writeDataPoint({
      blobs: [event, organizationId, projectId],
      doubles,
      indexes: [event],
    });
  } catch {
    /* Analytics must never break product traffic. */
  }
};

const writeAudit = async (
  env: Env,
  context: TenantContext,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> => {
  await env.DB.prepare(
    "INSERT INTO audit_logs (id, organization_id, project_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      id(),
      context.organizationId,
      context.projectId,
      context.actorUserId ?? null,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata),
      new Date().toISOString(),
    )
    .run();
};

const writeOrganizationAudit = async (
  env: Env,
  organizationId: string,
  action: string,
  entityType: string,
  entityId: string,
  actorUserId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> => {
  await env.DB.prepare(
    "INSERT INTO audit_logs (id, organization_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      id(),
      organizationId,
      actorUserId,
      action,
      entityType,
      entityId,
      JSON.stringify(metadata),
      new Date().toISOString(),
    )
    .run();
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const rid = requestId(request);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "");
    const cors = requestHeaders(rid, request.headers.get("origin") ?? "*");
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (path === "/health")
      return jsonResponse(
        { ok: true, environment: env.ENVIRONMENT, requestId: rid },
        { headers: cors },
      );
    // Workers Assets redirects HTML filenames on workers.dev hosts. Rewrite
    // configured portal requests explicitly so staging and preview portals
    // behave the same as the nitroping.dev route.
    if (
      env.ASSETS &&
      path === "/portal" &&
      url.searchParams.has("projectId") &&
      url.searchParams.has("projectKey")
    )
      return env.ASSETS.fetch(
        new Request(new URL("/portal.html", request.url), request),
      );
    try {
      const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
      const platformHostnames = new Set([
        "nitroping.dev",
        "www.nitroping.dev",
        "api.nitroping.dev",
        "localhost",
        "127.0.0.1",
      ]);
      if (
        !platformHostnames.has(hostname) &&
        (path === "" || path === "/portal")
      ) {
        const customPortal = await env.DB.prepare(
          "SELECT d.project_id AS projectId, p.public_key AS publicKey FROM custom_domains d JOIN projects p ON p.id = d.project_id AND p.organization_id = d.organization_id AND p.deleted_at IS NULL WHERE d.hostname = ? AND d.deleted_at IS NULL LIMIT 1",
        )
          .bind(hostname)
          .first<{ projectId: string; publicKey: string }>();
        if (customPortal) {
          const portalUrl = new URL("/portal.html", request.url);
          portalUrl.searchParams.set("projectId", customPortal.projectId);
          portalUrl.searchParams.set("projectKey", customPortal.publicKey);
          return env.ASSETS.fetch(new Request(portalUrl, request));
        }
      }
      const origin = request.headers.get("origin");
      const projectKey =
        request.headers.get("x-nitroping-project-key") ??
        url.searchParams.get("projectKey");
      if (origin && projectKey) {
        const project = await env.DB.prepare(
          "SELECT id, organization_id FROM projects WHERE public_key = ? AND deleted_at IS NULL",
        )
          .bind(projectKey)
          .first<{ id: string; organization_id: string }>();
        if (project) {
          const settings = await env.DB.prepare(
            "SELECT origins_json FROM project_settings WHERE project_id = ? AND organization_id = ?",
          )
            .bind(project.id, project.organization_id)
            .first<{ origins_json: string }>();
          const origins = JSON.parse(
            settings?.origins_json ?? "[]",
          ) as string[];
          if (origins.length > 0 && !origins.includes(origin))
            return error(
              "ORIGIN_NOT_ALLOWED",
              "This origin is not allowed for the project",
              rid,
              403,
            );
        }
      }
      const repo = repository(env);
      if (path === "/api/v1/dashboard/session" && request.method === "GET") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response || !identity.email)
          return identity instanceof Response
            ? identity
            : error(
                "DASHBOARD_AUTH_REQUIRED",
                "An authenticated email is required",
                rid,
                401,
              );
        const userId = await userForIdentity(env, identity);
        return jsonResponse(
          {
            userId,
            email: identity.email,
            displayName: identity.email.split("@")[0],
          },
          { headers: cors },
        );
      }
      const organizationsPath = path === "/api/v1/dashboard/organizations";
      if (
        organizationsPath &&
        (request.method === "GET" || request.method === "POST")
      ) {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response || !identity.email)
          return identity instanceof Response
            ? identity
            : error(
                "DASHBOARD_AUTH_REQUIRED",
                "An authenticated email is required",
                rid,
                401,
              );
        const userId = await userForIdentity(env, identity);
        const organizationCount = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM organization_members m JOIN organizations o ON o.id = m.organization_id WHERE m.user_id = ? AND m.deleted_at IS NULL AND o.deleted_at IS NULL",
        )
          .bind(userId)
          .first<{ count: number }>();
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT o.id, o.name, o.slug, m.role, o.created_at AS createdAt FROM organizations o JOIN organization_members m ON m.organization_id = o.id WHERE m.user_id = ? AND m.deleted_at IS NULL AND o.deleted_at IS NULL ORDER BY o.created_at ASC",
          )
            .bind(userId)
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const currentPlan = await env.DB.prepare(
            "SELECT plan FROM subscriptions WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = ? AND deleted_at IS NULL) ORDER BY CASE plan WHEN 'business' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END DESC LIMIT 1",
        )
          .bind(userId)
          .first<{ plan: string }>();
        const organizationLimit = entitlementsFor(currentPlan?.plan).organizations;
        if (Number(organizationCount?.count ?? 0) >= organizationLimit)
          return error(
            "PLAN_LIMIT_REACHED",
            `Your plan includes up to ${organizationLimit} organization${organizationLimit === 1 ? "" : "s"}`,
            rid,
            402,
            { limit: organizationLimit, resource: "organizations" },
          );
        const body = await jsonBody(request);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug =
          typeof body.slug === "string"
            ? body.slug.trim().toLowerCase()
            : name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        if (
          name.length < 2 ||
          name.length > 120 ||
          !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)
        )
          return error(
            "VALIDATION_ERROR",
            "Organization name or slug is invalid",
            rid,
            400,
          );
        const organizationId = id();
        const now = new Date().toISOString();
        try {
          await env.DB.batch([
            env.DB.prepare(
              "INSERT INTO organizations (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            ).bind(organizationId, name, slug, now, now),
            env.DB.prepare(
              "INSERT INTO organization_members (organization_id, user_id, role, created_at, updated_at) VALUES (?, ?, 'owner', ?, ?)",
            ).bind(organizationId, userId, now, now),
            env.DB.prepare(
              "INSERT INTO subscriptions (organization_id, plan, status, created_at, updated_at) VALUES (?, 'free', 'active', ?, ?)",
            ).bind(organizationId, now, now),
          ]);
        } catch {
          return error(
            "ORGANIZATION_SLUG_TAKEN",
            "Organization slug is already in use",
            rid,
            409,
          );
        }
        await writeOrganizationAudit(
          env,
          organizationId,
          "organization.created",
          "organization",
          organizationId,
          userId,
        );
        return jsonResponse(
          { id: organizationId, name, slug, role: "owner", createdAt: now },
          { status: 201, headers: cors },
        );
      }
      const organizationDeleteMatch = path.match(
        /^\/api\/v1\/dashboard\/organizations\/([^/]+)$/,
      );
      if (organizationDeleteMatch && request.method === "DELETE") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        if (
          !(await requireOrganizationMember(
            env,
            organizationDeleteMatch[1],
            userId,
            ["owner"],
          ))
        )
          return error(
            "FORBIDDEN",
            "Organization owner access is required",
            rid,
            403,
          );
        const attachments = await env.DB.prepare(
          "SELECT object_key AS objectKey, project_id AS projectId FROM attachments WHERE organization_id = ? AND deleted_at IS NULL",
        )
          .bind(organizationDeleteMatch[1])
          .all<{ objectKey: string; projectId: string }>();
        const customDomains = await env.DB.prepare(
          "SELECT project_id AS projectId, cloudflare_hostname_id AS cloudflareHostnameId FROM custom_domains WHERE organization_id = ? AND deleted_at IS NULL",
        )
          .bind(organizationDeleteMatch[1])
          .all<{ projectId: string; cloudflareHostnameId: string | null }>();
        const webhooks = await env.DB.prepare(
          "SELECT id FROM webhooks WHERE organization_id = ?",
        )
          .bind(organizationDeleteMatch[1])
          .all<{ id: string }>();
        const feedbackIds = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE organization_id = ? AND deleted_at IS NULL",
        )
          .bind(organizationDeleteMatch[1])
          .all<{ id: string }>();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE feedback_items SET email = NULL, body = '[organization deleted]', metadata_json = '{}', deleted_at = ?, updated_at = ? WHERE organization_id = ? AND deleted_at IS NULL",
          ).bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare(
            "UPDATE feedback_comments SET body = '[organization deleted]', deleted_at = ? WHERE organization_id = ? AND deleted_at IS NULL",
          ).bind(now, organizationDeleteMatch[1]),
          env.DB.prepare(
            "UPDATE attachments SET deleted_at = ? WHERE organization_id = ? AND deleted_at IS NULL",
          ).bind(now, organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM feedback_votes WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM feedback_watchers WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM consent_records WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM feedback_status_history WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM feedback_tag_links WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM roadmap_feedback_links WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM changelog_feedback_links WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM feedback_tags WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM categories WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM roadmap_items WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM changelog_items WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM project_api_keys WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM webhook_deliveries WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare("DELETE FROM webhooks WHERE organization_id = ?").bind(
            organizationDeleteMatch[1],
          ),
          env.DB.prepare(
            "DELETE FROM project_settings WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM organization_invites WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM notification_preferences WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM magic_link_tokens WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM idempotency_keys WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM usage_counters WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM subscriptions WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "UPDATE custom_domains SET deleted_at = ?, updated_at = ? WHERE organization_id = ? AND deleted_at IS NULL",
          ).bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare(
            "DELETE FROM organization_members WHERE organization_id = ?",
          ).bind(organizationDeleteMatch[1]),
          env.DB.prepare(
            "UPDATE projects SET deleted_at = ?, updated_at = ? WHERE organization_id = ? AND deleted_at IS NULL",
          ).bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare(
            "UPDATE organizations SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
          ).bind(now, now, organizationDeleteMatch[1]),
          env.DB.prepare(
            "INSERT INTO privacy_requests (id, organization_id, kind, status, requested_by, created_at, completed_at) VALUES (?, ?, 'delete', 'completed', ?, ?, ?)",
          ).bind(id(), organizationDeleteMatch[1], userId, now, now),
        ]);
        for (const attachment of attachments.results ?? [])
          ctx.waitUntil(
            env.EVENTS.send({
              type: "attachment.delete",
              objectKey: attachment.objectKey,
              projectId: attachment.projectId,
              eventId: id(),
              organizationId: organizationDeleteMatch[1],
            }),
          );
        if (env.FEEDBACK_SEARCH)
          for (const feedback of feedbackIds.results ?? [])
            ctx.waitUntil(
              deleteFeedbackEmbedding(env.FEEDBACK_SEARCH, feedback.id).catch(
                () => undefined,
              ),
            );
        for (const domain of customDomains.results ?? [])
          if (domain.cloudflareHostnameId)
            ctx.waitUntil(
              env.EVENTS.send({
                type: "custom-domain.delete",
                cloudflareHostnameId: domain.cloudflareHostnameId,
                organizationId: organizationDeleteMatch[1],
                projectId: domain.projectId,
                eventId: id(),
              }),
            );
        for (const webhook of webhooks.results ?? [])
          ctx.waitUntil(env.CACHE.delete(`webhook:secret:${webhook.id}`));
        for (const prefix of ["follow:", "upload:"]) {
          const tokenKeys = await env.CACHE.list({ prefix });
          for (const key of tokenKeys.keys) {
            const value = (await env.CACHE.get(key.name, "json")) as {
              organizationId?: string;
            } | null;
            if (value?.organizationId === organizationDeleteMatch[1])
              ctx.waitUntil(env.CACHE.delete(key.name));
          }
        }
        await writeOrganizationAudit(
          env,
          organizationDeleteMatch[1],
          "organization.deleted",
          "organization",
          organizationDeleteMatch[1],
          userId,
        );
        return new Response(null, { status: 204, headers: cors });
      }
      const membersMatch = path.match(
        /^\/api\/v1\/dashboard\/organizations\/([^/]+)\/members(?:\/([^/]+))?$/,
      );
      if (membersMatch && ["GET", "DELETE"].includes(request.method)) {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        const canManage = await requireOrganizationMember(
          env,
          membersMatch[1],
          userId,
          ["owner", "admin"],
        );
        if (!canManage)
          return error(
            "FORBIDDEN",
            "Organization administrator access is required",
            rid,
            403,
          );
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            `SELECT m.user_id AS userId, u.email, m.role, m.created_at AS createdAt
            FROM organization_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? AND m.deleted_at IS NULL ORDER BY m.created_at ASC`,
          )
            .bind(membersMatch[1])
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        if (!membersMatch[2])
          return error("MEMBER_ID_REQUIRED", "Member ID is required", rid, 400);
        if (membersMatch[2] === userId)
          return error(
            "MEMBER_SELF_REMOVE",
            "You cannot remove yourself from an organization",
            rid,
            400,
          );
        const removed = await env.DB.prepare(
          "UPDATE organization_members SET deleted_at = ?, updated_at = ? WHERE organization_id = ? AND user_id = ? AND deleted_at IS NULL",
        )
          .bind(new Date().toISOString(), new Date().toISOString(), membersMatch[1], membersMatch[2])
          .run();
        if (!removed.meta.changes)
          return error("MEMBER_NOT_FOUND", "Member was not found", rid, 404);
        await writeOrganizationAudit(
          env,
          membersMatch[1],
          "member.removed",
          "user",
          membersMatch[2],
          userId,
        );
        return new Response(null, { status: 204, headers: cors });
      }
      const inviteMatch = path.match(
        /^\/api\/v1\/dashboard\/organizations\/([^/]+)\/invites$/,
      );
      if (inviteMatch && request.method === "POST") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        if (
          !(await requireOrganizationMember(env, inviteMatch[1], userId, [
            "owner",
            "admin",
          ]))
        )
          return error(
            "FORBIDDEN",
            "Organization administrator access is required",
            rid,
            403,
          );
        const body = await jsonBody(request);
        const email =
          typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const role = [
          "admin",
          "member",
          "moderator",
          "viewer",
          "billing_admin",
        ].includes(String(body.role))
          ? String(body.role)
          : "member";
        if (role !== "member") {
          const featureError = await requirePlanFeature(
            env,
            inviteMatch[1],
            "advancedRoles",
            rid,
          );
          if (featureError) return featureError;
        }
        const subscription = await env.DB.prepare(
          "SELECT plan FROM subscriptions WHERE organization_id = ?",
        )
          .bind(inviteMatch[1])
          .first<{ plan: string }>();
        const memberLimit = entitlementsFor(subscription?.plan).teamMembers;
        const memberCount = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM organization_members WHERE organization_id = ? AND deleted_at IS NULL",
        )
          .bind(inviteMatch[1])
          .first<{ count: number }>();
        const inviteCount = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM organization_invites WHERE organization_id = ? AND accepted_at IS NULL AND expires_at > ? AND deleted_at IS NULL",
        )
          .bind(inviteMatch[1], new Date().toISOString())
          .first<{ count: number }>();
        if (
          Number(memberCount?.count ?? 0) + Number(inviteCount?.count ?? 0) >=
          memberLimit
        )
          return error(
            "PLAN_LIMIT_REACHED",
            `The ${normalizePlan(subscription?.plan)} plan has reached its team member limit`,
            rid,
            402,
            { limit: memberLimit, resource: "teamMembers" },
          );
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)
          return error(
            "VALIDATION_ERROR",
            "A valid email is required",
            rid,
            400,
          );
        const existing = await env.DB.prepare(
          "SELECT 1 FROM users u JOIN organization_members m ON m.user_id = u.id WHERE m.organization_id = ? AND m.deleted_at IS NULL AND u.email = ?",
        )
          .bind(inviteMatch[1], email)
          .first();
        if (existing)
          return error(
            "MEMBER_ALREADY_EXISTS",
            "This user is already a member",
            rid,
            409,
          );
        const token = randomToken("invite");
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
        try {
          await env.DB.prepare(
            "INSERT INTO organization_invites (id, organization_id, email, role, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
            .bind(
              id(),
              inviteMatch[1],
              email,
              role,
              await sha256(token),
              expiresAt,
              now,
            )
            .run();
        } catch {
          return error(
            "INVITE_ALREADY_EXISTS",
            "An active invite already exists for this email",
            rid,
            409,
          );
        }
        const link = `${env.PUBLIC_APP_URL}/api/v1/dashboard/invites/${token}/accept`;
        await env.EVENTS.send({
          type: "email.send",
          organizationId: inviteMatch[1],
          email,
          subject: "You have been invited to NitroPing",
          text: `You have been invited to join a NitroPing organization. Accept the invitation: ${link}`,
          html: `<p>You have been invited to join a NitroPing organization.</p><p><a href="${link}">Accept invitation</a></p>`,
          eventId: id(),
        });
        await writeOrganizationAudit(
          env,
          inviteMatch[1],
          "member.invited",
          "organization_invite",
          email,
          userId,
          { role },
        );
        return jsonResponse(
          { accepted: false, email, role, expiresAt },
          { status: 202, headers: cors },
        );
      }
      const inviteAcceptMatch = path.match(
        /^\/api\/v1\/dashboard\/invites\/([^/]+)\/accept$/,
      );
      if (inviteAcceptMatch && request.method === "POST") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response || !identity.email)
          return identity instanceof Response
            ? identity
            : error(
                "DASHBOARD_AUTH_REQUIRED",
                "An authenticated email is required",
                rid,
                401,
              );
        const invite = await env.DB.prepare(
          "SELECT id, organization_id AS organizationId, email, role, expires_at AS expiresAt, accepted_at AS acceptedAt FROM organization_invites WHERE token_hash = ?",
        )
          .bind(await sha256(inviteAcceptMatch[1]))
          .first<{
            id: string;
            organizationId: string;
            email: string;
            role: string;
            expiresAt: string;
            acceptedAt: string | null;
          }>();
        if (
          !invite ||
          invite.acceptedAt ||
          Date.parse(invite.expiresAt) <= Date.now() ||
          invite.email.toLowerCase() !== identity.email.toLowerCase()
        )
          return error(
            "INVITE_INVALID",
            "This invitation is invalid, expired, or belongs to another email",
            rid,
            400,
          );
        const userId = await userForIdentity(env, identity);
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO organization_members (organization_id, user_id, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(organization_id, user_id) DO UPDATE SET
               role = excluded.role, updated_at = excluded.updated_at, deleted_at = NULL`,
          ).bind(invite.organizationId, userId, invite.role, now, now),
          env.DB.prepare(
            "UPDATE organization_invites SET accepted_at = ? WHERE id = ? AND accepted_at IS NULL",
          ).bind(now, invite.id),
        ]);
        await writeOrganizationAudit(
          env,
          invite.organizationId,
          "member.joined",
          "user",
          userId,
          userId,
          { role: invite.role },
        );
        return jsonResponse(
          {
            accepted: true,
            organizationId: invite.organizationId,
            role: invite.role,
          },
          { headers: cors },
        );
      }
      const projectsPath = path === "/api/v1/dashboard/projects";
      if (projectsPath && request.method === "GET") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        const rows = await env.DB.prepare(
            "SELECT p.id, p.organization_id AS organizationId, p.name, p.slug, p.public_key AS publicKey, p.created_at AS createdAt FROM projects p JOIN organization_members m ON m.organization_id = p.organization_id WHERE m.user_id = ? AND m.deleted_at IS NULL AND p.deleted_at IS NULL ORDER BY p.created_at ASC",
        )
          .bind(userId)
          .all();
        return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
      }
      const projectCreateMatch = path.match(
        /^\/api\/v1\/dashboard\/(?:organizations\/([^/]+)\/)?projects$/,
      );
      if (projectCreateMatch && request.method === "POST") {
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response) return identity;
        const userId = await userForIdentity(env, identity);
        const body = await jsonBody(request);
        const organizationId =
          projectCreateMatch[1] ??
          (typeof body.organizationId === "string" ? body.organizationId : "");
        if (!organizationId)
          return error(
            "ORGANIZATION_ID_REQUIRED",
            "organizationId is required",
            rid,
            400,
          );
        if (!(await requireOrganizationMember(env, organizationId, userId)))
          return error(
            "FORBIDDEN",
            "Organization administrator access is required",
            rid,
            403,
          );
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug =
          typeof body.slug === "string"
            ? body.slug.trim().toLowerCase()
            : name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        if (
          name.length < 2 ||
          name.length > 120 ||
          !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)
        )
          return error(
            "VALIDATION_ERROR",
            "Project name or slug is invalid",
            rid,
            400,
          );
        const subscription = await env.DB.prepare(
          "SELECT plan FROM subscriptions WHERE organization_id = ?",
        )
          .bind(organizationId)
          .first<{ plan: string }>();
        const plan = normalizePlan(subscription?.plan);
        const projectCount = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM projects WHERE organization_id = ? AND deleted_at IS NULL",
        )
          .bind(organizationId)
          .first<{ count: number }>();
        const projectLimit = entitlementsFor(plan).projects;
        if (Number(projectCount?.count ?? 0) >= projectLimit)
          return error(
            "PLAN_LIMIT_REACHED",
            `The ${plan} plan has reached its project limit`,
            rid,
            402,
            { limit: projectLimit, resource: "projects" },
          );
        const projectId = id();
        const publicKey = randomToken("pk_live");
        const serverKey = randomToken("sk_live");
        const now = new Date().toISOString();
        try {
          await env.DB.batch([
            env.DB.prepare(
              "INSERT INTO projects (id, organization_id, name, slug, public_key, server_key_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ).bind(
              projectId,
              organizationId,
              name,
              slug,
              publicKey,
              await sha256(serverKey),
              now,
              now,
            ),
            env.DB.prepare(
              "INSERT INTO project_settings (project_id, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
            ).bind(projectId, organizationId, now, now),
            env.DB.prepare(
              "INSERT INTO project_api_keys (id, organization_id, project_id, kind, label, key_prefix, key_hash, created_at) VALUES (?, ?, ?, 'public', 'default public key', ?, ?, ?), (?, ?, ?, 'server', 'default server key', ?, ?, ?)",
            ).bind(
              id(),
              organizationId,
              projectId,
              publicKey.slice(0, 12),
              await sha256(publicKey),
              now,
              id(),
              organizationId,
              projectId,
              serverKey.slice(0, 12),
              await sha256(serverKey),
              now,
            ),
          ]);
        } catch {
          return error(
            "PROJECT_SLUG_TAKEN",
            "Project slug is already in use",
            rid,
            409,
          );
        }
        await writeOrganizationAudit(
          env,
          organizationId,
          "project.created",
          "project",
          projectId,
          userId,
        );
        return jsonResponse(
          {
            id: projectId,
            organizationId,
            name,
            slug,
            publicKey,
            serverKey,
            createdAt: now,
          },
          { status: 201, headers: cors },
        );
      }
      const projectUpdateMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)$/,
      );
      if (projectUpdateMatch && request.method === "PATCH") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectUpdateMatch[1],
          rid,
          "project:manage",
        );
        if (context instanceof Response) return context;
        const current = await env.DB.prepare(
          "SELECT name, slug, organization_id AS organizationId, public_key AS publicKey, created_at AS createdAt FROM projects WHERE id = ? AND organization_id = ? AND deleted_at IS NULL",
        )
          .bind(context.projectId, context.organizationId)
          .first<{
            name: string;
            slug: string;
            organizationId: string;
            publicKey: string;
            createdAt: string;
          }>();
        if (!current)
          return error(
            "PROJECT_NOT_FOUND",
            "The project was not found",
            rid,
            404,
          );
        const body = await jsonBody(request);
        const name =
          body.name === undefined
            ? current.name
            : typeof body.name === "string"
              ? body.name.trim()
              : "";
        const slug =
          body.slug === undefined
            ? current.slug
            : typeof body.slug === "string"
              ? body.slug.trim().toLowerCase()
              : "";
        if (
          name.length < 2 ||
          name.length > 120 ||
          !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)
        )
          return error(
            "VALIDATION_ERROR",
            "Project name or slug is invalid",
            rid,
            400,
          );
        const updatedAt = new Date().toISOString();
        try {
          await env.DB.prepare(
            "UPDATE projects SET name = ?, slug = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND deleted_at IS NULL",
          )
            .bind(
              name,
              slug,
              updatedAt,
              context.projectId,
              context.organizationId,
            )
            .run();
        } catch {
          return error(
            "PROJECT_SLUG_TAKEN",
            "Project slug is already in use",
            rid,
            409,
          );
        }
        await writeAudit(
          env,
          context,
          "project.updated",
          "project",
          context.projectId,
          { name, slug },
        );
        return jsonResponse(
          {
            id: context.projectId,
            organizationId: context.organizationId,
            name,
            slug,
            publicKey: current.publicKey,
            createdAt: current.createdAt,
            updatedAt,
          },
          { headers: cors },
        );
      }
      if (path === "/api/v1/webhooks/stripe" && request.method === "POST") {
        const billingEnv = env as Env & { STRIPE_WEBHOOK_SECRET?: string };
        if (!billingEnv.STRIPE_WEBHOOK_SECRET)
          return error(
            "BILLING_NOT_CONFIGURED",
            "Stripe webhooks are not configured for this deployment",
            rid,
            503,
          );
        const payload = await request.text();
        const signature = request.headers.get("stripe-signature") ?? "";
        const provider = new StripeBillingProvider(
          "unused",
          { pro: "", business: "" },
          billingEnv.STRIPE_WEBHOOK_SECRET,
        );
        if (!(await provider.verifyWebhook(payload, signature)))
          return error(
            "INVALID_STRIPE_SIGNATURE",
            "The Stripe webhook signature is invalid",
            rid,
            401,
          );
        let event: {
          id?: string;
          type?: string;
          data?: { object?: Record<string, unknown> };
        };
        try {
          event = JSON.parse(payload) as {
            type?: string;
            data?: { object?: Record<string, unknown> };
          };
        } catch {
          return error(
            "INVALID_STRIPE_PAYLOAD",
            "The Stripe webhook payload is not valid JSON",
            rid,
            400,
          );
        }
        if (!event.id || !/^evt_[A-Za-z0-9_]+$/.test(event.id))
          return error(
            "INVALID_STRIPE_PAYLOAD",
            "The Stripe webhook payload does not contain a valid event id",
            rid,
            400,
          );
        const stripeEventId = `stripe:${event.id}`;
        const alreadyProcessed = await env.DB.prepare(
          "SELECT event_id FROM processed_events WHERE event_id = ?",
        )
          .bind(stripeEventId)
          .first();
        if (alreadyProcessed)
          return jsonResponse(
            { received: true, duplicate: true },
            { headers: cors },
          );
        const object = event.data?.object ?? {};
        if (event.type === "checkout.session.completed") {
          const organizationId =
            typeof object.client_reference_id === "string"
              ? object.client_reference_id
              : typeof (
                    object.subscription as Record<string, unknown> | undefined
                  )?.metadata === "object"
                ? String(
                    (
                      (object.subscription as Record<string, unknown>)
                        .metadata as Record<string, unknown>
                    ).organizationId ?? "",
                  )
                : "";
          const subscriptionId =
            typeof object.subscription === "string" ? object.subscription : "";
          const customerId =
            typeof object.customer === "string" ? object.customer : null;
          const requestedPlan =
            typeof (object.metadata as Record<string, unknown> | undefined)
              ?.plan === "string"
              ? String((object.metadata as Record<string, unknown>).plan)
              : "pro";
          const plan = requestedPlan === "business" ? "business" : requestedPlan === "pro" ? "pro" : null;
          if (organizationId && subscriptionId && plan)
            await env.DB.prepare(
              "INSERT INTO subscriptions (organization_id, plan, status, provider_customer_id, provider_subscription_id, created_at, updated_at) VALUES (?, ?, 'active', ?, ?, ?, ?) ON CONFLICT(organization_id) DO UPDATE SET plan = excluded.plan, status = 'active', provider_customer_id = excluded.provider_customer_id, provider_subscription_id = excluded.provider_subscription_id, updated_at = excluded.updated_at",
            )
              .bind(
                organizationId,
                plan,
                customerId,
                subscriptionId,
                new Date().toISOString(),
                new Date().toISOString(),
              )
              .run();
          else if (organizationId && subscriptionId)
            return error(
              "INVALID_STRIPE_PLAN",
              "The Stripe checkout session contains an unsupported plan",
              rid,
              400,
            );
        }
        if (
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.deleted"
        ) {
          const subscriptionId = typeof object.id === "string" ? object.id : "";
          const existing = await env.DB.prepare(
            "SELECT organization_id AS organizationId FROM subscriptions WHERE provider_subscription_id = ?",
          )
            .bind(subscriptionId)
            .first<{ organizationId: string }>();
          if (existing) {
            const status =
              event.type === "customer.subscription.deleted"
                ? "canceled"
                : String(object.status ?? "active");
            const currentPeriodEnd =
              typeof object.current_period_end === "number"
                ? new Date(object.current_period_end * 1000).toISOString()
                : null;
            await env.DB.prepare(
              "UPDATE subscriptions SET status = ?, current_period_end = ?, updated_at = ? WHERE organization_id = ?",
            )
              .bind(
                status,
                currentPeriodEnd,
                new Date().toISOString(),
                existing.organizationId,
              )
              .run();
          }
        }
        await env.DB.prepare(
          "INSERT OR IGNORE INTO processed_events (event_id, event_type, processed_at) VALUES (?, ?, ?)",
        )
          .bind(stripeEventId, event.type ?? "unknown", new Date().toISOString())
          .run();
        return jsonResponse({ received: true }, { headers: cors });
      }
      const customDomainMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/custom-domain$/,
      );
      if (
        customDomainMatch &&
        ["GET", "POST", "DELETE"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          customDomainMatch[1],
          rid,
          "project:manage",
        );
        if (context instanceof Response) return context;
        let existing = await env.DB.prepare(
          "SELECT id, hostname, cloudflare_hostname_id AS cloudflareHostnameId, status, ssl_status AS sslStatus, validation_records_json AS validationRecords, created_at AS createdAt, updated_at AS updatedAt FROM custom_domains WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1",
        )
          .bind(context.organizationId, context.projectId)
          .first<Record<string, unknown>>();
        const toResponse = (row: Record<string, unknown> | null) =>
          row
            ? {
                ...row,
                validationRecords: JSON.parse(
                  String(row.validationRecords ?? "[]"),
                ),
              }
            : null;
        if (request.method === "GET") {
          const provider = customDomainProvider(env);
          if (existing?.cloudflareHostnameId && provider) {
            try {
              const remote = await provider.get(
                String(existing.cloudflareHostnameId),
              );
              const now = new Date().toISOString();
              await env.DB.prepare(
                "UPDATE custom_domains SET status = ?, ssl_status = ?, validation_records_json = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
              )
                .bind(
                  remote.status,
                  remote.sslStatus,
                  JSON.stringify(remote.validationRecords),
                  now,
                  String(existing.id),
                  context.organizationId,
                  context.projectId,
                )
                .run();
              existing = {
                ...existing,
                status: remote.status,
                sslStatus: remote.sslStatus,
                validationRecords: JSON.stringify(remote.validationRecords),
                updatedAt: now,
              };
            } catch {
              // A transient Cloudflare API failure must not hide the last known state.
            }
          }
          return jsonResponse({ domain: toResponse(existing) }, { headers: cors });
        }
        if (request.method === "DELETE") {
          if (!existing)
            return error(
              "CUSTOM_DOMAIN_NOT_FOUND",
              "No custom domain is configured for this project",
              rid,
              404,
            );
          const provider = customDomainProvider(env);
          if (provider && existing.cloudflareHostnameId) {
            try {
              await provider.remove(String(existing.cloudflareHostnameId));
            } catch (cause) {
              return error(
                "CUSTOM_DOMAIN_PROVIDER_ERROR",
                "Cloudflare rejected the custom-domain removal",
                rid,
                502,
                String(env.ENVIRONMENT) === "development"
                  ? String(cause)
                  : {},
              );
            }
          }
          const now = new Date().toISOString();
          await env.DB.prepare(
            "UPDATE custom_domains SET deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(now, now, String(existing.id), context.organizationId, context.projectId)
            .run();
          await writeAudit(
            env,
            context,
            "custom_domain.deleted",
            "custom_domain",
            String(existing.id),
          );
          return new Response(null, { status: 204, headers: cors });
        }
        const customEnv = env as CustomDomainEnvironment;
        const subscription = await env.DB.prepare(
          "SELECT plan FROM subscriptions WHERE organization_id = ?",
        )
          .bind(context.organizationId)
          .first<{ plan: string }>();
        if (!hasEntitlement(subscription?.plan, "customDomains"))
          return error(
            "PLAN_FEATURE_REQUIRED",
            "Custom domains are available on the Business plan",
            rid,
            402,
            { feature: "custom_domains", requiredPlan: "business" },
          );
        const provider = customDomainProvider(env);
        if (!provider)
          return error(
            "CUSTOM_DOMAIN_NOT_CONFIGURED",
            "Custom domains require Cloudflare for SaaS configuration",
            rid,
            503,
          );
        if (existing)
          return error(
            "CUSTOM_DOMAIN_EXISTS",
            "This project already has a custom domain",
            rid,
            409,
          );
        const body = await jsonBody(request);
        const hostname = typeof body.hostname === "string" ? body.hostname : "";
        const normalizedHostname = hostname.trim().toLowerCase().replace(/\.$/, "");
        const validationError = validateCustomHostname(
          normalizedHostname,
          customEnv.CUSTOM_HOSTNAME_ZONE_NAME ?? "nitroping.dev",
        );
        if (validationError)
          return error("INVALID_CUSTOM_DOMAIN", validationError, rid, 400);
        try {
          const remote = await provider.create(normalizedHostname, {
            organizationId: context.organizationId,
            projectId: context.projectId,
          });
          const now = new Date().toISOString();
          const domainId = id();
          await env.DB.prepare(
            "INSERT INTO custom_domains (id, organization_id, project_id, hostname, cloudflare_hostname_id, status, ssl_status, validation_records_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
            .bind(
              domainId,
              context.organizationId,
              context.projectId,
              remote.hostname,
              remote.id,
              remote.status,
              remote.sslStatus,
              JSON.stringify(remote.validationRecords),
              now,
              now,
            )
            .run();
          await writeAudit(env, context, "custom_domain.created", "custom_domain", domainId, {
            hostname: remote.hostname,
            status: remote.status,
          });
          return jsonResponse(
            {
              domain: {
                id: domainId,
                hostname: remote.hostname,
                status: remote.status,
                sslStatus: remote.sslStatus,
                validationRecords: remote.validationRecords,
                createdAt: now,
                updatedAt: now,
              },
            },
            { status: 201, headers: cors },
          );
        } catch (cause) {
          return error(
            "CUSTOM_DOMAIN_PROVIDER_ERROR",
            "Cloudflare rejected the custom domain",
            rid,
            502,
            String(env.ENVIRONMENT) === "development" ? String(cause) : {},
          );
        }
      }
      const webhookMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/webhooks(?:\/([^/]+))?$/,
      );
      if (webhookMatch && ["GET", "POST", "DELETE"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          webhookMatch[1],
          rid,
          "developer:manage",
        );
        if (context instanceof Response) return context;
        if (request.method === "POST") {
          const featureError = await requirePlanFeature(
            env,
            context.organizationId,
            "webhooks",
            rid,
          );
          if (featureError) return featureError;
        }
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT id, url, events_json AS events, active, created_at AS createdAt FROM webhooks WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all<Record<string, unknown>>();
          return jsonResponse(
            {
              items: (rows.results ?? []).map((row) => ({
                ...row,
                events: JSON.parse(String(row.events ?? "[]")),
                active: Boolean(row.active),
              })),
            },
            { headers: cors },
          );
        }
        if (request.method === "DELETE") {
          if (!webhookMatch[2])
            return error(
              "WEBHOOK_ID_REQUIRED",
              "Webhook ID is required",
              rid,
              400,
            );
          const result = await env.DB.prepare(
            "UPDATE webhooks SET active = 0 WHERE id = ? AND organization_id = ? AND project_id = ?",
          )
            .bind(webhookMatch[2], context.organizationId, context.projectId)
            .run();
          if (!result.meta.changes)
            return error(
              "WEBHOOK_NOT_FOUND",
              "Webhook was not found",
              rid,
              404,
            );
          await env.CACHE.delete(`webhook:secret:${webhookMatch[2]}`);
          await writeAudit(
            env,
            context,
            "webhook.disabled",
            "webhook",
            webhookMatch[2],
          );
          return new Response(null, { status: 204, headers: cors });
        }
        const body = await jsonBody(request);
        let webhookUrl: URL;
        try {
          webhookUrl = new URL(typeof body.url === "string" ? body.url : "");
        } catch {
          return error("VALIDATION_ERROR", "Webhook URL is invalid", rid, 400);
        }
        if (
          webhookUrl.protocol !== "https:" ||
          webhookUrl.username ||
          webhookUrl.password ||
          isPrivateWebhookHost(webhookUrl.hostname)
        )
          return error(
            "VALIDATION_ERROR",
            "Webhook URL must use a public HTTPS host",
            rid,
            400,
          );
        const events = Array.isArray(body.events)
          ? body.events.filter(
              (event): event is WebhookEventType =>
                typeof event === "string" &&
                webhookEventTypes.includes(event as WebhookEventType),
            )
          : [...webhookEventTypes];
        if (!events.length)
          return error(
            "VALIDATION_ERROR",
            "At least one webhook event is required",
            rid,
            400,
          );
        const webhookId = id();
        const secret = randomToken("whsec");
        const now = new Date().toISOString();
        await env.DB.prepare(
          "INSERT INTO webhooks (id, organization_id, project_id, url, secret_hash, events_json, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        )
          .bind(
            webhookId,
            context.organizationId,
            context.projectId,
            webhookUrl.toString(),
            await sha256(secret),
            JSON.stringify(events),
            now,
          )
          .run();
        await env.CACHE.put(`webhook:secret:${webhookId}`, secret);
        await writeAudit(
          env,
          context,
          "webhook.created",
          "webhook",
          webhookId,
          { events },
        );
        return jsonResponse(
          {
            id: webhookId,
            url: webhookUrl.toString(),
            events,
            active: true,
            secret,
            createdAt: now,
          },
          { status: 201, headers: cors },
        );
      }
      const settingsMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/settings$/,
      );
      if (settingsMatch && ["GET", "PATCH"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          settingsMatch[1],
          rid,
          "project:manage",
        );
        if (context instanceof Response) return context;
        const now = new Date().toISOString();
        await env.DB.prepare(
          "INSERT OR IGNORE INTO project_settings (project_id, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
        )
          .bind(context.projectId, context.organizationId, now, now)
          .run();
        if (request.method === "GET") {
          const settings = await env.DB.prepare(
            "SELECT theme_json AS theme, allowed_metadata_json AS allowedMetadata, retention_days AS retentionDays, origins_json AS origins FROM project_settings WHERE project_id = ? AND organization_id = ?",
          )
            .bind(context.projectId, context.organizationId)
            .first<Record<string, unknown>>();
          return jsonResponse(
            {
              theme: JSON.parse(String(settings?.theme ?? "{}")),
              allowedMetadata: JSON.parse(
                String(settings?.allowedMetadata ?? "[]"),
              ),
              retentionDays: Number(settings?.retentionDays ?? 365),
              origins: JSON.parse(String(settings?.origins ?? "[]")),
            },
            { headers: cors },
          );
        }
        const body = await jsonBody(request);
        if (body.theme !== undefined) {
          const featureError = await requirePlanFeature(
            env,
            context.organizationId,
            "customTheme",
            rid,
          );
          if (featureError) return featureError;
        }
        const current = await env.DB.prepare(
          "SELECT theme_json, allowed_metadata_json, retention_days, origins_json FROM project_settings WHERE project_id = ? AND organization_id = ?",
        )
          .bind(context.projectId, context.organizationId)
          .first<{
            theme_json: string;
            allowed_metadata_json: string;
            retention_days: number;
            origins_json: string;
          }>();
        if (!current)
          return error(
            "PROJECT_SETTINGS_NOT_FOUND",
            "Project settings were not found",
            rid,
            404,
          );
        const theme =
          body.theme &&
          typeof body.theme === "object" &&
          !Array.isArray(body.theme)
            ? body.theme
            : JSON.parse(current.theme_json);
        const allowedMetadata =
          body.allowedMetadata === undefined
            ? JSON.parse(current.allowed_metadata_json)
            : body.allowedMetadata;
        const retentionDays =
          body.retentionDays === undefined
            ? current.retention_days
            : Number(body.retentionDays);
        const origins =
          body.origins === undefined
            ? JSON.parse(current.origins_json)
            : body.origins;
        const themeError = validateWidgetTheme(theme);
        if (themeError) return error("VALIDATION_ERROR", themeError, rid, 400);
        if (
          !Array.isArray(allowedMetadata) ||
          allowedMetadata.length > 100 ||
          allowedMetadata.some(
            (field) =>
              typeof field !== "string" ||
              !/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(field),
          )
        )
          return error(
            "VALIDATION_ERROR",
            "Allowed metadata fields are invalid",
            rid,
            400,
          );
        const customFieldIds = Array.isArray(
          (theme as Record<string, unknown>).customFields,
        )
          ? (
              (theme as Record<string, unknown>).customFields as Array<
                Record<string, unknown>
              >
            ).map((field) => String(field.id))
          : [];
        const effectiveAllowedMetadata = [
          ...new Set([...allowedMetadata, ...customFieldIds]),
        ];
        if (effectiveAllowedMetadata.length > 100)
          return error(
            "VALIDATION_ERROR",
            "A maximum of 100 metadata fields is allowed",
            rid,
            400,
          );
        if (
          !Number.isInteger(retentionDays) ||
          retentionDays < 1 ||
          retentionDays > 3650
        )
          return error(
            "VALIDATION_ERROR",
            "Retention must be between 1 and 3650 days",
            rid,
            400,
          );
        if (
          !Array.isArray(origins) ||
          origins.length > 50 ||
          origins.some(
            (origin) =>
              typeof origin !== "string" || !/^https:\/\//.test(origin),
          )
        )
          return error(
            "VALIDATION_ERROR",
            "Origins must be HTTPS URLs",
            rid,
            400,
          );
        await env.DB.prepare(
          "UPDATE project_settings SET theme_json = ?, allowed_metadata_json = ?, retention_days = ?, origins_json = ?, updated_at = ? WHERE project_id = ? AND organization_id = ?",
        )
          .bind(
            JSON.stringify(theme),
            JSON.stringify(effectiveAllowedMetadata),
            retentionDays,
            JSON.stringify(origins),
            now,
            context.projectId,
            context.organizationId,
          )
          .run();
        await writeAudit(
          env,
          context,
          "project.settings.updated",
          "project",
          context.projectId,
          {
            retentionDays,
            originCount: origins.length,
            metadataFieldCount: effectiveAllowedMetadata.length,
            customFieldCount: customFieldIds.length,
          },
        );
        return jsonResponse(
          {
            theme,
            allowedMetadata: effectiveAllowedMetadata,
            retentionDays,
            origins,
          },
          { headers: cors },
        );
      }
      const notificationMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/notifications$/,
      );
      if (notificationMatch && ["GET", "PATCH"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          notificationMatch[1],
          rid,
          "project:manage",
        );
        if (context instanceof Response) return context;
        const identity = await requireIdentity(request, env, rid);
        if (identity instanceof Response || !identity.email)
          return identity instanceof Response
            ? identity
            : error(
                "DASHBOARD_AUTH_REQUIRED",
                "An authenticated email is required",
                rid,
                401,
              );
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT event_type AS eventType, enabled FROM notification_preferences WHERE organization_id = ? AND project_id = ? AND email = ? ORDER BY event_type ASC",
          )
            .bind(
              context.organizationId,
              context.projectId,
              identity.email.toLowerCase(),
            )
            .all<{ eventType: string; enabled: number }>();
          const saved = new Map(
            (rows.results ?? []).map((row) => [
              row.eventType,
              Boolean(row.enabled),
            ]),
          );
          return jsonResponse(
            {
              items: notificationEventTypes.map((eventType) => ({
                eventType,
                enabled: saved.get(eventType) ?? true,
              })),
            },
            { headers: cors },
          );
        }
        const body = await jsonBody(request);
        const eventType =
          typeof body.eventType === "string" ? body.eventType : "";
        if (
          !notificationEventTypes.includes(
            eventType as (typeof notificationEventTypes)[number],
          ) ||
          typeof body.enabled !== "boolean"
        )
          return error(
            "VALIDATION_ERROR",
            "eventType and boolean enabled are required",
            rid,
            400,
          );
        const now = new Date().toISOString();
        await env.DB.prepare(
          `INSERT INTO notification_preferences (id, organization_id, project_id, email, event_type, enabled, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(project_id, email, event_type) DO UPDATE SET enabled = excluded.enabled`,
        )
          .bind(
            id(),
            context.organizationId,
            context.projectId,
            identity.email.toLowerCase(),
            eventType,
            body.enabled ? 1 : 0,
            now,
          )
          .run();
        await writeAudit(
          env,
          context,
          "notification.preference.updated",
          "notification_preference",
          `${identity.email}:${eventType}`,
          { eventType, enabled: body.enabled },
        );
        return jsonResponse(
          { eventType, enabled: body.enabled },
          { headers: cors },
        );
      }
      const usageMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/usage$/,
      );
      if (usageMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          usageMatch[1],
          rid,
        );
        if (context instanceof Response) return context;
        const usage = await currentUsage(env, context.organizationId);
        return jsonResponse(
          { ...usage, projectId: context.projectId },
          { headers: cors },
        );
      }
      const analyticsMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/analytics$/,
      );
      if (analyticsMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          analyticsMatch[1],
          rid,
        );
        if (context instanceof Response) return context;
        const [
          total,
          statuses,
          platforms,
          types,
          volume,
          responseTime,
          resolutionTime,
        ] = await Promise.all([
          env.DB.prepare(
            "SELECT COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(context.organizationId, context.projectId)
            .first<{ count: number }>(),
          env.DB.prepare(
            "SELECT status, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL GROUP BY status ORDER BY count DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all(),
          env.DB.prepare(
            "SELECT COALESCE(platform, 'unknown') AS platform, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL GROUP BY platform ORDER BY count DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all(),
          env.DB.prepare(
            "SELECT type, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL GROUP BY type ORDER BY count DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all(),
          env.DB.prepare(
            "SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL AND datetime(created_at) >= datetime('now', '-30 days') GROUP BY substr(created_at, 1, 10) ORDER BY date ASC",
          )
            .bind(context.organizationId, context.projectId)
            .all(),
          env.DB.prepare(
            "SELECT AVG((julianday(replies.repliedAt) - julianday(f.created_at)) * 1440) AS averageMinutes FROM feedback_items f JOIN (SELECT feedback_id, MIN(created_at) AS repliedAt FROM feedback_comments WHERE organization_id = ? AND project_id = ? AND is_internal = 0 AND deleted_at IS NULL GROUP BY feedback_id) replies ON replies.feedback_id = f.id WHERE f.organization_id = ? AND f.project_id = ? AND f.deleted_at IS NULL",
          )
            .bind(
              context.organizationId,
              context.projectId,
              context.organizationId,
              context.projectId,
            )
            .first<{ averageMinutes: number | null }>(),
          env.DB.prepare(
            "SELECT AVG((julianday(resolved.resolvedAt) - julianday(f.created_at)) * 1440) AS averageMinutes FROM feedback_items f JOIN (SELECT feedback_id, MIN(created_at) AS resolvedAt FROM feedback_status_history WHERE organization_id = ? AND project_id = ? AND to_status = 'resolved' GROUP BY feedback_id) resolved ON resolved.feedback_id = f.id WHERE f.organization_id = ? AND f.project_id = ? AND f.deleted_at IS NULL",
          )
            .bind(
              context.organizationId,
              context.projectId,
              context.organizationId,
              context.projectId,
            )
            .first<{ averageMinutes: number | null }>(),
        ]);
        return jsonResponse(
          {
            total: Number(total?.count ?? 0),
            statuses: statuses.results ?? [],
            platforms: platforms.results ?? [],
            types: types.results ?? [],
            volume: volume.results ?? [],
            averageResponseMinutes:
              responseTime?.averageMinutes == null
                ? null
                : Math.round(Number(responseTime.averageMinutes)),
            averageResolutionMinutes:
              resolutionTime?.averageMinutes == null
                ? null
                : Math.round(Number(resolutionTime.averageMinutes)),
            generatedAt: new Date().toISOString(),
          },
          { headers: cors },
        );
      }
      const apiKeysMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/api-keys(?:\/([^/]+))?$/,
      );
      if (apiKeysMatch && ["GET", "POST", "DELETE"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          apiKeysMatch[1],
          rid,
          "developer:manage",
        );
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT id, kind, label, key_prefix AS keyPrefix, created_at AS createdAt, revoked_at AS revokedAt FROM project_api_keys WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        if (request.method === "DELETE") {
          if (!apiKeysMatch[2])
            return error(
              "API_KEY_ID_REQUIRED",
              "API key ID is required",
              rid,
              400,
            );
          const result = await env.DB.prepare(
            "UPDATE project_api_keys SET revoked_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND revoked_at IS NULL",
          )
            .bind(
              new Date().toISOString(),
              apiKeysMatch[2],
              context.organizationId,
              context.projectId,
            )
            .run();
          if (!result.meta.changes)
            return error(
              "API_KEY_NOT_FOUND",
              "API key was not found",
              rid,
              404,
            );
          await writeAudit(
            env,
            context,
            "api_key.revoked",
            "api_key",
            apiKeysMatch[2],
          );
          return new Response(null, { status: 204, headers: cors });
        }
        const body = await jsonBody(request);
        const kind =
          body.kind === "public"
            ? "public"
            : body.kind === "server"
              ? "server"
              : "";
        const label =
          typeof body.label === "string" && body.label.trim().length > 0
            ? body.label.trim().slice(0, 120)
            : `rotated ${kind} key`;
        if (!kind)
          return error(
            "VALIDATION_ERROR",
            "API key kind must be public or server",
            rid,
            400,
          );
        const key = randomToken(kind === "public" ? "pk_live" : "sk_live");
        const keyId = id();
        const now = new Date().toISOString();
        const keyStatements = [
          ...(kind === "public"
            ? [
                env.DB.prepare(
                  "UPDATE project_api_keys SET revoked_at = ? WHERE organization_id = ? AND project_id = ? AND kind = 'public' AND revoked_at IS NULL",
                ).bind(now, context.organizationId, context.projectId),
                env.DB.prepare(
                  "UPDATE projects SET public_key = ?, updated_at = ? WHERE id = ? AND organization_id = ?",
                ).bind(key, now, context.projectId, context.organizationId),
              ]
            : [
                env.DB.prepare(
                  "UPDATE projects SET server_key_hash = ?, updated_at = ? WHERE id = ? AND organization_id = ?",
                ).bind(await sha256(key), now, context.projectId, context.organizationId),
              ]),
          env.DB.prepare(
            "INSERT INTO project_api_keys (id, organization_id, project_id, kind, label, key_prefix, key_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ).bind(
            keyId,
            context.organizationId,
            context.projectId,
            kind,
            label,
            key.slice(0, 12),
            await sha256(key),
            now,
          ),
        ];
        await env.DB.batch(keyStatements);
        await writeAudit(env, context, "api_key.created", "api_key", keyId, {
          kind,
          label,
        });
        return jsonResponse(
          {
            id: keyId,
            kind,
            label,
            key,
            keyPrefix: key.slice(0, 12),
            createdAt: now,
          },
          { status: 201, headers: cors },
        );
      }
      if (path === "/api/v1/dashboard/billing" && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "billing:manage",
        );
        if (context instanceof Response) return context;
        const subscription = await env.DB.prepare(
          "SELECT plan, status, provider_customer_id AS providerCustomerId, provider_subscription_id AS providerSubscriptionId, current_period_end AS currentPeriodEnd, created_at AS createdAt, updated_at AS updatedAt FROM subscriptions WHERE organization_id = ?",
        )
          .bind(context.organizationId)
          .first();
        return jsonResponse(
          subscription ?? { plan: "free", status: "active" },
          { headers: cors },
        );
      }
      if (
        path === "/api/v1/dashboard/billing/checkout" &&
        request.method === "POST"
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "billing:manage",
        );
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const plan =
          body.plan === "pro" || body.plan === "business"
            ? (body.plan as BillingPlan)
            : null;
        if (!plan)
          return error(
            "VALIDATION_ERROR",
            "A valid billing plan is required",
            rid,
            400,
          );
        const billingEnv = env as Env & {
          STRIPE_SECRET_KEY?: string;
          STRIPE_PRICE_PRO?: string;
          STRIPE_PRICE_BUSINESS?: string;
        };
        if (
          !billingEnv.STRIPE_SECRET_KEY ||
          !billingEnv.STRIPE_PRICE_PRO ||
          !billingEnv.STRIPE_PRICE_BUSINESS
        )
          return error(
            "BILLING_NOT_CONFIGURED",
            "Stripe billing is not configured for this deployment",
            rid,
            503,
          );
        const subscription = await env.DB.prepare(
          "SELECT provider_customer_id AS providerCustomerId FROM subscriptions WHERE organization_id = ?",
        )
          .bind(context.organizationId)
          .first<{ providerCustomerId: string | null }>();
        const provider = new StripeBillingProvider(
          billingEnv.STRIPE_SECRET_KEY,
          {
            pro: billingEnv.STRIPE_PRICE_PRO,
            business: billingEnv.STRIPE_PRICE_BUSINESS,
          },
        );
        const checkout = await provider.createCheckoutSession({
          organizationId: context.organizationId,
          plan,
          customerId: subscription?.providerCustomerId ?? undefined,
          successUrl: `${env.PUBLIC_APP_URL}/dashboard?billing=success`,
          cancelUrl: `${env.PUBLIC_APP_URL}/dashboard?billing=cancelled`,
        });
        return jsonResponse(checkout, { status: 201, headers: cors });
      }
      const categoriesDashboardMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/categories(?:\/([^/]+))?$/,
      );
      if (
        categoriesDashboardMatch &&
        ["GET", "POST", "PATCH", "DELETE"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          categoriesDashboardMatch[1],
          rid,
          request.method === "GET" ? "feedback:read" : "project:manage",
        );
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          if (categoriesDashboardMatch[2]) {
            const category = await env.DB.prepare(
              "SELECT id, name, slug, created_at AS createdAt FROM categories WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
            )
              .bind(
                categoriesDashboardMatch[2],
                context.organizationId,
                context.projectId,
              )
              .first();
            return category
              ? jsonResponse(category, { headers: cors })
              : error("CATEGORY_NOT_FOUND", "Category was not found", rid, 404);
          }
          const rows = await env.DB.prepare(
            "SELECT id, name, slug, created_at AS createdAt FROM categories WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY name ASC",
          )
            .bind(context.organizationId, context.projectId)
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        if (request.method === "POST" && !categoriesDashboardMatch[2]) {
          const body = await jsonBody(request);
          const name = typeof body.name === "string" ? body.name.trim() : "";
          const slug =
            typeof body.slug === "string"
              ? body.slug.trim().toLowerCase()
              : name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
          if (
            name.length < 2 ||
            name.length > 80 ||
            !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)
          )
            return error(
              "VALIDATION_ERROR",
              "Category name or slug is invalid",
              rid,
              400,
            );
          const category = {
            id: id(),
            name,
            slug,
            createdAt: new Date().toISOString(),
          };
          try {
            await env.DB.prepare(
              "INSERT INTO categories (id, organization_id, project_id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
              .bind(
                category.id,
                context.organizationId,
                context.projectId,
                name,
                slug,
                category.createdAt,
                category.createdAt,
              )
              .run();
          } catch {
            return error(
              "CATEGORY_SLUG_TAKEN",
              "Category slug is already in use",
              rid,
              409,
            );
          }
          await writeAudit(
            env,
            context,
            "category.created",
            "category",
            category.id,
            { name, slug },
          );
          return jsonResponse(category, { status: 201, headers: cors });
        }
        if (!categoriesDashboardMatch[2])
          return error(
            "CATEGORY_ID_REQUIRED",
            "Category ID is required",
            rid,
            400,
          );
        const existing = await env.DB.prepare(
          "SELECT id, name, slug, created_at AS createdAt FROM categories WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            categoriesDashboardMatch[2],
            context.organizationId,
            context.projectId,
          )
          .first<{
            id: string;
            name: string;
            slug: string;
            createdAt: string;
          }>();
        if (!existing)
          return error(
            "CATEGORY_NOT_FOUND",
            "Category was not found",
            rid,
            404,
          );
        if (request.method === "DELETE") {
          await env.DB.prepare(
            "UPDATE feedback_items SET category_id = NULL WHERE category_id = ? AND organization_id = ? AND project_id = ?",
          )
            .bind(existing.id, context.organizationId, context.projectId)
            .run();
          await env.DB.prepare(
            "UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(new Date().toISOString(), new Date().toISOString(), existing.id, context.organizationId, context.projectId)
            .run();
          await writeAudit(
            env,
            context,
            "category.deleted",
            "category",
            existing.id,
            { name: existing.name, slug: existing.slug },
          );
          return new Response(null, { status: 204, headers: cors });
        }
        const body = await jsonBody(request);
        const name =
          body.name === undefined
            ? existing.name
            : typeof body.name === "string"
              ? body.name.trim()
              : "";
        const slug =
          body.slug === undefined
            ? existing.slug
            : typeof body.slug === "string"
              ? body.slug.trim().toLowerCase()
              : "";
        if (
          name.length < 2 ||
          name.length > 80 ||
          !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)
        )
          return error(
            "VALIDATION_ERROR",
            "Category name or slug is invalid",
            rid,
            400,
          );
        const category = {
          id: existing.id,
          name,
          slug,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };
        try {
          await env.DB.prepare(
            "UPDATE categories SET name = ?, slug = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(
              name,
              slug,
              category.updatedAt,
              category.id,
              context.organizationId,
              context.projectId,
            )
            .run();
        } catch {
          return error(
            "CATEGORY_SLUG_TAKEN",
            "Category slug is already in use",
            rid,
            409,
          );
        }
        await writeAudit(
          env,
          context,
          "category.updated",
          "category",
          category.id,
          { name, slug },
        );
        return jsonResponse(category, { headers: cors });
      }
      const tagsDashboardMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/tags$/,
      );
      if (tagsDashboardMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          tagsDashboardMatch[1],
          rid,
          request.method === "GET" ? "feedback:read" : "project:manage",
        );
        if (context instanceof Response) return context;
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT id, name, slug, created_at AS createdAt FROM feedback_tags WHERE organization_id = ? AND project_id = ? ORDER BY name ASC",
          )
            .bind(context.organizationId, context.projectId)
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug =
          typeof body.slug === "string"
            ? body.slug.trim().toLowerCase()
            : name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
        if (
          name.length < 1 ||
          name.length > 80 ||
          !/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)
        )
          return error(
            "VALIDATION_ERROR",
            "Tag name or slug is invalid",
            rid,
            400,
          );
        const tag = {
          id: id(),
          name,
          slug,
          createdAt: new Date().toISOString(),
        };
        try {
          await env.DB.prepare(
            "INSERT INTO feedback_tags (id, organization_id, project_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          )
            .bind(
              tag.id,
              context.organizationId,
              context.projectId,
              name,
              slug,
              tag.createdAt,
            )
            .run();
        } catch {
          return error(
            "TAG_SLUG_TAKEN",
            "Tag slug is already in use",
            rid,
            409,
          );
        }
        await writeAudit(env, context, "tag.created", "tag", tag.id, {
          name,
          slug,
        });
        return jsonResponse(tag, { status: 201, headers: cors });
      }
      const feedbackTagsMatch = path.match(
        /^\/api\/v1\/dashboard\/feedback\/([^/]+)\/tags(?:\/([^/]+))?$/,
      );
      if (
        feedbackTagsMatch &&
        ["GET", "POST", "DELETE"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          request.method === "GET" ? "feedback:read" : "feedback:write",
        );
        if (context instanceof Response) return context;
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(feedbackTagsMatch[1], context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT t.id, t.name, t.slug, t.created_at AS createdAt FROM feedback_tags t JOIN feedback_tag_links l ON l.tag_id = t.id WHERE l.feedback_id = ? AND t.organization_id = ? AND t.project_id = ? ORDER BY t.name ASC",
          )
            .bind(
              feedbackTagsMatch[1],
              context.organizationId,
              context.projectId,
            )
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const tagId =
          feedbackTagsMatch[2] ??
          (typeof body.tagId === "string" ? body.tagId : "");
        if (!tagId)
          return error("TAG_ID_REQUIRED", "tagId is required", rid, 400);
        const tag = await env.DB.prepare(
          "SELECT id FROM feedback_tags WHERE id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(tagId, context.organizationId, context.projectId)
          .first();
        if (!tag) return error("TAG_NOT_FOUND", "Tag was not found", rid, 404);
        if (request.method === "POST")
          await env.DB.prepare(
            "INSERT OR IGNORE INTO feedback_tag_links (organization_id, project_id, feedback_id, tag_id, created_at) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(
              context.organizationId,
              context.projectId,
              feedbackTagsMatch[1],
              tagId,
              new Date().toISOString(),
            )
            .run();
        else
          await env.DB.prepare(
            "DELETE FROM feedback_tag_links WHERE organization_id = ? AND project_id = ? AND feedback_id = ? AND tag_id = ?",
          )
            .bind(
              context.organizationId,
              context.projectId,
              feedbackTagsMatch[1],
              tagId,
            )
            .run();
        await writeAudit(
          env,
          context,
          request.method === "POST"
            ? "feedback.tag.added"
            : "feedback.tag.removed",
          "feedback",
          feedbackTagsMatch[1],
          { tagId },
        );
        return request.method === "POST"
          ? jsonResponse(
              { feedbackId: feedbackTagsMatch[1], tagId },
              { status: 201, headers: cors },
            )
          : new Response(null, { status: 204, headers: cors });
      }
      const roadmapDashboardMatch = path.match(
        /^\/api\/v1\/dashboard\/(?:projects\/([^/]+)\/roadmap|roadmap)$/,
      );
      const roadmapProjectId =
        roadmapDashboardMatch?.[1] ?? url.searchParams.get("projectId");
      if (
        roadmapDashboardMatch &&
        roadmapProjectId &&
        ["GET", "POST"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          roadmapProjectId,
          rid,
          request.method === "GET" ? "feedback:read" : "roadmap:manage",
        );
        if (context instanceof Response) return context;
        if (request.method === "POST") {
          const featureError = await requirePlanFeature(
            env,
            context.organizationId,
            "roadmap",
            rid,
          );
          if (featureError) return featureError;
        }
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT id, title, body, status, created_at AS createdAt, updated_at AS updatedAt FROM roadmap_items WHERE organization_id = ? AND project_id = ? ORDER BY updated_at DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description =
          typeof body.body === "string" ? body.body.trim() : "";
        const status =
          typeof body.status === "string" ? body.status : "planned";
        if (
          title.length < 2 ||
          title.length > 160 ||
          description.length > 20_000 ||
          !["planned", "in_progress", "completed"].includes(status)
        )
          return error("VALIDATION_ERROR", "Roadmap item is invalid", rid, 400);
        const now = new Date().toISOString();
        const item = {
          id: id(),
          title,
          body: description,
          status,
          createdAt: now,
          updatedAt: now,
        };
        await env.DB.prepare(
          "INSERT INTO roadmap_items (id, organization_id, project_id, title, body, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            item.id,
            context.organizationId,
            context.projectId,
            title,
            description,
            status,
            now,
            now,
          )
          .run();
        await writeAudit(env, context, "roadmap.created", "roadmap", item.id, {
          status,
        });
        return jsonResponse(item, { status: 201, headers: cors });
      }
      const roadmapUpdateMatch = path.match(
        /^\/api\/v1\/dashboard\/roadmap\/([^/]+)$/,
      );
      const roadmapFeedbackMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/roadmap\/([^/]+)\/feedback(?:\/([^/]+))?$/,
      );
      if (
        roadmapFeedbackMatch &&
        ["GET", "POST", "DELETE"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          roadmapFeedbackMatch[1],
          rid,
          request.method === "GET" ? "feedback:read" : "roadmap:manage",
        );
        if (context instanceof Response) return context;
        if (request.method !== "GET") {
          const featureError = await requirePlanFeature(
            env,
            context.organizationId,
            "roadmap",
            rid,
          );
          if (featureError) return featureError;
        }
        const roadmap = await env.DB.prepare(
          "SELECT id FROM roadmap_items WHERE id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(
            roadmapFeedbackMatch[2],
            context.organizationId,
            context.projectId,
          )
          .first();
        if (!roadmap)
          return error(
            "ROADMAP_NOT_FOUND",
            "Roadmap item was not found",
            rid,
            404,
          );
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT f.id, f.title, f.type, f.status, f.created_at AS createdAt FROM roadmap_feedback_links l JOIN feedback_items f ON f.id = l.feedback_id WHERE l.roadmap_id = ? AND l.organization_id = ? AND l.project_id = ? AND f.organization_id = ? AND f.project_id = ? AND f.deleted_at IS NULL ORDER BY f.created_at DESC",
          )
            .bind(
              roadmapFeedbackMatch[2],
              context.organizationId,
              context.projectId,
              context.organizationId,
              context.projectId,
            )
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = request.method === "POST" ? await jsonBody(request) : {};
        const feedbackId =
          roadmapFeedbackMatch[3] ??
          (typeof body.feedbackId === "string" ? body.feedbackId : "");
        if (!feedbackId)
          return error(
            "FEEDBACK_ID_REQUIRED",
            "feedbackId is required",
            rid,
            400,
          );
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(feedbackId, context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        if (request.method === "POST") {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO roadmap_feedback_links (roadmap_id, feedback_id, organization_id, project_id, created_at) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(
              roadmapFeedbackMatch[2],
              feedbackId,
              context.organizationId,
              context.projectId,
              new Date().toISOString(),
            )
            .run();
          await writeAudit(
            env,
            context,
            "roadmap.feedback.linked",
            "roadmap",
            roadmapFeedbackMatch[2],
            { feedbackId },
          );
          return jsonResponse(
            { roadmapId: roadmapFeedbackMatch[2], feedbackId },
            { status: 201, headers: cors },
          );
        }
        await env.DB.prepare(
          "DELETE FROM roadmap_feedback_links WHERE roadmap_id = ? AND feedback_id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(
            roadmapFeedbackMatch[2],
            feedbackId,
            context.organizationId,
            context.projectId,
          )
          .run();
        await writeAudit(
          env,
          context,
          "roadmap.feedback.unlinked",
          "roadmap",
          roadmapFeedbackMatch[2],
          { feedbackId },
        );
        return new Response(null, { status: 204, headers: cors });
      }
      if (roadmapUpdateMatch && request.method === "PATCH") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "roadmap:manage",
        );
        if (context instanceof Response) return context;
        const featureError = await requirePlanFeature(
          env,
          context.organizationId,
          "roadmap",
          rid,
        );
        if (featureError) return featureError;
        const body = await jsonBody(request);
        const current = await env.DB.prepare(
          "SELECT title, body, status FROM roadmap_items WHERE id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(
            roadmapUpdateMatch[1],
            context.organizationId,
            context.projectId,
          )
          .first<{ title: string; body: string; status: string }>();
        if (!current)
          return error(
            "ROADMAP_NOT_FOUND",
            "Roadmap item was not found",
            rid,
            404,
          );
        const title =
          body.title === undefined ? current.title : String(body.title).trim();
        const description =
          body.body === undefined ? current.body : String(body.body).trim();
        const status =
          body.status === undefined ? current.status : String(body.status);
        if (
          title.length < 2 ||
          title.length > 160 ||
          description.length > 20_000 ||
          !["planned", "in_progress", "completed"].includes(status)
        )
          return error("VALIDATION_ERROR", "Roadmap item is invalid", rid, 400);
        const updatedAt = new Date().toISOString();
        await env.DB.prepare(
          "UPDATE roadmap_items SET title = ?, body = ?, status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(
            title,
            description,
            status,
            updatedAt,
            roadmapUpdateMatch[1],
            context.organizationId,
            context.projectId,
          )
          .run();
        await writeAudit(
          env,
          context,
          "roadmap.updated",
          "roadmap",
          roadmapUpdateMatch[1],
          { status },
        );
        return jsonResponse(
          {
            id: roadmapUpdateMatch[1],
            title,
            body: description,
            status,
            updatedAt,
          },
          { headers: cors },
        );
      }
      const changelogDashboardMatch = path.match(
        /^\/api\/v1\/dashboard\/(?:projects\/([^/]+)\/changelog|changelog)$/,
      );
      const changelogProjectId =
        changelogDashboardMatch?.[1] ?? url.searchParams.get("projectId");
      const changelogFeedbackMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/changelog\/([^/]+)\/feedback(?:\/([^/]+))?$/,
      );
      if (
        changelogFeedbackMatch &&
        ["GET", "POST", "DELETE"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          changelogFeedbackMatch[1],
          rid,
          request.method === "GET" ? "feedback:read" : "roadmap:manage",
        );
        if (context instanceof Response) return context;
        if (request.method !== "GET") {
          const featureError = await requirePlanFeature(
            env,
            context.organizationId,
            "roadmap",
            rid,
          );
          if (featureError) return featureError;
        }
        const changelog = await env.DB.prepare(
          "SELECT id FROM changelog_items WHERE id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(
            changelogFeedbackMatch[2],
            context.organizationId,
            context.projectId,
          )
          .first();
        if (!changelog)
          return error(
            "CHANGELOG_NOT_FOUND",
            "Changelog item was not found",
            rid,
            404,
          );
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT f.id, f.title, f.type, f.status, f.created_at AS createdAt FROM changelog_feedback_links l JOIN feedback_items f ON f.id = l.feedback_id WHERE l.changelog_id = ? AND l.organization_id = ? AND l.project_id = ? AND f.organization_id = ? AND f.project_id = ? AND f.deleted_at IS NULL ORDER BY f.created_at DESC",
          )
            .bind(
              changelogFeedbackMatch[2],
              context.organizationId,
              context.projectId,
              context.organizationId,
              context.projectId,
            )
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const feedbackId =
          changelogFeedbackMatch[3] ??
          (typeof body.feedbackId === "string" ? body.feedbackId : "");
        if (!feedbackId)
          return error(
            "FEEDBACK_ID_REQUIRED",
            "feedbackId is required",
            rid,
            400,
          );
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(feedbackId, context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        if (request.method === "POST") {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO changelog_feedback_links (changelog_id, feedback_id, organization_id, project_id, created_at) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(
              changelogFeedbackMatch[2],
              feedbackId,
              context.organizationId,
              context.projectId,
              new Date().toISOString(),
            )
            .run();
          await writeAudit(
            env,
            context,
            "changelog.feedback.linked",
            "changelog",
            changelogFeedbackMatch[2],
            { feedbackId },
          );
          return jsonResponse(
            { changelogId: changelogFeedbackMatch[2], feedbackId },
            { status: 201, headers: cors },
          );
        }
        await env.DB.prepare(
          "DELETE FROM changelog_feedback_links WHERE changelog_id = ? AND feedback_id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(
            changelogFeedbackMatch[2],
            feedbackId,
            context.organizationId,
            context.projectId,
          )
          .run();
        await writeAudit(
          env,
          context,
          "changelog.feedback.unlinked",
          "changelog",
          changelogFeedbackMatch[2],
          { feedbackId },
        );
        return new Response(null, { status: 204, headers: cors });
      }
      if (
        changelogDashboardMatch &&
        changelogProjectId &&
        ["GET", "POST"].includes(request.method)
      ) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          changelogProjectId,
          rid,
          request.method === "GET" ? "feedback:read" : "roadmap:manage",
        );
        if (context instanceof Response) return context;
        if (request.method === "POST") {
          const featureError = await requirePlanFeature(
            env,
            context.organizationId,
            "roadmap",
            rid,
          );
          if (featureError) return featureError;
        }
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            "SELECT id, title, body, published_at AS publishedAt, created_at AS createdAt, updated_at AS updatedAt FROM changelog_items WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC",
          )
            .bind(context.organizationId, context.projectId)
            .all();
          return jsonResponse({ items: rows.results ?? [] }, { headers: cors });
        }
        const body = await jsonBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description =
          typeof body.body === "string" ? body.body.trim() : "";
        const publishedAt =
          body.publishedAt === null
            ? null
            : typeof body.publishedAt === "string"
              ? body.publishedAt
              : new Date().toISOString();
        if (
          title.length < 2 ||
          title.length > 160 ||
          description.length < 1 ||
          description.length > 20_000 ||
          (publishedAt !== null && Number.isNaN(Date.parse(publishedAt)))
        )
          return error(
            "VALIDATION_ERROR",
            "Changelog item is invalid",
            rid,
            400,
          );
        const now = new Date().toISOString();
        const item = {
          id: id(),
          title,
          body: description,
          publishedAt,
          createdAt: now,
          updatedAt: now,
        };
        await env.DB.prepare(
          "INSERT INTO changelog_items (id, organization_id, project_id, title, body, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            item.id,
            context.organizationId,
            context.projectId,
            title,
            description,
            publishedAt,
            now,
            now,
          )
          .run();
        await writeAudit(
          env,
          context,
          "changelog.created",
          "changelog",
          item.id,
          { published: Boolean(publishedAt) },
        );
        return jsonResponse(item, { status: 201, headers: cors });
      }
      const match = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/feedback(?:\/([^/]+))?$/,
      );
      if (match && request.method === "POST" && !match[2]) {
        const rawBody = await jsonBody(request);
        const input = validateInput(rawBody);
        if (typeof input === "string")
          return error("VALIDATION_ERROR", input, rid, 400);
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, context.projectId)))
          return error("RATE_LIMITED", "Too many requests", rid, 429);
        const turnstileToken =
          rawBody && typeof rawBody === "object"
            ? (rawBody as Record<string, unknown>).turnstileToken
            : undefined;
        if (
          !(await verifyTurnstile(
            env as TurnstileEnvironment,
            request,
            turnstileToken,
          ))
        )
          return error(
            "TURNSTILE_REQUIRED",
            "Complete the verification challenge and try again",
            rid,
            403,
          );
        const metadataError = await allowedMetadata(env, context, input, rid);
        if (metadataError) return metadataError;
        if (input.categoryId) {
          const category = await env.DB.prepare(
            "SELECT id FROM categories WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(input.categoryId, context.organizationId, context.projectId)
            .first();
          if (!category)
            return error(
              "CATEGORY_NOT_FOUND",
              "The category does not belong to this project",
              rid,
              400,
            );
        }
        const idem = request.headers.get("idempotency-key");
        if (idem) {
          if (idem.length > 128)
            return error(
              "INVALID_IDEMPOTENCY_KEY",
              "Idempotency-Key is too long",
              rid,
              400,
            );
          const previous = await env.DB.prepare(
            "SELECT response_json, status_code FROM idempotency_keys WHERE organization_id = ? AND project_id = ? AND key = ?",
          )
            .bind(context.organizationId, context.projectId, idem)
            .first<{ response_json: string; status_code: number }>();
          if (previous)
            return jsonResponse(JSON.parse(previous.response_json), {
              status: previous.status_code,
              headers: cors,
            });
        }
        const usage = await currentUsage(env, context.organizationId);
        if (usage.feedbackCount >= usage.feedbackLimit)
          return error(
            "PLAN_LIMIT_REACHED",
            `The ${usage.plan} plan has reached its monthly feedback limit`,
            rid,
            402,
            { period: usage.period, limit: usage.feedbackLimit },
          );
        const result = await Effect.runPromise(
          createFeedback(repo, context, input, rid),
        );
        await env.DB.prepare(
          "INSERT INTO usage_counters (organization_id, period, feedback_count, attachment_bytes) VALUES (?, ?, 1, 0) ON CONFLICT(organization_id, period) DO UPDATE SET feedback_count = feedback_count + 1",
        )
          .bind(context.organizationId, usage.period)
          .run();
        recordMetric(
          env,
          "feedback.created",
          context.organizationId,
          context.projectId,
          [1],
        );
        const safeResult = publicFeedback(result);
        if (env.FEEDBACK_SEARCH && env.AI)
          ctx.waitUntil(
            upsertFeedbackEmbedding(env.FEEDBACK_SEARCH, env.AI, {
              feedbackId: result.id,
              organizationId: context.organizationId,
              projectId: result.projectId,
              title: result.title,
              body: result.body,
            }).catch(() => undefined),
          );
        if (result.email)
          ctx.waitUntil(
            issueFollowUpLink(env, context, result.id, result.email).catch(
              () => undefined,
            ),
          );
        if (idem)
          await env.DB.prepare(
            "INSERT OR IGNORE INTO idempotency_keys (organization_id, project_id, key, response_json, status_code, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          )
            .bind(
              context.organizationId,
              context.projectId,
              idem,
              JSON.stringify(safeResult),
              201,
              result.createdAt,
            )
            .run();
        if (env.EVENTS) {
          const eventId = id();
          await env.EVENTS.send({
            type: "feedback.created",
            feedbackId: result.id,
            organizationId: context.organizationId,
            projectId: result.projectId,
            eventId,
          });
          ctx.waitUntil(
            enqueueWebhookDeliveries(
              env,
              context.organizationId,
              result.projectId,
              result.id,
              "feedback.created",
              eventId,
            ),
          );
        }
        if (env.EVENT_STREAM)
          ctx.waitUntil(
            env.EVENT_STREAM.getByName(result.projectId).publish({
              type: "feedback.created",
              feedbackId: result.id,
              projectId: result.projectId,
              createdAt: result.createdAt,
            }),
          );
        ctx.waitUntil(
          enqueueTeamNotifications(
            env,
            context.organizationId,
            context.projectId,
            "feedback.created",
            "New NitroPing feedback",
            `New feedback: ${result.title}`,
            `<p>New feedback: <strong>${htmlEscape(result.title)}</strong></p>`,
          ),
        );
        return jsonResponse(safeResult, { status: 201, headers: cors });
      }
      if (match && request.method === "GET" && match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        const result = await Effect.runPromise(
          getFeedback(repo, context, match[2]),
        );
        return result && result.status !== "spam"
          ? await etagged(
              (await publicFeedbackWithVotes(env, context, [result]))[0],
              request,
              cors,
            )
          : error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
      }
      if (match && request.method === "GET" && !match[2]) {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, match[1], rid);
        if (scopeError) return scopeError;
        const result = await Effect.runPromise(
          listFeedback(repo, context, {
            cursor: url.searchParams.get("cursor") ?? undefined,
            limit: Number(url.searchParams.get("limit") ?? 25),
            query: url.searchParams.get("q")?.trim() || undefined,
            status: feedbackStatuses.includes(
              url.searchParams.get("status") as FeedbackStatus,
            )
              ? (url.searchParams.get("status") as FeedbackStatus)
              : undefined,
            type: feedbackTypes.includes(url.searchParams.get("type") as never)
              ? (url.searchParams.get("type") as Feedback["type"])
              : undefined,
            priority: feedbackPriorities.includes(
              url.searchParams.get("priority") as never,
            )
              ? (url.searchParams.get("priority") as Feedback["priority"])
              : undefined,
          }),
        );
        const visibleItems = result.items.filter((item) => item.status !== "spam");
        return await etagged(
          { ...result, items: await publicFeedbackWithVotes(env, context, visibleItems) },
          request,
          cors,
        );
      }
      const categoriesMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/public\/categories$/,
      );
      if (categoriesMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, categoriesMatch[1], rid);
        if (scopeError) return scopeError;
        const rows = await env.DB.prepare(
          "SELECT id, name, slug FROM categories WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY name ASC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        return await etagged({ items: rows.results ?? [] }, request, cors);
      }
      const publicConfigMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/public\/config$/,
      );
      if (publicConfigMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(
          context,
          publicConfigMatch[1],
          rid,
        );
        if (scopeError) return scopeError;
        const [settings, categories] = await Promise.all([
          env.DB.prepare(
            "SELECT theme_json FROM project_settings WHERE organization_id = ? AND project_id = ?",
          )
            .bind(context.organizationId, context.projectId)
            .first<{ theme_json: string }>(),
          env.DB.prepare(
            "SELECT id, name, slug FROM categories WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY name ASC",
          )
            .bind(context.organizationId, context.projectId)
            .all(),
        ]);
        return await etagged(
          publicWidgetConfig(
            settings?.theme_json ?? "{}",
            categories.results ?? [],
            (env as TurnstileEnvironment).TURNSTILE_SITE_KEY,
          ),
          request,
          cors,
        );
      }
      const roadmapMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/public\/roadmap$/,
      );
      if (roadmapMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, roadmapMatch[1], rid);
        if (scopeError) return scopeError;
        const rows = await env.DB.prepare(
          "SELECT id, title, body, status, created_at AS createdAt, updated_at AS updatedAt FROM roadmap_items WHERE organization_id = ? AND project_id = ? ORDER BY updated_at DESC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        return await etagged({ items: rows.results ?? [] }, request, cors);
      }
      const changelogMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/public\/changelog$/,
      );
      if (changelogMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, changelogMatch[1], rid);
        if (scopeError) return scopeError;
        const rows = await env.DB.prepare(
          "SELECT id, title, body, published_at AS publishedAt, created_at AS createdAt FROM changelog_items WHERE organization_id = ? AND project_id = ? AND published_at IS NOT NULL ORDER BY published_at DESC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        return await etagged({ items: rows.results ?? [] }, request, cors);
      }
      const eventsMatch = path.match(/^\/api\/v1\/projects\/([^/]+)\/events$/);
      if (eventsMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, eventsMatch[1], rid);
        if (scopeError) return scopeError;
        if (!env.EVENT_STREAM)
          return error(
            "REALTIME_NOT_CONFIGURED",
            "Realtime event streaming is not configured",
            rid,
            503,
          );
        return env.EVENT_STREAM.getByName(context.projectId).fetch(request);
      }
      const commentMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/feedback\/([^/]+)\/comments$/,
      );
      if (commentMatch && request.method === "GET") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, commentMatch[1], rid);
        if (scopeError) return scopeError;
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL",
        )
          .bind(commentMatch[2], context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const comments = await env.DB.prepare(
          "SELECT id, body, created_at AS createdAt FROM feedback_comments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND is_internal = 0 AND deleted_at IS NULL ORDER BY created_at ASC",
        )
          .bind(commentMatch[2], context.organizationId, context.projectId)
          .all();
        return await etagged(
          { items: comments.results ?? [] },
          request,
          cors,
        );
      }
      if (commentMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, commentMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `comment:${context.projectId}`)))
          return error("RATE_LIMITED", "Too many requests", rid, 429);
        const body = await jsonBody(request);
        if (
          typeof body.body !== "string" ||
          body.body.trim().length < 1 ||
          body.body.length > 10_000
        )
          return error(
            "VALIDATION_ERROR",
            "Comment must be 1-10000 characters",
            rid,
            400,
          );
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL",
        )
          .bind(commentMatch[2], context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const comment = {
          id: id(),
          feedbackId: commentMatch[2],
          body: body.body.trim(),
          createdAt: new Date().toISOString(),
        };
        await env.DB.prepare(
          "INSERT INTO feedback_comments (id, organization_id, project_id, feedback_id, body, is_internal, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
        )
          .bind(
            comment.id,
            context.organizationId,
            context.projectId,
            comment.feedbackId,
            comment.body,
            comment.createdAt,
          )
          .run();
        if (env.EVENT_STREAM)
          ctx.waitUntil(
            env.EVENT_STREAM.getByName(context.projectId).publish({
              type: "feedback.comment.created",
              feedbackId: comment.feedbackId,
              projectId: context.projectId,
              createdAt: comment.createdAt,
            }),
          );
        return jsonResponse(comment, { status: 201, headers: cors });
      }
      const voteMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/feedback\/([^/]+)\/vote$/,
      );
      if (voteMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, voteMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `vote:${context.projectId}`)))
          return error("RATE_LIMITED", "Too many requests", rid, 429);
        const voter = await sha256(
          `${clientIp(request)}:${request.headers.get("user-agent") ?? ""}`,
        );
        await env.DB.prepare(
          "INSERT OR IGNORE INTO feedback_votes (organization_id, project_id, feedback_id, voter_fingerprint, created_at) SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL)",
        )
          .bind(
            context.organizationId,
            context.projectId,
            voteMatch[2],
            voter,
            new Date().toISOString(),
            voteMatch[2],
            context.organizationId,
            context.projectId,
          )
          .run();
        const count = await env.DB.prepare(
          "SELECT COUNT(*) AS count FROM feedback_votes WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(voteMatch[2], context.organizationId, context.projectId)
          .first<{ count: number }>();
        if (env.EVENT_STREAM)
          ctx.waitUntil(
            env.EVENT_STREAM.getByName(context.projectId).publish({
              type: "feedback.voted",
              feedbackId: voteMatch[2],
              projectId: context.projectId,
              createdAt: new Date().toISOString(),
            }),
          );
        return jsonResponse(
          { feedbackId: voteMatch[2], votes: Number(count?.count ?? 0) },
          { headers: cors },
        );
      }
      const uploadMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/uploads\/initiate$/,
      );
      if (uploadMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, uploadMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `upload:${context.projectId}`)))
          return error("RATE_LIMITED", "Too many requests", rid, 429);
        const body = await jsonBody(request);
        const contentType =
          typeof body.contentType === "string"
            ? body.contentType
            : "application/octet-stream";
        const size = Number(body.size ?? 0);
        if (!Number.isFinite(size) || size < 1 || size > 10 * 1024 * 1024)
          return error(
            "ATTACHMENT_TOO_LARGE",
            "Attachments cannot exceed 10 MB",
            rid,
            413,
          );
        if (
          !/^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/.test(
            contentType,
          )
        )
          return error(
            "UNSUPPORTED_ATTACHMENT",
            "Unsupported attachment type",
            rid,
            415,
          );
        const feedbackId =
          typeof body.feedbackId === "string" ? body.feedbackId : "unlinked";
        if (feedbackId !== "unlinked") {
          const feedback = await env.DB.prepare(
            "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(feedbackId, context.organizationId, context.projectId)
            .first();
          if (!feedback)
            return error(
              "FEEDBACK_NOT_FOUND",
              "Feedback was not found",
              rid,
              404,
            );
        }
        const token = randomToken("upl");
        const attachmentId = id();
        const objectKey = `${context.organizationId}/${context.projectId}/${feedbackId}/${attachmentId}`;
        await env.CACHE.put(
          `upload:${token}`,
          JSON.stringify({
            attachmentId,
            objectKey,
            feedbackId,
            ...context,
            contentType,
            size,
          }),
          { expirationTtl: 900 },
        );
        return jsonResponse(
          {
            uploadToken: token,
            attachmentId,
            uploadUrl: `/api/v1/uploads/${token}`,
            expiresIn: 900,
          },
          { status: 201, headers: cors },
        );
      }
      const uploadPut = path.match(/^\/api\/v1\/uploads\/([^/]+)$/);
      if (uploadPut && request.method === "PUT") {
        const raw = (await env.CACHE.get(`upload:${uploadPut[1]}`, "json")) as {
          attachmentId: string;
          objectKey: string;
          feedbackId: string;
          organizationId: string;
          projectId: string;
          contentType: string;
          size: number;
        } | null;
        if (!raw)
          return error(
            "UPLOAD_EXPIRED",
            "The upload token is invalid or expired",
            rid,
            404,
          );
        const body = request.body;
        if (!body)
          return error("EMPTY_UPLOAD", "The upload body is empty", rid, 400);
        const contentLength = Number(
          request.headers.get("content-length") ?? raw.size,
        );
        if (
          !Number.isFinite(contentLength) ||
          contentLength !== raw.size ||
          contentLength > 10 * 1024 * 1024
        )
          return error(
            "ATTACHMENT_SIZE_MISMATCH",
            "The uploaded file size does not match the initiated upload",
            rid,
            400,
          );
        const bytes = await request.arrayBuffer();
        if (bytes.byteLength !== raw.size)
          return error(
            "ATTACHMENT_SIZE_MISMATCH",
            "The uploaded file size does not match the initiated upload",
            rid,
            400,
          );
        if (!attachmentSignatureMatches(raw.contentType, bytes))
          return error(
            "ATTACHMENT_SIGNATURE_MISMATCH",
            "The uploaded file does not match its declared content type",
            rid,
            415,
          );
        const existingAttachment = await env.DB.prepare(
          "SELECT id FROM attachments WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(raw.attachmentId, raw.organizationId, raw.projectId)
          .first();
        if (existingAttachment) {
          await env.CACHE.delete(`upload:${uploadPut[1]}`);
          return jsonResponse(
            { attachmentId: raw.attachmentId },
            { status: 201, headers: cors },
          );
        }
        const usage = await currentUsage(env, raw.organizationId);
        const reservationPeriod = usage.period;
        await env.DB.prepare(
          "INSERT OR IGNORE INTO usage_counters (organization_id, period, feedback_count, attachment_bytes) VALUES (?, ?, 0, 0)",
        )
          .bind(raw.organizationId, reservationPeriod)
          .run();
        const reservation = await env.DB.prepare(
          "UPDATE usage_counters SET attachment_bytes = attachment_bytes + ?, updated_at = ? WHERE organization_id = ? AND period = ? AND attachment_bytes + ? <= ?",
        )
          .bind(
            raw.size,
            new Date().toISOString(),
            raw.organizationId,
            reservationPeriod,
            raw.size,
            usage.attachmentLimit,
          )
          .run();
        if (!reservation.meta.changes)
          return error(
            "PLAN_LIMIT_REACHED",
            `The ${usage.plan} plan has reached its attachment limit`,
            rid,
            402,
            { limit: usage.attachmentLimit, resource: "attachments" },
          );
        let attachmentInsert: D1Result;
        try {
          await env.ATTACHMENTS.put(raw.objectKey, bytes, {
            httpMetadata: { contentType: raw.contentType },
          });
          attachmentInsert = await env.DB.prepare(
            "INSERT OR IGNORE INTO attachments (id, organization_id, project_id, feedback_id, object_key, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
            .bind(
              raw.attachmentId,
              raw.organizationId,
              raw.projectId,
              raw.feedbackId,
              raw.objectKey,
              raw.contentType,
              raw.size,
              new Date().toISOString(),
            )
            .run();
        } catch (cause) {
          await env.ATTACHMENTS.delete(raw.objectKey).catch(() => undefined);
          await env.DB.prepare(
            "UPDATE usage_counters SET attachment_bytes = MAX(0, attachment_bytes - ?), updated_at = ? WHERE organization_id = ? AND period = ?",
          )
            .bind(raw.size, new Date().toISOString(), raw.organizationId, reservationPeriod)
            .run();
          throw cause;
        }
        if (attachmentInsert.meta.changes > 0) {
          recordMetric(
            env,
            "attachment.created",
            raw.organizationId,
            raw.projectId,
            [raw.size],
          );
        } else {
          await env.DB.prepare(
            "UPDATE usage_counters SET attachment_bytes = MAX(0, attachment_bytes - ?), updated_at = ? WHERE organization_id = ? AND period = ?",
          )
            .bind(raw.size, new Date().toISOString(), raw.organizationId, reservationPeriod)
            .run();
        }
        await env.CACHE.delete(`upload:${uploadPut[1]}`);
        return jsonResponse(
          { attachmentId: raw.attachmentId },
          { status: 201, headers: cors },
        );
      }
      const attachmentDownloadMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/attachments\/([^/]+)$/,
      );
      if (attachmentDownloadMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          attachmentDownloadMatch[1],
          rid,
          "feedback:read",
        );
        if (context instanceof Response) return context;
        const attachment = await env.DB.prepare(
          "SELECT object_key AS objectKey, content_type AS contentType FROM attachments WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            attachmentDownloadMatch[2],
            context.organizationId,
            context.projectId,
          )
          .first<{ objectKey: string; contentType: string }>();
        if (!attachment)
          return error(
            "ATTACHMENT_NOT_FOUND",
            "Attachment was not found",
            rid,
            404,
          );
        const object = await env.ATTACHMENTS.get(attachment.objectKey);
        if (!object)
          return error(
            "ATTACHMENT_NOT_FOUND",
            "Attachment was not found",
            rid,
            404,
          );
        return new Response(object.body, {
          headers: {
            ...cors,
            "content-type": attachment.contentType,
            "cache-control": "private, max-age=60",
          },
        });
      }
      const followUpMatch = path.match(
        /^\/api\/v1\/projects\/([^/]+)\/follow-up\/request$/,
      );
      if (followUpMatch && request.method === "POST") {
        const context = await projectFromRequest(request, env, url, rid);
        if (context instanceof Response) return context;
        const scopeError = projectMatchesPath(context, followUpMatch[1], rid);
        if (scopeError) return scopeError;
        if (!(await rateLimit(env, request, `follow-up:${context.projectId}`)))
          return error("RATE_LIMITED", "Too many requests", rid, 429);
        const body = await jsonBody(request);
        if (
          typeof body.feedbackId !== "string" ||
          typeof body.email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
          body.email.length > 320
        )
          return error(
            "VALIDATION_ERROR",
            "A valid feedbackId and email are required",
            rid,
            400,
          );
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND status <> 'spam' AND deleted_at IS NULL",
        )
          .bind(body.feedbackId, context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        await issueFollowUpLink(env, context, body.feedbackId, body.email);
        return jsonResponse({ accepted: true }, { status: 202, headers: cors });
      }
      const followUpReadMatch = path.match(/^\/api\/v1\/follow-up\/([^/]+)$/);
      const followUpUnsubscribeMatch = path.match(
        /^\/api\/v1\/follow-up\/([^/]+)\/unsubscribe$/,
      );
      if (
        followUpUnsubscribeMatch &&
        (request.method === "GET" || request.method === "POST")
      ) {
        const raw = await env.DB.prepare(
          `SELECT t.feedback_id AS feedbackId, t.organization_id AS organizationId,
            t.project_id AS projectId, t.email
           FROM magic_link_tokens t
           WHERE t.token_hash = ? AND t.used_at IS NULL AND t.expires_at > ?`,
        )
          .bind(
            await sha256(followUpUnsubscribeMatch[1]),
            new Date().toISOString(),
          )
          .first<{
            feedbackId: string;
            organizationId: string;
            projectId: string;
            email: string | null;
          }>();
        if (!raw || !raw.email)
          return error(
            "FOLLOW_UP_EXPIRED",
            "The follow-up link is invalid or expired",
            rid,
            404,
          );
        const now = new Date().toISOString();
        if (env.FEEDBACK_SEARCH)
          ctx.waitUntil(
            deleteFeedbackEmbedding(env.FEEDBACK_SEARCH, raw.feedbackId).catch(
              () => undefined,
            ),
          );
        await env.DB.batch([
          env.DB.prepare(
            "DELETE FROM feedback_watchers WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND email = ?",
          ).bind(
            raw.feedbackId,
            raw.organizationId,
            raw.projectId,
            raw.email,
          ),
          env.DB.prepare(
            "UPDATE consent_records SET withdrawn_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND email = ? AND withdrawn_at IS NULL",
          ).bind(
            now,
            raw.feedbackId,
            raw.organizationId,
            raw.projectId,
            raw.email,
          ),
        ]);
        if (request.method === "GET")
          return new Response(
            "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Unsubscribed</title><body style=\"font:16px system-ui;max-width:36rem;margin:4rem auto;padding:1rem\"><h1>Updates disabled</h1><p>You will no longer receive email updates for this feedback.</p></body></html>",
            {
              status: 200,
              headers: {
                "content-type": "text/html; charset=utf-8",
                ...cors,
              },
            },
          );
        return jsonResponse({ unsubscribed: true }, { headers: cors });
      }
      if (followUpReadMatch && request.method === "DELETE") {
        const raw = await env.DB.prepare(
          `SELECT t.feedback_id AS feedbackId, f.organization_id AS organizationId, f.project_id AS projectId
          FROM magic_link_tokens t JOIN feedback_items f ON f.id = t.feedback_id
          WHERE t.token_hash = ? AND t.organization_id = f.organization_id AND t.project_id = f.project_id AND t.used_at IS NULL AND t.expires_at > ? AND f.deleted_at IS NULL`,
        )
          .bind(await sha256(followUpReadMatch[1]), new Date().toISOString())
          .first<{
            feedbackId: string;
            organizationId: string;
            projectId: string;
          }>();
        if (!raw)
          return error(
            "FOLLOW_UP_EXPIRED",
            "The follow-up link is invalid or expired",
            rid,
            404,
          );
        const attachments = await env.DB.prepare(
          "SELECT object_key AS objectKey, size_bytes AS sizeBytes, created_at AS createdAt FROM attachments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(raw.feedbackId, raw.organizationId, raw.projectId)
          .all<{ objectKey: string; sizeBytes: number; createdAt: string }>();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE feedback_items SET email = NULL, body = '[deleted by requester]', metadata_json = '{}', deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          ).bind(
            now,
            now,
            raw.feedbackId,
            raw.organizationId,
            raw.projectId,
          ),
          env.DB.prepare(
            "UPDATE feedback_comments SET body = '[deleted by requester]', deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          ).bind(now, raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "UPDATE attachments SET deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          ).bind(now, raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "DELETE FROM feedback_votes WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "DELETE FROM feedback_watchers WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "DELETE FROM feedback_status_history WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "DELETE FROM magic_link_tokens WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "DELETE FROM consent_records WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(raw.feedbackId, raw.organizationId, raw.projectId),
          env.DB.prepare(
            "INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'delete', 'completed', ?, ?)",
          ).bind(id(), raw.organizationId, raw.projectId, now, now),
        ]);
        await releaseAttachmentUsage(
          env,
          raw.organizationId,
          (attachments.results ?? []).map(({ sizeBytes, createdAt }) => ({
            sizeBytes,
            createdAt,
          })),
        );
        for (const attachment of attachments.results ?? [])
          ctx.waitUntil(
            env.EVENTS.send({
              type: "attachment.delete",
              objectKey: attachment.objectKey,
              projectId: raw.projectId,
              eventId: id(),
              organizationId: raw.organizationId,
            }),
          );
        return jsonResponse(
          { deleted: true, feedbackId: raw.feedbackId },
          { headers: cors },
        );
      }
      if (followUpReadMatch && request.method === "GET") {
        const raw = await env.DB.prepare(
          `SELECT t.feedback_id AS feedbackId, f.organization_id AS organizationId, f.project_id AS projectId
          FROM magic_link_tokens t JOIN feedback_items f ON f.id = t.feedback_id
          WHERE t.token_hash = ? AND t.organization_id = f.organization_id AND t.project_id = f.project_id AND t.used_at IS NULL AND t.expires_at > ? AND f.deleted_at IS NULL AND f.status <> 'spam'`,
        )
          .bind(await sha256(followUpReadMatch[1]), new Date().toISOString())
          .first<{
            feedbackId: string;
            organizationId: string;
            projectId: string;
          }>();
        if (!raw)
          return error(
            "FOLLOW_UP_EXPIRED",
            "The follow-up link is invalid or expired",
            rid,
            404,
          );
        const feedback = await env.DB.prepare(
          "SELECT id, type, status, priority, title, body, platform, app_version AS appVersion, created_at AS createdAt, updated_at AS updatedAt FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(raw.feedbackId, raw.organizationId, raw.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const comments = await env.DB.prepare(
          "SELECT id, body, created_at AS createdAt FROM feedback_comments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND is_internal = 0 AND deleted_at IS NULL ORDER BY created_at ASC",
        )
          .bind(raw.feedbackId, raw.organizationId, raw.projectId)
          .all();
        return jsonResponse(
          { feedback, comments: comments.results ?? [] },
          { headers: cors },
        );
      }
      const exportMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/export$/,
      );
      if (exportMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          exportMatch[1],
          rid,
          "privacy:manage",
        );
        if (context instanceof Response) return context;
        const feedback = await env.DB.prepare(
          "SELECT * FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        const comments = await env.DB.prepare(
          "SELECT * FROM feedback_comments WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        const attachments = await env.DB.prepare(
          "SELECT id, feedback_id, content_type, size_bytes, created_at FROM attachments WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        const consent = await env.DB.prepare(
          "SELECT id, feedback_id AS feedbackId, email, purpose, legal_basis AS legalBasis, granted_at AS grantedAt, withdrawn_at AS withdrawnAt FROM consent_records WHERE organization_id = ? AND project_id = ? ORDER BY granted_at ASC",
        )
          .bind(context.organizationId, context.projectId)
          .all();
        await env.DB.prepare(
          "INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'export', 'completed', ?, ?)",
        )
          .bind(
            id(),
            context.organizationId,
            context.projectId,
            new Date().toISOString(),
            new Date().toISOString(),
          )
          .run();
        return new Response(
          JSON.stringify({
            exportedAt: new Date().toISOString(),
            feedback: feedback.results ?? [],
            comments: comments.results ?? [],
            attachments: attachments.results ?? [],
            consentRecords: consent.results ?? [],
          }),
          {
            status: 200,
            headers: {
              ...cors,
              "content-type": "application/json; charset=utf-8",
              "content-disposition": `attachment; filename=nitroping-${context.projectId}-export.json`,
            },
          },
        );
      }
      const anonymizeMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback\/([^/]+)\/anonymize$/,
      );
      if (anonymizeMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          anonymizeMatch[1],
          rid,
          "privacy:manage",
        );
        if (context instanceof Response) return context;
        const now = new Date().toISOString();
        const result = await env.DB.prepare(
          "UPDATE feedback_items SET email = NULL, body = '[anonymized]', metadata_json = '{}', updated_at = ?, deleted_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            now,
            now,
            anonymizeMatch[2],
            context.organizationId,
            context.projectId,
          )
          .run();
        if (!result.meta.changes)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const attachments = await env.DB.prepare(
          "SELECT object_key AS objectKey, size_bytes AS sizeBytes, created_at AS createdAt FROM attachments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(anonymizeMatch[2], context.organizationId, context.projectId)
          .all<{ objectKey: string; sizeBytes: number; createdAt: string }>();
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE feedback_comments SET body = '[anonymized]', deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(
            now,
            anonymizeMatch[2],
            context.organizationId,
            context.projectId,
          ),
          env.DB.prepare(
            "UPDATE attachments SET deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          ).bind(
            now,
            anonymizeMatch[2],
            context.organizationId,
            context.projectId,
          ),
          env.DB.prepare(
            "DELETE FROM feedback_tag_links WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(
            anonymizeMatch[2],
            context.organizationId,
            context.projectId,
          ),
          env.DB.prepare(
            "DELETE FROM roadmap_feedback_links WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(
            anonymizeMatch[2],
            context.organizationId,
            context.projectId,
          ),
          env.DB.prepare(
            "DELETE FROM changelog_feedback_links WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
          ).bind(
            anonymizeMatch[2],
            context.organizationId,
            context.projectId,
          ),
          env.DB.prepare(
            "INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'anonymize', 'completed', ?, ?)",
          ).bind(id(), context.organizationId, context.projectId, now, now),
        ]);
        await releaseAttachmentUsage(
          env,
          context.organizationId,
          (attachments.results ?? []).map(({ sizeBytes, createdAt }) => ({
            sizeBytes,
            createdAt,
          })),
        );
        if (env.FEEDBACK_SEARCH)
          ctx.waitUntil(
            deleteFeedbackEmbedding(env.FEEDBACK_SEARCH, anonymizeMatch[2]).catch(
              () => undefined,
            ),
          );
        for (const attachment of attachments.results ?? [])
          ctx.waitUntil(
            env.EVENTS.send({
              type: "attachment.delete",
              objectKey: attachment.objectKey,
              projectId: context.projectId,
              eventId: id(),
              organizationId: context.organizationId,
            }),
          );
        return jsonResponse(
          { anonymized: true, feedbackId: anonymizeMatch[2] },
          { headers: cors },
        );
      }
      const aiReviewMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback\/([^/]+)\/ai-review$/,
      );
      if (aiReviewMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          aiReviewMatch[1],
          rid,
          "feedback:moderate",
        );
        if (context instanceof Response) return context;
        if (!env.AI)
          return error(
            "AI_NOT_CONFIGURED",
            "Workers AI is not configured for this deployment",
            rid,
            503,
          );
        const feedback = await env.DB.prepare(
          "SELECT title, body, email FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(aiReviewMatch[2], context.organizationId, context.projectId)
          .first<{ title: string; body: string; email: string | null }>();
        if (!feedback)
          return error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
        let review: Awaited<ReturnType<typeof reviewWithWorkersAI>>;
        try {
          review = await reviewWithWorkersAI(env.AI, feedback);
        } catch {
          return error(
            "AI_REVIEW_FAILED",
            "Workers AI could not produce a review",
            rid,
            502,
          );
        }
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(
            "INSERT INTO moderation_events (id, organization_id, project_id, feedback_id, kind, outcome, metadata_json, created_at) VALUES (?, ?, ?, ?, 'ai_assist', 'pending', ?, ?)",
          ).bind(
            id(),
            context.organizationId,
            context.projectId,
            aiReviewMatch[2],
            JSON.stringify({ version: 1, review }),
            now,
          ),
          env.DB.prepare(
            "INSERT INTO audit_logs (id, organization_id, project_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, 'moderation.ai_review', 'feedback', ?, ?, ?)",
          ).bind(
            id(),
            context.organizationId,
            context.projectId,
            context.actorUserId ?? null,
            aiReviewMatch[2],
            JSON.stringify({ requestId: rid, review }),
            now,
          ),
        ]);
        return jsonResponse({ feedbackId: aiReviewMatch[2], review }, { headers: cors });
      }
      const moderationMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/moderation$/,
      );
      if (moderationMatch && ["GET", "POST"].includes(request.method)) {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          moderationMatch[1],
          rid,
          request.method === "GET" ? "feedback:read" : "feedback:moderate",
        );
        if (context instanceof Response) return context;
        const identity =
          String(env.ACCESS_TEAM_DOMAIN ?? "") &&
          String(env.ACCESS_AUDIENCE ?? "")
            ? await verifyConfiguredIdentity(request, env)
            : null;
        const actorUserId = identity?.email
          ? await userForIdentity(env, identity)
          : null;
        if (request.method === "GET") {
          const rows = await env.DB.prepare(
            `SELECT m.id, m.feedback_id AS feedbackId, m.kind, m.outcome, m.metadata_json AS metadata, m.created_at AS createdAt,
            f.type, f.status, f.priority, f.title, f.body, f.email, f.platform, f.created_at AS feedbackCreatedAt
            FROM moderation_events m JOIN feedback_items f ON f.id = m.feedback_id AND f.organization_id = m.organization_id AND f.project_id = m.project_id
            WHERE m.organization_id = ? AND m.project_id = ? AND m.outcome = 'pending' AND f.deleted_at IS NULL ORDER BY m.created_at ASC LIMIT 100`,
          )
            .bind(context.organizationId, context.projectId)
            .all<Record<string, unknown>>();
          return jsonResponse(
            {
              items: (rows.results ?? []).map((row) => ({
                ...row,
                metadata: JSON.parse(String(row.metadata ?? "{}")),
              })),
            },
            { headers: cors },
          );
        }
        const body = await jsonBody(request);
        const feedbackId =
          typeof body.feedbackId === "string" ? body.feedbackId : "";
        const outcome =
          body.outcome === "approved" ||
          body.outcome === "rejected" ||
          body.outcome === "spam"
            ? body.outcome
            : "";
        if (!feedbackId || !outcome)
          return error(
            "VALIDATION_ERROR",
            "feedbackId and a valid outcome are required",
            rid,
            400,
          );
        const event = await env.DB.prepare(
          "SELECT id FROM moderation_events WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND outcome = 'pending' ORDER BY created_at ASC LIMIT 1",
        )
          .bind(feedbackId, context.organizationId, context.projectId)
          .first<{ id: string }>();
        if (!event)
          return error(
            "MODERATION_EVENT_NOT_FOUND",
            "The moderation event was not found",
            rid,
            404,
          );
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE moderation_events SET outcome = ?, metadata_json = ? WHERE id = ? AND organization_id = ? AND project_id = ?",
          ).bind(
            outcome,
            JSON.stringify({ actorUserId, requestId: rid }),
            event.id,
            context.organizationId,
            context.projectId,
          ),
          ...(outcome === "spam"
            ? [
                env.DB.prepare(
                  "UPDATE feedback_items SET status = 'spam', updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
                ).bind(
                  now,
                  feedbackId,
                  context.organizationId,
                  context.projectId,
                ),
              ]
            : []),
          env.DB.prepare(
            "INSERT INTO audit_logs (id, organization_id, project_id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, 'feedback', ?, ?, ?)",
          ).bind(
            id(),
            context.organizationId,
            context.projectId,
            actorUserId,
            `moderation.${outcome}`,
            feedbackId,
            JSON.stringify({ requestId: rid }),
            now,
          ),
        ]);
        return jsonResponse({ feedbackId, outcome }, { headers: cors });
      }
      const auditMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/audit-logs$/,
      );
      if (auditMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          auditMatch[1],
          rid,
          "audit:read",
        );
        if (context instanceof Response) return context;
        const limit = Math.min(
          100,
          Math.max(1, Number(url.searchParams.get("limit") ?? 50)),
        );
        const rows = await env.DB.prepare(
          `SELECT id, action, entity_type AS entityType, entity_id AS entityId, actor_user_id AS actorUserId, metadata_json AS metadata, created_at AS createdAt
          FROM audit_logs WHERE organization_id = ? AND project_id = ? ORDER BY created_at DESC LIMIT ?`,
        )
          .bind(context.organizationId, context.projectId, limit)
          .all<Record<string, unknown>>();
        return jsonResponse(
          {
            items: (rows.results ?? []).map((row) => ({
              ...row,
              metadata: JSON.parse(String(row.metadata ?? "{}")),
            })),
          },
          { headers: cors },
        );
      }
      const dashboardListMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback$/,
      );
      const dashboardSemanticSearchMatch = path.match(
        /^\/api\/v1\/dashboard\/projects\/([^/]+)\/feedback\/search$/,
      );
      if (dashboardSemanticSearchMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          dashboardSemanticSearchMatch[1],
          rid,
          "feedback:read",
        );
        if (context instanceof Response) return context;
        const query = url.searchParams.get("q")?.trim() ?? "";
        if (query.length < 2 || query.length > 500)
          return error(
            "INVALID_SEARCH_QUERY",
            "q must contain 2-500 characters",
            rid,
            400,
          );
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
        if (env.FEEDBACK_SEARCH && env.AI) {
          try {
            const matches = await queryFeedbackEmbeddings(
              env.FEEDBACK_SEARCH,
              env.AI,
              query,
              context.organizationId,
              context.projectId,
              limit,
            );
            if (!matches.length) return jsonResponse({ items: [], mode: "semantic" }, { headers: cors });
            const placeholders = matches.map(() => "?").join(",");
            const rows = await env.DB.prepare(
              `SELECT * FROM feedback_items WHERE organization_id = ? AND project_id = ? AND deleted_at IS NULL AND status <> 'spam' AND id IN (${placeholders})`,
            )
              .bind(context.organizationId, context.projectId, ...matches.map((match) => match.feedbackId))
              .all<Record<string, unknown>>();
            const byId = new Map((rows.results ?? []).map((row) => [String(row.id), row]));
            return jsonResponse(
              {
                mode: "semantic",
                items: matches.flatMap((match) => {
                  const row = byId.get(match.feedbackId);
                  return row ? [{ ...fromRow(row), score: match.score }] : [];
                }),
              },
              { headers: cors },
            );
          } catch {
            // A missing or temporarily unavailable vector index must not make the inbox unusable.
          }
        }
        const fallback = await Effect.runPromise(
          listFeedback(repo, context, { query, limit }),
        );
        return jsonResponse({ ...fallback, mode: "keyword" }, { headers: cors });
      }
      if (dashboardListMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const context = await requireDashboardProject(
          request,
          env,
          url,
          dashboardListMatch[1],
          rid,
          "feedback:read",
        );
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(
          listFeedback(repo, context, {
            cursor: url.searchParams.get("cursor") ?? undefined,
            limit: Number(url.searchParams.get("limit") ?? 25),
            query: url.searchParams.get("q")?.trim() || undefined,
            status: feedbackStatuses.includes(
              url.searchParams.get("status") as FeedbackStatus,
            )
              ? (url.searchParams.get("status") as FeedbackStatus)
              : undefined,
            type: feedbackTypes.includes(url.searchParams.get("type") as never)
              ? (url.searchParams.get("type") as Feedback["type"])
              : undefined,
            priority: feedbackPriorities.includes(
              url.searchParams.get("priority") as never,
            )
              ? (url.searchParams.get("priority") as Feedback["priority"])
              : undefined,
          }),
        );
        return jsonResponse(result, { headers: cors });
      }
      const assignMatch = path.match(
        /^\/api\/v1\/dashboard\/feedback\/([^/]+)\/assign$/,
      );
      if (assignMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "feedback:write",
        );
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const assigneeUserId =
          body.assigneeUserId === null ||
          body.assigneeUserId === undefined ||
          body.assigneeUserId === ""
            ? null
            : String(body.assigneeUserId);
        if (assigneeUserId) {
          const member = await env.DB.prepare(
            "SELECT 1 FROM organization_members WHERE organization_id = ? AND user_id = ? AND deleted_at IS NULL",
          )
            .bind(context.organizationId, assigneeUserId)
            .first();
          if (!member)
            return error(
              "ASSIGNEE_NOT_FOUND",
              "The assignee is not a member of this organization",
              rid,
              400,
            );
        }
        const now = new Date().toISOString();
        const updated = await env.DB.prepare(
          "UPDATE feedback_items SET assigned_user_id = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            assigneeUserId,
            now,
            assignMatch[1],
            context.organizationId,
            context.projectId,
          )
          .run();
        if (!updated.meta.changes)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        await writeAudit(
          env,
          context,
          "feedback.assigned",
          "feedback",
          assignMatch[1],
          { assigneeUserId },
        );
        const feedback = await env.DB.prepare(
          "SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ?",
        )
          .bind(assignMatch[1], context.organizationId, context.projectId)
          .first<Record<string, unknown>>();
        return feedback
          ? jsonResponse(fromRow(feedback), { headers: cors })
          : error("FEEDBACK_NOT_FOUND", "Feedback was not found", rid, 404);
      }
      const mergeMatch = path.match(
        /^\/api\/v1\/dashboard\/feedback\/([^/]+)\/merge$/,
      );
      if (mergeMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "feedback:write",
        );
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        const targetFeedbackId =
          typeof body.targetFeedbackId === "string"
            ? body.targetFeedbackId
            : "";
        if (!targetFeedbackId || targetFeedbackId === mergeMatch[1])
          return error(
            "VALIDATION_ERROR",
            "A different targetFeedbackId is required",
            rid,
            400,
          );
        const [source, target] = await Promise.all([
          env.DB.prepare(
            "SELECT id, status FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(mergeMatch[1], context.organizationId, context.projectId)
            .first<{ id: string; status: string }>(),
          env.DB.prepare(
            "SELECT id, status FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(targetFeedbackId, context.organizationId, context.projectId)
            .first<{ id: string; status: string }>(),
        ]);
        if (!source || !target)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Source or target feedback was not found",
            rid,
            404,
          );
        if (target.status === "spam")
          return error(
            "INVALID_MERGE_TARGET",
            "Spam feedback cannot be a merge target",
            rid,
            400,
          );
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(
            "UPDATE feedback_items SET status = 'closed', merged_into_id = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          ).bind(
            targetFeedbackId,
            now,
            mergeMatch[1],
            context.organizationId,
            context.projectId,
          ),
          env.DB.prepare(
            "INSERT INTO feedback_status_history (id, organization_id, project_id, feedback_id, from_status, to_status, actor_user_id, created_at) VALUES (?, ?, ?, ?, ?, 'closed', ?, ?)",
          ).bind(
            id(),
            context.organizationId,
            context.projectId,
            mergeMatch[1],
            source.status,
            context.actorUserId ?? null,
            now,
          ),
        ]);
        await writeAudit(
          env,
          context,
          "feedback.merged",
          "feedback",
          mergeMatch[1],
          { targetFeedbackId },
        );
        return jsonResponse(
          {
            sourceFeedbackId: mergeMatch[1],
            targetFeedbackId,
            status: "closed",
          },
          { headers: cors },
        );
      }
      const dashboardFeedbackMatch = path.match(
        /^\/api\/v1\/dashboard\/feedback\/([^/]+)$/,
      );
      if (dashboardFeedbackMatch && request.method === "PATCH") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "feedback:write",
        );
        if (context instanceof Response) return context;
        const current = await env.DB.prepare(
          "SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            dashboardFeedbackMatch[1],
            context.organizationId,
            context.projectId,
          )
          .first<Record<string, unknown>>();
        if (!current)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const body = await jsonBody(request);
        const title =
          body.title === undefined
            ? String(current.title)
            : typeof body.title === "string"
              ? body.title.trim()
              : "";
        const description =
          body.body === undefined
            ? String(current.body)
            : typeof body.body === "string"
              ? body.body.trim()
              : "";
        const type =
          body.type === undefined ? String(current.type) : String(body.type);
        const priority =
          body.priority === undefined
            ? String(current.priority)
            : String(body.priority);
        const email =
          body.email === undefined
            ? current.email
            : body.email === null || body.email === ""
              ? null
              : typeof body.email === "string"
                ? body.email.trim()
                : "__invalid__";
        const categoryId =
          body.categoryId === undefined
            ? current.category_id
              ? String(current.category_id)
              : null
            : body.categoryId === null || body.categoryId === ""
              ? null
              : typeof body.categoryId === "string"
                ? body.categoryId
                : "__invalid__";
        if (
          title.length < 3 ||
          title.length > 160 ||
          description.length < 3 ||
          description.length > 20_000
        )
          return error(
            "VALIDATION_ERROR",
            "Title must be 3-160 characters and body must be 3-20000 characters",
            rid,
            400,
          );
        if (
          !feedbackTypes.includes(type as never) ||
          !feedbackPriorities.includes(priority as never)
        )
          return error(
            "VALIDATION_ERROR",
            "Feedback type or priority is invalid",
            rid,
            400,
          );
        if (
          email === "__invalid__" ||
          (typeof email === "string" &&
            (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
        )
          return error("VALIDATION_ERROR", "Email is invalid", rid, 400);
        if (categoryId === "__invalid__")
          return error("VALIDATION_ERROR", "categoryId is invalid", rid, 400);
        if (categoryId) {
          const category = await env.DB.prepare(
            "SELECT id FROM categories WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
          )
            .bind(categoryId, context.organizationId, context.projectId)
            .first();
          if (!category)
            return error(
              "CATEGORY_NOT_FOUND",
              "The category does not belong to this project",
              rid,
              400,
            );
        }
        const updatedAt = new Date().toISOString();
        await env.DB.prepare(
          "UPDATE feedback_items SET type = ?, priority = ?, category_id = ?, title = ?, body = ?, email = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            type,
            priority,
            categoryId,
            title,
            description,
            email,
            updatedAt,
            dashboardFeedbackMatch[1],
            context.organizationId,
            context.projectId,
          )
          .run();
        await writeAudit(
          env,
          context,
          "feedback.updated",
          "feedback",
          dashboardFeedbackMatch[1],
          {
            fields: [
              "type",
              "priority",
              "categoryId",
              "title",
              "body",
              "email",
            ],
          },
        );
        const updated = await env.DB.prepare(
          "SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            dashboardFeedbackMatch[1],
            context.organizationId,
            context.projectId,
          )
          .first<Record<string, unknown>>();
        if (!updated)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        if (env.FEEDBACK_SEARCH && env.AI)
          ctx.waitUntil(
            upsertFeedbackEmbedding(env.FEEDBACK_SEARCH, env.AI, {
              feedbackId: dashboardFeedbackMatch[1],
              organizationId: context.organizationId,
              projectId: context.projectId,
              title,
              body: description,
            }).catch(() => undefined),
          );
        const eventId = id();
        recordMetric(
          env,
          "feedback.updated",
          context.organizationId,
          context.projectId,
          [1],
        );
        ctx.waitUntil(
          enqueueWebhookDeliveries(
            env,
            context.organizationId,
            context.projectId,
            dashboardFeedbackMatch[1],
            "feedback.updated",
            eventId,
          ),
        );
        ctx.waitUntil(
          enqueueWatcherEmails(
            env,
            context.organizationId,
            context.projectId,
            dashboardFeedbackMatch[1],
            "Your NitroPing feedback was updated",
            "Your feedback received an update. Open your NitroPing follow-up link to review it.",
            "<p>Your feedback received an update.</p><p>Open your NitroPing follow-up link to review it.</p>",
          ),
        );
        ctx.waitUntil(
          enqueueTeamNotifications(
            env,
            context.organizationId,
            context.projectId,
            "feedback.updated",
            "NitroPing feedback updated",
            `Feedback updated: ${title}`,
            `<p>Feedback updated: <strong>${htmlEscape(title)}</strong></p>`,
          ),
        );
        if (env.EVENT_STREAM)
          ctx.waitUntil(
            env.EVENT_STREAM.getByName(context.projectId).publish({
              type: "feedback.updated",
              feedbackId: dashboardFeedbackMatch[1],
              projectId: context.projectId,
              createdAt: updatedAt,
            }),
          );
        return jsonResponse(fromRow(updated), { headers: cors });
      }
      if (dashboardFeedbackMatch && request.method === "GET") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "feedback:read",
        );
        if (context instanceof Response) return context;
        const feedback = await env.DB.prepare(
          "SELECT * FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(
            dashboardFeedbackMatch[1],
            context.organizationId,
            context.projectId,
          )
          .first<Record<string, unknown>>();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const [comments, history, tags, attachments] = await Promise.all([
          env.DB.prepare(
            "SELECT id, feedback_id AS feedbackId, body, author_user_id AS authorUserId, is_internal AS isInternal, created_at AS createdAt FROM feedback_comments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          )
            .bind(
              dashboardFeedbackMatch[1],
              context.organizationId,
              context.projectId,
            )
            .all(),
          env.DB.prepare(
            "SELECT id, from_status AS fromStatus, to_status AS toStatus, actor_user_id AS actorUserId, created_at AS createdAt FROM feedback_status_history WHERE feedback_id = ? AND organization_id = ? AND project_id = ? ORDER BY created_at ASC",
          )
            .bind(
              dashboardFeedbackMatch[1],
              context.organizationId,
              context.projectId,
            )
            .all(),
          env.DB.prepare(
            "SELECT t.id, t.name, t.slug FROM feedback_tags t JOIN feedback_tag_links l ON l.tag_id = t.id WHERE l.feedback_id = ? AND t.organization_id = ? AND t.project_id = ? ORDER BY t.name ASC",
          )
            .bind(
              dashboardFeedbackMatch[1],
              context.organizationId,
              context.projectId,
            )
            .all(),
          env.DB.prepare(
            "SELECT id, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM attachments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          )
            .bind(
              dashboardFeedbackMatch[1],
              context.organizationId,
              context.projectId,
            )
            .all<{ id: string; contentType: string; sizeBytes: number; createdAt: string }>(),
        ]);
        return jsonResponse(
          {
            feedback: fromRow(feedback),
            comments: comments.results ?? [],
            statusHistory: history.results ?? [],
            tags: tags.results ?? [],
            attachments: (attachments.results ?? []).map((attachment) => ({
              ...attachment,
              downloadUrl: `/api/v1/dashboard/projects/${encodeURIComponent(context.projectId)}/attachments/${encodeURIComponent(attachment.id)}`,
            })),
          },
          { headers: cors },
        );
      }
      const replyMatch = path.match(
        /^\/api\/v1\/dashboard\/feedback\/([^/]+)\/reply$/,
      );
      if (replyMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "feedback:reply",
        );
        if (context instanceof Response) return context;
        const body = await jsonBody(request);
        if (
          typeof body.body !== "string" ||
          body.body.trim().length < 1 ||
          body.body.length > 10_000
        )
          return error(
            "VALIDATION_ERROR",
            "Reply must be 1-10000 characters",
            rid,
            400,
          );
        const feedback = await env.DB.prepare(
          "SELECT id FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(replyMatch[1], context.organizationId, context.projectId)
          .first();
        if (!feedback)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        const internal = body.internal === true;
        const comment = {
          id: id(),
          feedbackId: replyMatch[1],
          body: body.body.trim(),
          isInternal: internal,
          createdAt: new Date().toISOString(),
        };
        await env.DB.prepare(
          "INSERT INTO feedback_comments (id, organization_id, project_id, feedback_id, body, is_internal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            comment.id,
            context.organizationId,
            context.projectId,
            comment.feedbackId,
            comment.body,
            internal ? 1 : 0,
            comment.createdAt,
          )
          .run();
        await writeAudit(
          env,
          context,
          internal
            ? "feedback.internal_note.created"
            : "feedback.reply.created",
          "feedback",
          replyMatch[1],
        );
        if (!internal) {
          recordMetric(
            env,
            "feedback.replied",
            context.organizationId,
            context.projectId,
            [1],
          );
          const eventId = id();
          ctx.waitUntil(
            enqueueWebhookDeliveries(
              env,
              context.organizationId,
              context.projectId,
              replyMatch[1],
              "feedback.replied",
              eventId,
            ),
          );
          ctx.waitUntil(
            enqueueWatcherEmails(
              env,
              context.organizationId,
              context.projectId,
              replyMatch[1],
              "New reply to your NitroPing feedback",
              "Your feedback received a new reply. Open your NitroPing follow-up link to read it.",
              "<p>Your feedback received a new reply.</p><p>Open your NitroPing follow-up link to read it.</p>",
            ),
          );
          ctx.waitUntil(
            enqueueTeamNotifications(
              env,
              context.organizationId,
              context.projectId,
              "feedback.replied",
              "A NitroPing feedback item received a reply",
              "A team member replied to feedback.",
              "<p>A team member replied to feedback.</p>",
            ),
          );
          if (env.EVENT_STREAM)
            ctx.waitUntil(
              env.EVENT_STREAM.getByName(context.projectId).publish({
                type: "feedback.replied",
                feedbackId: replyMatch[1],
                projectId: context.projectId,
                createdAt: comment.createdAt,
              }),
            );
        }
        return jsonResponse(comment, { status: 201, headers: cors });
      }
      const statusMatch = path.match(
        /^\/api\/v1\/dashboard\/feedback\/([^/]+)\/status$/,
      );
      if (statusMatch && request.method === "POST") {
        const accessError = await requireDashboardAccess(request, env, rid);
        if (accessError) return accessError;
        const body = (await jsonBody(request)) as { status?: FeedbackStatus };
        if (!body.status || !feedbackStatuses.includes(body.status))
          return error("VALIDATION_ERROR", "Invalid status", rid, 400);
        const projectId = url.searchParams.get("projectId");
        if (!projectId)
          return error(
            "PROJECT_ID_REQUIRED",
            "projectId is required",
            rid,
            400,
          );
        const context = await requireDashboardProject(
          request,
          env,
          url,
          projectId,
          rid,
          "feedback:write",
        );
        if (context instanceof Response) return context;
        const result = await Effect.runPromise(
          changeFeedbackStatus(repo, context, statusMatch[1], body.status),
        );
        if (!result)
          return error(
            "FEEDBACK_NOT_FOUND",
            "Feedback was not found",
            rid,
            404,
          );
        await writeAudit(
          env,
          context,
          "feedback.status.updated",
          "feedback",
          result.id,
          { status: result.status },
        );
        recordMetric(
          env,
          "feedback.updated",
          context.organizationId,
          context.projectId,
          [1],
        );
        const eventId = id();
        ctx.waitUntil(
          enqueueWebhookDeliveries(
            env,
            context.organizationId,
            context.projectId,
            result.id,
            "feedback.updated",
            eventId,
          ),
        );
        ctx.waitUntil(
          enqueueWatcherEmails(
            env,
            context.organizationId,
            context.projectId,
            result.id,
            "Your NitroPing feedback was updated",
            `The status of your feedback changed to ${result.status}.`,
            `<p>The status of your feedback changed to <strong>${result.status}</strong>.</p>`,
          ),
        );
        ctx.waitUntil(
          enqueueTeamNotifications(
            env,
            context.organizationId,
            context.projectId,
            "feedback.updated",
            "NitroPing feedback status updated",
            `Feedback status changed to ${result.status}.`,
            `<p>Feedback status changed to <strong>${result.status}</strong>.</p>`,
          ),
        );
        if (env.EVENT_STREAM)
          ctx.waitUntil(
            env.EVENT_STREAM.getByName(context.projectId).publish({
              type: "feedback.updated",
              feedbackId: result.id,
              projectId: context.projectId,
              createdAt: result.updatedAt,
            }),
          );
        return jsonResponse(result, { headers: cors });
      }
      if (env.ASSETS) {
        if (path === "/dashboard" || path === "/dashboard/")
          return env.ASSETS.fetch(
            new Request(new URL("/dashboard.html", request.url), request),
          );
        if (path === "/portal" || path === "/portal/")
          return env.ASSETS.fetch(
            new Request(new URL("/portal.html", request.url), request),
          );
        const followUpPageMatch = path.match(/^\/follow-up\/([^/]+)\/?$/);
        if (followUpPageMatch) {
          const followUpUrl = new URL("/follow-up.html", request.url);
          followUpUrl.searchParams.set("token", followUpPageMatch[1]);
          return env.ASSETS.fetch(new Request(followUpUrl, request));
        }
        if (path === "/follow-up" && url.searchParams.has("token"))
          return env.ASSETS.fetch(
            new Request(new URL("/follow-up.html", request.url), request),
          );
        return env.ASSETS.fetch(request);
      }
      return error("NOT_FOUND", "Endpoint was not found", rid, 404);
    } catch (cause) {
      return error(
        "INTERNAL_ERROR",
        "An unexpected error occurred",
        rid,
        500,
        String(env.ENVIRONMENT) === "development" ? String(cause) : undefined,
      );
    }
  },
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body as {
        type?: string;
        eventId?: string;
        sourceEventId?: string;
        feedbackId?: string;
        webhookId?: string;
        deliveryId?: string;
        eventType?: WebhookEventType;
        organizationId?: string;
        projectId?: string;
        email?: string;
        subject?: string;
        text?: string;
        html?: string;
        token?: string;
        cloudflareHostnameId?: string;
      };
      if (event.eventId) {
        const seen = await env.DB.prepare(
          "SELECT event_id FROM processed_events WHERE event_id = ?",
        )
          .bind(event.eventId)
          .first();
        if (seen) {
          message.ack();
          continue;
        }
      }
      if (
        event.type === "webhook.deliver" &&
        event.deliveryId &&
        event.webhookId &&
        event.sourceEventId &&
        event.eventType &&
        event.feedbackId &&
        event.organizationId &&
        event.projectId
      ) {
        const delivered = await deliverWebhook(env, {
          deliveryId: event.deliveryId,
          webhookId: event.webhookId,
          sourceEventId: event.sourceEventId,
          eventType: event.eventType,
          feedbackId: event.feedbackId,
          organizationId: event.organizationId,
          projectId: event.projectId,
        });
        if (!delivered) {
          message.retry({
            delaySeconds: Math.min(900, 10 * 2 ** message.attempts),
          });
          continue;
        }
      }
      if (event.type === "follow-up.requested" && event.email && event.token) {
        if (
          event.organizationId &&
          (await env.DB.prepare(
            "SELECT 1 FROM organizations WHERE id = ? AND deleted_at IS NULL",
          )
            .bind(event.organizationId)
            .first()) === null
        ) {
          message.ack();
          continue;
        }
        if (!(await claimEmailDelivery(env, event))) {
          message.ack();
          continue;
        }
        try {
          const link = `${env.PUBLIC_APP_URL}/follow-up/${event.token}`;
          await sendTransactionalEmail(env, {
            email: event.email,
            subject: "Track your NitroPing feedback",
            text: `Your feedback was received. Follow this link to track updates: ${link}`,
            html: `<p>Your feedback was received.</p><p><a href="${link}">Track your feedback</a></p><p style="color:#667085;font-size:12px">You requested email updates for this feedback. <a href="${env.PUBLIC_APP_URL}/api/v1/follow-up/${encodeURIComponent(event.token)}/unsubscribe">Unsubscribe from updates</a>.</p>`,
          });
          await markEmailDelivered(env, event.eventId!);
        } catch {
          await releaseEmailDelivery(env, event.eventId!);
          message.retry({
            delaySeconds: Math.min(900, 10 * 2 ** message.attempts),
          });
          continue;
        }
      }
      if (
        event.type === "email.send" &&
        event.email &&
        event.subject &&
        event.text &&
        event.html
      ) {
        if (
          event.organizationId &&
          (await env.DB.prepare(
            "SELECT 1 FROM organizations WHERE id = ? AND deleted_at IS NULL",
          )
            .bind(event.organizationId)
            .first()) === null
        ) {
          message.ack();
          continue;
        }
        if (!(await claimEmailDelivery(env, event))) {
          message.ack();
          continue;
        }
        try {
          await sendTransactionalEmail(env, {
            email: event.email,
            subject: event.subject,
            text: event.text,
            html: event.html,
          });
          await markEmailDelivered(env, event.eventId!);
        } catch {
          await releaseEmailDelivery(env, event.eventId!);
          message.retry({
            delaySeconds: Math.min(900, 10 * 2 ** message.attempts),
          });
          continue;
        }
      }
      if (
        event.type === "attachment.delete" &&
        typeof (event as { objectKey?: unknown }).objectKey === "string"
      ) {
        await env.ATTACHMENTS.delete(
          (event as { objectKey: string }).objectKey,
        );
      }
      if (event.type === "custom-domain.delete" && event.cloudflareHostnameId) {
        const provider = customDomainProvider(env);
        if (provider) {
          try {
            await provider.remove(event.cloudflareHostnameId);
          } catch {
            message.retry({
              delaySeconds: Math.min(900, 10 * 2 ** message.attempts),
            });
            continue;
          }
        }
      }
      if (
        event.type === "feedback.created" &&
        event.feedbackId &&
        event.organizationId &&
        event.projectId
      ) {
        const candidate = await env.DB.prepare(
          "SELECT title, body, email FROM feedback_items WHERE id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        )
          .bind(event.feedbackId, event.organizationId, event.projectId)
          .first<{ title: string; body: string; email: string | null }>();
        if (candidate) {
          const duplicate = await env.DB.prepare(
            `SELECT id FROM feedback_items
             WHERE organization_id = ? AND project_id = ? AND id <> ?
               AND deleted_at IS NULL AND status <> 'spam'
               AND title = ? AND body = ?
               AND datetime(created_at) >= datetime('now', '-30 days')
             ORDER BY created_at DESC LIMIT 1`,
          )
            .bind(
              event.organizationId,
              event.projectId,
              event.feedbackId,
              candidate.title,
              candidate.body,
            )
            .first<{ id: string }>();
          const baseAnalysis = analyzeModeration(candidate);
          const analysis = duplicate
            ? {
                ...baseAnalysis,
                decision: "review" as const,
                flags: [...baseAnalysis.flags, "duplicate_feedback" as const],
                score: Math.min(1, baseAnalysis.score + 0.4),
                duplicateOf: duplicate.id,
              }
            : baseAnalysis;
          await env.DB.prepare(
            "INSERT OR IGNORE INTO moderation_events (id, organization_id, project_id, feedback_id, kind, outcome, metadata_json, created_at, event_id) VALUES (?, ?, ?, ?, 'rules', 'pending', ?, ?, ?)",
          )
            .bind(
              id(),
              event.organizationId,
              event.projectId,
              event.feedbackId,
              JSON.stringify(analysis),
              new Date().toISOString(),
              event.eventId ?? null,
            )
            .run();
        }
      }
      if (event.eventId)
        await env.DB.prepare(
          "INSERT OR IGNORE INTO processed_events (event_id, event_type, processed_at) VALUES (?, ?, ?)",
        )
          .bind(
            event.eventId,
            event.type ?? "unknown",
            new Date().toISOString(),
          )
          .run();
      message.ack();
    }
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await env.DB.prepare(
      "DELETE FROM processed_events WHERE datetime(processed_at) < datetime('now', '-90 days')",
    ).run();
    await env.DB.prepare(
      "DELETE FROM magic_link_tokens WHERE expires_at <= ? OR used_at IS NOT NULL",
    )
      .bind(new Date().toISOString())
      .run();
    const candidates = await env.DB.prepare(
      "SELECT f.id, f.organization_id AS organizationId, f.project_id AS projectId FROM feedback_items f JOIN project_settings s ON s.project_id = f.project_id AND s.organization_id = f.organization_id WHERE f.deleted_at IS NULL AND datetime(f.created_at) < datetime('now', '-' || s.retention_days || ' days') LIMIT 100",
    ).all<{ id: string; organizationId: string; projectId: string }>();
    for (const feedback of candidates.results ?? []) {
      const attachments = await env.DB.prepare(
        "SELECT object_key AS objectKey, size_bytes AS sizeBytes, created_at AS createdAt FROM attachments WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
      )
        .bind(feedback.id, feedback.organizationId, feedback.projectId)
        .all<{ objectKey: string; sizeBytes: number; createdAt: string }>();
      for (const attachment of attachments.results ?? [])
        await env.EVENTS.send({
          type: "attachment.delete",
          objectKey: attachment.objectKey,
          eventId: id(),
          organizationId: feedback.organizationId,
          projectId: feedback.projectId,
        });
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE feedback_items SET email = NULL, body = '[retained data removed]', metadata_json = '{}', deleted_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND project_id = ?",
        ).bind(
          now,
          now,
          feedback.id,
          feedback.organizationId,
          feedback.projectId,
        ),
        env.DB.prepare(
          "UPDATE attachments SET deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(now, feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "UPDATE feedback_comments SET body = '[retained data removed]', deleted_at = ? WHERE feedback_id = ? AND organization_id = ? AND project_id = ? AND deleted_at IS NULL",
        ).bind(
          now,
          feedback.id,
          feedback.organizationId,
          feedback.projectId,
        ),
        env.DB.prepare(
          "DELETE FROM feedback_watchers WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "DELETE FROM magic_link_tokens WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "DELETE FROM consent_records WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "DELETE FROM feedback_status_history WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "DELETE FROM feedback_tag_links WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "DELETE FROM roadmap_feedback_links WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "DELETE FROM changelog_feedback_links WHERE feedback_id = ? AND organization_id = ? AND project_id = ?",
        ).bind(feedback.id, feedback.organizationId, feedback.projectId),
        env.DB.prepare(
          "INSERT INTO privacy_requests (id, organization_id, project_id, kind, status, created_at, completed_at) VALUES (?, ?, ?, 'delete', 'completed', ?, ?)",
        ).bind(id(), feedback.organizationId, feedback.projectId, now, now),
      ]);
      await releaseAttachmentUsage(
        env,
        feedback.organizationId,
        (attachments.results ?? []).map(({ sizeBytes, createdAt }) => ({
          sizeBytes,
          createdAt,
        })),
      );
      if (env.FEEDBACK_SEARCH)
        await deleteFeedbackEmbedding(env.FEEDBACK_SEARCH, feedback.id).catch(
          () => undefined,
        );
    }
  },
};
