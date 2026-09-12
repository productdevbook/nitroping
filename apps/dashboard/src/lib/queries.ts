import { QueryClient, queryOptions } from "@tanstack/react-query";
import type { Feedback } from "@nitroping/contracts";
import { ApiError, api } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import type {
  Analytics,
  ApiKeyItem,
  AuditItem,
  Billing,
  Category,
  ChangelogItem,
  CustomDomain,
  FeedbackDetail,
  MemberItem,
  ModerationItem,
  NotificationPreference,
  Organization,
  Project,
  RoadmapItem,
  Session,
  Settings,
  Usage,
  WebhookItem,
} from "@/lib/types";

/*
 * Server state lives in the query cache and nowhere else. Keys are nested under
 * the project so realtime — which only knows that *something* changed in a
 * project — can invalidate a whole project with one call.
 */
export const keys = {
  session: ["session"] as const,
  organizations: ["organizations"] as const,
  projects: ["projects"] as const,
  members: (organizationId: string) => ["members", organizationId] as const,
  project: (projectId: string) => ["project", projectId] as const,
  resource: (projectId: string, resource: string) =>
    ["project", projectId, resource] as const,
  feedbackList: (projectId: string, filters: FeedbackFilters) =>
    ["project", projectId, "feedback", filters] as const,
  feedbackDetail: (projectId: string, feedbackId: string) =>
    ["project", projectId, "feedback-detail", feedbackId] as const,
};

export type FeedbackFilters = {
  status: string;
  type: string;
  priority: string;
  query: string;
  mode: "keyword" | "semantic";
};

export const emptyFilters: FeedbackFilters = {
  status: "all",
  type: "all",
  priority: "all",
  query: "",
  mode: "semantic",
};

/*
 * A 401 means the session is gone: retrying cannot fix it, and every caller
 * wants the same answer, so the router redirects on it instead.
 */
export const isUnauthorized = (error: unknown) =>
  error instanceof ApiError && error.status === 401;

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !isUnauthorized(error) && failureCount < 2,
      },
    },
  });

const list =
  <T>(path: string, credentials?: ApiOptions) =>
  async () =>
    (await api<{ items: T[] }>(path, credentials)).items;

export const sessionQuery = queryOptions({
  queryKey: keys.session,
  queryFn: () => api<Session>("/dashboard/session"),
  retry: false,
});

export const organizationsQuery = queryOptions({
  queryKey: keys.organizations,
  queryFn: list<Organization>("/dashboard/organizations"),
  retry: false,
});

export const projectsQuery = queryOptions({
  queryKey: keys.projects,
  queryFn: list<Project>("/dashboard/projects"),
  retry: false,
});

export const membersQuery = (organizationId: string) =>
  queryOptions({
    queryKey: keys.members(organizationId),
    queryFn: list<MemberItem>(
      `/dashboard/organizations/${organizationId}/members`,
    ),
    enabled: organizationId.length > 0,
  });

/*
 * Every project-scoped query takes the same two arguments, so they are built
 * from one factory: the project id names the cache entry, the credentials are
 * the project keys the API expects alongside the session cookie.
 */
const projectResource =
  <Payload, Result = Payload>(
    resource: string,
    path: (projectId: string) => string,
    select?: (payload: Payload) => Result,
  ) =>
  (projectId: string, credentials: ApiOptions) =>
    queryOptions({
      queryKey: keys.resource(projectId, resource),
      queryFn: async (): Promise<Result> => {
        const payload = await api<Payload>(path(projectId), credentials);
        return select ? select(payload) : (payload as unknown as Result);
      },
      enabled: projectId.length > 0,
    });

const scoped = (projectId: string, path: string) =>
  `/dashboard/projects/${encodeURIComponent(projectId)}${path}`;
const withProject = (projectId: string, path: string) =>
  `${scoped(projectId, path)}?projectId=${encodeURIComponent(projectId)}`;

export const analyticsQuery = projectResource<Analytics>(
  "analytics",
  (projectId) => withProject(projectId, "/analytics"),
);
export const usageQuery = projectResource<Usage>("usage", (projectId) =>
  withProject(projectId, "/usage"),
);
export const settingsQuery = projectResource<Settings>(
  "settings",
  (projectId) => withProject(projectId, "/settings"),
);
export const categoriesQuery = projectResource<{ items: Category[] }, Category[]>(
  "categories",
  (projectId) => scoped(projectId, "/categories"),
  (payload) => payload.items,
);
export const roadmapQuery = projectResource<
  { items: RoadmapItem[] },
  RoadmapItem[]
>("roadmap", (projectId) => withProject(projectId, "/roadmap"), (payload) => payload.items);
export const changelogQuery = projectResource<
  { items: ChangelogItem[] },
  ChangelogItem[]
>("changelog", (projectId) => withProject(projectId, "/changelog"), (payload) => payload.items);
export const moderationQuery = projectResource<
  { items: ModerationItem[] },
  ModerationItem[]
>("moderation", (projectId) => scoped(projectId, "/moderation"), (payload) => payload.items);
export const auditQuery = projectResource<{ items: AuditItem[] }, AuditItem[]>(
  "audit-logs",
  (projectId) => scoped(projectId, "/audit-logs"),
  (payload) => payload.items,
);
export const apiKeysQuery = projectResource<{ items: ApiKeyItem[] }, ApiKeyItem[]>(
  "api-keys",
  (projectId) => scoped(projectId, "/api-keys"),
  (payload) => payload.items,
);
export const webhooksQuery = projectResource<
  { items: WebhookItem[] },
  WebhookItem[]
>("webhooks", (projectId) => scoped(projectId, "/webhooks"), (payload) => payload.items);
export const notificationsQuery = projectResource<
  { items: NotificationPreference[] },
  NotificationPreference[]
>("notifications", (projectId) => scoped(projectId, "/notifications"), (payload) => payload.items);
export const customDomainQuery = projectResource<
  { domain: CustomDomain | null },
  CustomDomain | null
>("custom-domain", (projectId) => scoped(projectId, "/custom-domain"), (payload) => payload.domain);
export const billingQuery = (projectId: string, credentials: ApiOptions) =>
  queryOptions({
    queryKey: keys.resource(projectId, "billing"),
    queryFn: () =>
      api<Billing>(
        `/dashboard/billing?projectId=${encodeURIComponent(projectId)}`,
        credentials,
      ),
    enabled: projectId.length > 0,
  });

export const feedbackListQuery = (
  projectId: string,
  credentials: ApiOptions,
  filters: FeedbackFilters,
) =>
  queryOptions({
    queryKey: keys.feedbackList(projectId, filters),
    queryFn: async () => {
      const trimmed = filters.query.trim();
      /* Semantic search is its own endpoint and ignores the column filters. */
      if (filters.mode === "semantic" && trimmed.length >= 2)
        return (
          await api<{ items: Feedback[] }>(
            `${scoped(projectId, "/feedback/search")}?projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(trimmed)}&limit=50`,
            credentials,
          )
        ).items;
      const search = new URLSearchParams({ projectId, limit: "50" });
      if (trimmed) search.set("q", trimmed);
      if (filters.status !== "all") search.set("status", filters.status);
      if (filters.type !== "all") search.set("type", filters.type);
      if (filters.priority !== "all") search.set("priority", filters.priority);
      return (
        await api<{ items: Feedback[] }>(
          `${scoped(projectId, "/feedback")}?${search}`,
          credentials,
        )
      ).items;
    },
    enabled: projectId.length > 0,
    placeholderData: (previous) => previous,
  });

export const feedbackDetailQuery = (
  projectId: string,
  credentials: ApiOptions,
  feedbackId: string,
) =>
  queryOptions({
    queryKey: keys.feedbackDetail(projectId, feedbackId),
    queryFn: () =>
      api<FeedbackDetail>(
        `/dashboard/feedback/${encodeURIComponent(feedbackId)}?projectId=${encodeURIComponent(projectId)}`,
        credentials,
      ),
    enabled: projectId.length > 0 && feedbackId.length > 0,
  });
