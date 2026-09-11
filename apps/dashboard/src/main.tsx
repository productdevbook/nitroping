import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import "./styles.css";

type View =
  | "inbox"
  | "insights"
  | "moderation"
  | "roadmap"
  | "changelog"
  | "audit"
  | "developer"
  | "team"
  | "notifications"
  | "billing"
  | "widget"
  | "settings"
  | "privacy";
type ApiOptions = RequestInit & { projectKey?: string; serverKey?: string };
type FeedbackDetail = {
  feedback: Feedback;
  comments: Array<{
    id: string;
    body: string;
    isInternal: number;
    createdAt: string;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
  }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
};
type Analytics = {
  total: number;
  statuses: Array<{ status: string; count: number }>;
  platforms: Array<{ platform: string; count: number }>;
  types: Array<{ type: string; count: number }>;
  volume: Array<{ date: string; count: number }>;
  averageResponseMinutes: number | null;
  averageResolutionMinutes: number | null;
};
type Usage = {
  plan: string;
  period: string;
  feedbackCount: number;
  feedbackLimit: number;
  attachmentBytes: number;
};
type Settings = {
  theme: Record<string, unknown>;
  allowedMetadata: string[];
  retentionDays: number;
  origins: string[];
};
type Organization = { id: string; name: string; slug: string; role: string };
type Project = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  publicKey: string;
};
type ModerationItem = Feedback & {
  feedbackId: string;
  kind: string;
  outcome: string;
  createdAt: string;
};
type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
type ApiKeyItem = {
  id: string;
  kind: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
};
type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  active: number;
  createdAt: string;
};
type MemberItem = {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
};
type Session = { userId: string; email: string; displayName: string };
type NotificationPreference = { eventType: string; enabled: boolean };
type Billing = {
  plan: string;
  status: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
};
type Category = { id: string; name: string; slug: string; createdAt: string };
type FeedbackPriority = "low" | "normal" | "high" | "urgent";

const apiBase = "/api/v1";
const statuses: FeedbackStatus[] = [
  "new",
  "triaged",
  "planned",
  "in_progress",
  "resolved",
  "closed",
  "spam",
];
const priorities: FeedbackPriority[] = ["low", "normal", "high", "urgent"];
const statusLabel = (value: string) => value.replaceAll("_", " ");
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
const initials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { projectKey, serverKey, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (projectKey) requestHeaders.set("x-nitroping-project-key", projectKey);
  if (serverKey) requestHeaders.set("x-nitroping-server-key", serverKey);
  if (init.body && !requestHeaders.has("content-type"))
    requestHeaders.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: requestHeaders,
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(
      data.error?.message ?? `Request failed (${response.status})`,
    );
  return data;
}

function App() {
  const [view, setView] = useState<View>("inbox");
  const [projectId, setProjectId] = useState(
    () => localStorage.getItem("np.project") ?? "",
  );
  const [publicKey, setPublicKey] = useState(
    () => localStorage.getItem("np.public") ?? "",
  );
  const [serverKey, setServerKey] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [newWorkspaceProjectName, setNewWorkspaceProjectName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selected, setSelected] = useState<FeedbackDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [roadmap, setRoadmap] = useState<Array<Record<string, string>>>([]);
  const [changelog, setChangelog] = useState<
    Array<Record<string, string | null>>
  >([]);
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(
    [],
  );
  const [billing, setBilling] = useState<Billing | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const credentials = {
    projectKey: publicKey || undefined,
    serverKey: serverKey || undefined,
  };
  const activeProject = projects.find((project) => project.id === projectId);
  const activeOrganization =
    organizations.find(
      (organization) => organization.id === activeProject?.organizationId,
    ) ?? organizations[0];
  const filteredFeedback = useMemo(
    () =>
      feedback.filter(
        (item) =>
          (filter === "all" || item.status === filter) &&
          `${item.title} ${item.body} ${item.type}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [feedback, filter, query],
  );

  const loadInbox = async () => {
    setLoading(true);
    try {
      const feedbackQuery = new URLSearchParams({ limit: "50" });
      if (query.trim()) feedbackQuery.set("q", query.trim());
      if (filter !== "all") feedbackQuery.set("status", filter);
      const [list, insight, currentUsage] = await Promise.all([
        api<{ items: Feedback[] }>(
          `/dashboard/projects/${encodeURIComponent(projectId)}/feedback?projectId=${encodeURIComponent(projectId)}&${feedbackQuery}`,
          credentials,
        ),
        api<Analytics>(
          `/dashboard/projects/${encodeURIComponent(projectId)}/analytics?projectId=${encodeURIComponent(projectId)}`,
          credentials,
        ),
        api<Usage>(
          `/dashboard/projects/${encodeURIComponent(projectId)}/usage?projectId=${encodeURIComponent(projectId)}`,
          credentials,
        ),
      ]);
      setFeedback(list.items);
      setAnalytics(insight);
      setUsage(currentUsage);
      setNotice({ text: "Workspace refreshed" });
    } catch (error) {
      setNotice({
        text:
          error instanceof Error ? error.message : "Unable to load workspace",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspace = async () => {
    try {
      const [sessionResult, organizationResult, projectResult] =
        await Promise.all([
          api<Session>("/dashboard/session"),
          api<{ items: Organization[] }>("/dashboard/organizations"),
          api<{ items: Project[] }>("/dashboard/projects"),
        ]);
      setSession(sessionResult);
      setOrganizations(organizationResult.items);
      setProjects(projectResult.items);
      if (organizationResult.items[0]) {
        try {
          const memberResult = await api<{ items: MemberItem[] }>(
            `/dashboard/organizations/${organizationResult.items[0].id}/members`,
          );
          setMembers(memberResult.items);
        } catch {
          setMembers([]);
        }
      }
      const selectedProject =
        projectResult.items.find((item) => item.id === projectId) ??
        projectResult.items[0];
      if (selectedProject) {
        setProjectId(selectedProject.id);
        setPublicKey(selectedProject.publicKey);
        localStorage.setItem("np.project", selectedProject.id);
        localStorage.setItem("np.public", selectedProject.publicKey);
      }
      setWorkspaceReady(true);
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "Unable to load your workspace",
        error: true,
      });
      setWorkspaceReady(true);
    }
  };

  const createWorkspace = async (
    organizationName: string,
    projectName: string,
  ) => {
    setSetupLoading(true);
    try {
      const organization =
        organizations[0] ??
        (await api<Organization>("/dashboard/organizations", {
          method: "POST",
          body: JSON.stringify({ name: organizationName }),
        }));
      if (!organizations.length) setOrganizations([organization]);
      const project = await api<Project & { serverKey?: string }>(
        `/dashboard/organizations/${organization.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: projectName }) },
      );
      setProjects([project]);
      setProjectId(project.id);
      setPublicKey(project.publicKey);
      localStorage.setItem("np.project", project.id);
      localStorage.setItem("np.public", project.publicKey);
      setNotice({ text: "Your workspace is ready" });
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : "Workspace setup failed",
        error: true,
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const createProject = async () => {
    if (!activeOrganization || newProjectName.trim().length < 2) return;
    setCreatingProject(true);
    try {
      const project = await api<Project>(
        `/dashboard/organizations/${activeOrganization.id}/projects`,
        {
          method: "POST",
          body: JSON.stringify({ name: newProjectName.trim() }),
        },
      );
      setProjects((items) => [...items, project]);
      setNewProjectName("");
      setProjectId(project.id);
      setPublicKey(project.publicKey);
      setSelected(null);
      setView("inbox");
      setFilter("all");
      setQuery("");
      localStorage.setItem("np.project", project.id);
      localStorage.setItem("np.public", project.publicKey);
      setNotice({ text: "Project created" });
    } catch (error) {
      setNotice({
        text:
          error instanceof Error ? error.message : "Unable to create project",
        error: true,
      });
    } finally {
      setCreatingProject(false);
    }
  };

  const createOrganizationWorkspace = async () => {
    if (
      newOrganizationName.trim().length < 2 ||
      newWorkspaceProjectName.trim().length < 2
    )
      return;
    setCreatingWorkspace(true);
    try {
      const organization = await api<Organization>("/dashboard/organizations", {
        method: "POST",
        body: JSON.stringify({ name: newOrganizationName.trim() }),
      });
      const project = await api<Project>(
        `/dashboard/organizations/${organization.id}/projects`,
        {
          method: "POST",
          body: JSON.stringify({ name: newWorkspaceProjectName.trim() }),
        },
      );
      setOrganizations((items) => [...items, organization]);
      setProjects((items) => [...items, project]);
      setProjectId(project.id);
      setPublicKey(project.publicKey);
      setSelected(null);
      setView("inbox");
      setFilter("all");
      setQuery("");
      localStorage.setItem("np.project", project.id);
      localStorage.setItem("np.public", project.publicKey);
      setNewOrganizationName("");
      setNewWorkspaceProjectName("");
      setCreatingWorkspace(false);
      setNotice({ text: "Workspace created" });
    } catch (error) {
      setNotice({
        text:
          error instanceof Error ? error.message : "Unable to create workspace",
        error: true,
      });
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const loadView = async (nextView: View) => {
    setView(nextView);
    try {
      if (nextView === "roadmap")
        setRoadmap(
          (
            await api<{ items: Array<Record<string, string>> }>(
              `/dashboard/projects/${projectId}/roadmap?projectId=${projectId}`,
              credentials,
            )
          ).items,
        );
      if (nextView === "changelog")
        setChangelog(
          (
            await api<{ items: Array<Record<string, string | null>> }>(
              `/dashboard/projects/${projectId}/changelog?projectId=${projectId}`,
              credentials,
            )
          ).items,
        );
      if (nextView === "moderation")
        setModeration(
          (
            await api<{ items: ModerationItem[] }>(
              `/dashboard/projects/${projectId}/moderation`,
              credentials,
            )
          ).items,
        );
      if (nextView === "audit")
        setAuditLogs(
          (
            await api<{ items: AuditItem[] }>(
              `/dashboard/projects/${projectId}/audit-logs`,
              credentials,
            )
          ).items,
        );
      if (nextView === "developer") {
        const [keys, hooks] = await Promise.all([
          api<{ items: ApiKeyItem[] }>(
            `/dashboard/projects/${projectId}/api-keys`,
            credentials,
          ),
          api<{ items: WebhookItem[] }>(
            `/dashboard/projects/${projectId}/webhooks`,
            credentials,
          ),
        ]);
        setApiKeys(keys.items);
        setWebhooks(hooks.items);
      }
      if (nextView === "team" && activeOrganization)
        setMembers(
          (
            await api<{ items: MemberItem[] }>(
              `/dashboard/organizations/${activeOrganization.id}/members`,
              credentials,
            )
          ).items,
        );
      if (nextView === "notifications")
        setNotifications(
          (
            await api<{ items: NotificationPreference[] }>(
              `/dashboard/projects/${projectId}/notifications`,
              credentials,
            )
          ).items,
        );
      if (nextView === "billing")
        setBilling(
          await api<Billing>(
            `/dashboard/billing?projectId=${encodeURIComponent(projectId)}`,
            credentials,
          ),
        );
      if (nextView === "settings")
        setSettings(
          await api<Settings>(
            `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
            credentials,
          ),
        );
      if (nextView === "privacy")
        setSettings(
          await api<Settings>(
            `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
            credentials,
          ),
        );
      if (nextView === "widget") {
        const [categoryResult, settingsResult] = await Promise.all([
          api<{ items: Category[] }>(
            `/dashboard/projects/${projectId}/categories`,
            credentials,
          ),
          api<Settings>(
            `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
            credentials,
          ),
        ]);
        setCategories(categoryResult.items);
        setSettings(settingsResult);
      }
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : "Unable to load view",
        error: true,
      });
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);
  useEffect(() => {
    if (workspaceReady && projectId) void loadInbox();
  }, [workspaceReady, projectId, query, filter]);

  const openFeedback = async (item: Feedback) => {
    try {
      setSelected(
        await api<FeedbackDetail>(
          `/dashboard/feedback/${item.id}?projectId=${projectId}`,
          credentials,
        ),
      );
    } catch (error) {
      setNotice({
        text:
          error instanceof Error ? error.message : "Unable to open feedback",
        error: true,
      });
    }
  };

  const changeStatus = async (item: Feedback, status: FeedbackStatus) => {
    try {
      const updated = await api<Feedback>(
        `/dashboard/feedback/${item.id}/status?projectId=${projectId}`,
        { ...credentials, method: "POST", body: JSON.stringify({ status }) },
      );
      setFeedback((items) =>
        items.map((entry) => (entry.id === item.id ? updated : entry)),
      );
      if (selected?.feedback.id === item.id)
        setSelected({ ...selected, feedback: updated });
      setNotice({ text: "Status updated" });
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : "Status update failed",
        error: true,
      });
    }
  };

  const saveWorkspace = () => {
    localStorage.setItem("np.project", projectId);
    localStorage.setItem("np.public", publicKey);
    void loadInbox();
  };
  const selectProject = (nextProjectId: string) => {
    const nextProject = projects.find(
      (project) => project.id === nextProjectId,
    );
    if (!nextProject) return;
    setProjectId(nextProject.id);
    setPublicKey(nextProject.publicKey);
    setSelected(null);
    setView("inbox");
    setFilter("all");
    setQuery("");
    localStorage.setItem("np.project", nextProject.id);
    localStorage.setItem("np.public", nextProject.publicKey);
  };

  if (!workspaceReady)
    return (
      <div className="setup-shell">
        <div className="setup-card">
          <span className="brand-mark">N</span>
          <h1>Loading your workspace</h1>
          <p>Connecting to NitroPing securely…</p>
          <div className="loader" />
        </div>
      </div>
    );
  if (!projectId)
    return (
      <WorkspaceSetup
        organizations={organizations}
        loading={setupLoading}
        onCreate={createWorkspace}
      />
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">N</span>
          <span>
            Nitro<strong>Ping</strong>
          </span>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-icon">
            {(activeOrganization?.name ?? "N")[0]}
          </span>
          <div className="workspace-switcher-copy">
            <small>{activeOrganization?.name ?? "Workspace"}</small>
            <select
              aria-label="Switch project"
              value={projectId}
              onChange={(event) => selectProject(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <span className="chevron">⌄</span>
        </div>
        {activeOrganization && (
          <div className="project-create">
            <button
              className="project-create-trigger"
              onClick={() => setCreatingProject((value) => !value)}
            >
              ＋ New project
            </button>
            {creatingProject && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void createProject();
                }}
              >
                <input
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="Project name"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={creatingProject || newProjectName.trim().length < 2}
                >
                  {creatingProject ? "Creating…" : "Create"}
                </button>
              </form>
            )}
            <button
              className="project-create-trigger workspace-create-trigger"
              onClick={() => setCreatingWorkspace((value) => !value)}
            >
              ＋ New workspace
            </button>
            {creatingWorkspace && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void createOrganizationWorkspace();
                }}
              >
                <input
                  value={newOrganizationName}
                  onChange={(event) =>
                    setNewOrganizationName(event.target.value)
                  }
                  placeholder="Workspace name"
                  autoFocus
                />
                <input
                  value={newWorkspaceProjectName}
                  onChange={(event) =>
                    setNewWorkspaceProjectName(event.target.value)
                  }
                  placeholder="First project"
                />
                <button
                  type="submit"
                  disabled={
                    creatingWorkspace ||
                    newOrganizationName.trim().length < 2 ||
                    newWorkspaceProjectName.trim().length < 2
                  }
                >
                  {creatingWorkspace ? "Creating…" : "Create"}
                </button>
              </form>
            )}
          </div>
        )}
        <nav className="nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          <NavItem
            active={view === "inbox"}
            icon="◈"
            label="Inbox"
            count={feedback.filter((item) => item.status === "new").length}
            onClick={() => loadView("inbox")}
          />
          <NavItem
            active={view === "insights"}
            icon="◒"
            label="Insights"
            onClick={() => loadView("insights")}
          />
          <NavItem
            active={view === "moderation"}
            icon="◇"
            label="Moderation"
            onClick={() => loadView("moderation")}
          />
          <p className="nav-label section-label">Product</p>
          <NavItem
            active={view === "roadmap"}
            icon="↗"
            label="Roadmap"
            onClick={() => loadView("roadmap")}
          />
          <NavItem
            active={view === "changelog"}
            icon="✦"
            label="Changelog"
            onClick={() => loadView("changelog")}
          />
          <NavItem
            active={view === "audit"}
            icon="▤"
            label="Audit log"
            onClick={() => loadView("audit")}
          />
          <NavItem
            active={view === "developer"}
            icon="⌘"
            label="Developer"
            onClick={() => loadView("developer")}
          />
          <NavItem
            active={view === "team"}
            icon="◎"
            label="Team"
            onClick={() => loadView("team")}
          />
          <NavItem
            active={view === "notifications"}
            icon="♢"
            label="Notifications"
            onClick={() => loadView("notifications")}
          />
          <NavItem
            active={view === "billing"}
            icon="$"
            label="Billing & usage"
            onClick={() => loadView("billing")}
          />
          <p className="nav-label section-label">Manage</p>
          <NavItem
            active={view === "widget"}
            icon="▣"
            label="Widget builder"
            onClick={() => loadView("widget")}
          />
          <NavItem
            active={view === "settings"}
            icon="⚙"
            label="Project settings"
            onClick={() => loadView("settings")}
          />
          <NavItem
            active={view === "privacy"}
            icon="⌁"
            label="Privacy & data"
            onClick={() => loadView("privacy")}
          />
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-row">
              <span>{usage?.plan ?? "Free"} plan</span>
              <span>
                {usage ? `${usage.feedbackCount}/${usage.feedbackLimit}` : "—"}
              </span>
            </div>
            <div className="progress">
              <span
                style={{
                  width: `${Math.min(100, ((usage?.feedbackCount ?? 0) / (usage?.feedbackLimit || 1)) * 100)}%`,
                }}
              />
            </div>
            <button
              onClick={async () => {
                try {
                  const checkout = await api<{ url: string | null }>(
                    `/dashboard/billing/checkout?projectId=${projectId}`,
                    {
                      ...credentials,
                      method: "POST",
                      body: JSON.stringify({ plan: "pro" }),
                    },
                  );
                  if (checkout.url) location.assign(checkout.url);
                  else setNotice({ text: "Billing checkout is unavailable." });
                } catch (error) {
                  setNotice({
                    text:
                      error instanceof Error
                        ? error.message
                        : "Unable to open billing",
                    error: true,
                  });
                }
              }}
            >
              Upgrade plan <span>→</span>
            </button>
          </div>
          <div className="user-row">
            <span className="avatar">
              {initials(session?.displayName ?? session?.email ?? "User")}
            </span>
            <div>
              <strong>{session?.displayName ?? "Workspace user"}</strong>
              <small>{session?.email ?? "Authenticated user"}</small>
            </div>
            <span className="more">•••</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">N</span>Nitro<strong>Ping</strong>
          </div>
          <div className="breadcrumbs">
            <span>{activeOrganization?.name ?? "Workspace"}</span>
            <b>/</b>
            <strong>
              {activeProject?.name ?? "Project"} /{" "}
              {view === "inbox"
                ? "Inbox"
                : view[0].toUpperCase() + view.slice(1)}
            </strong>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search">
              ⌕
            </button>
            <button className="icon-button" aria-label="Notifications">
              ♢<i />
            </button>
            <button className="help-button">
              ? <span>Help center</span>
            </button>
          </div>
        </header>
        <div className="content-wrap">
          {notice && (
            <div
              className={`toast ${notice.error ? "toast-error" : ""}`}
              role="status"
            >
              {notice.text}
              <button onClick={() => setNotice(null)}>×</button>
            </div>
          )}
          {view === "inbox" && (
            <Inbox
              feedback={filteredFeedback}
              allFeedback={feedback}
              selected={selected}
              members={members}
              filter={filter}
              query={query}
              loading={loading}
              onFilter={setFilter}
              onQuery={setQuery}
              onOpen={openFeedback}
              onStatus={changeStatus}
              onPriority={async (item, priority) => {
                try {
                  const updated = await api<Feedback>(
                    `/dashboard/feedback/${item.id}?projectId=${projectId}`,
                    {
                      ...credentials,
                      method: "PATCH",
                      body: JSON.stringify({ priority }),
                    },
                  );
                  setFeedback((items) =>
                    items.map((entry) =>
                      entry.id === item.id ? updated : entry,
                    ),
                  );
                  setSelected((current) =>
                    current?.feedback.id === item.id
                      ? { ...current, feedback: updated }
                      : current,
                  );
                  setNotice({ text: "Priority updated" });
                } catch (error) {
                  setNotice({
                    text:
                      error instanceof Error
                        ? error.message
                        : "Priority update failed",
                    error: true,
                  });
                }
              }}
              onClose={() => setSelected(null)}
              onAssign={async (id, assigneeUserId) => {
                const updated = await api<Feedback>(
                  `/dashboard/feedback/${id}/assign?projectId=${projectId}`,
                  {
                    ...credentials,
                    method: "POST",
                    body: JSON.stringify({ assigneeUserId }),
                  },
                );
                setFeedback((items) =>
                  items.map((entry) => (entry.id === id ? updated : entry)),
                );
                setSelected((current) =>
                  current?.feedback.id === id
                    ? { ...current, feedback: updated }
                    : current,
                );
                setNotice({
                  text: assigneeUserId
                    ? "Feedback assigned"
                    : "Assignment cleared",
                });
              }}
              onMerge={async (id, targetFeedbackId) => {
                await api(
                  `/dashboard/feedback/${id}/merge?projectId=${projectId}`,
                  {
                    ...credentials,
                    method: "POST",
                    body: JSON.stringify({ targetFeedbackId }),
                  },
                );
                setSelected(null);
                await loadInbox();
                setNotice({ text: "Feedback merged" });
              }}
              onReply={async (id, body, internal) => {
                await api(
                  `/dashboard/feedback/${id}/reply?projectId=${projectId}`,
                  {
                    ...credentials,
                    method: "POST",
                    body: JSON.stringify({ body, internal }),
                  },
                );
                const item = feedback.find((entry) => entry.id === id);
                if (item) await openFeedback(item);
                setNotice({
                  text: internal ? "Internal note added" : "Reply sent",
                });
              }}
              onRefresh={loadInbox}
            />
          )}
          {view === "insights" && (
            <Insights
              analytics={analytics}
              usage={usage}
              onRefresh={loadInbox}
            />
          )}
          {view === "moderation" && (
            <Moderation
              items={moderation}
              credentials={credentials}
              projectId={projectId}
              onChange={() => void loadView("moderation")}
            />
          )}
          {view === "audit" && (
            <AuditLog
              items={auditLogs}
              onRefresh={() => void loadView("audit")}
            />
          )}
          {view === "developer" && (
            <DeveloperControls
              projectId={projectId}
              credentials={credentials}
              apiKeys={apiKeys}
              webhooks={webhooks}
              onRefresh={() => void loadView("developer")}
            />
          )}
          {view === "team" && (
            <Team
              members={members}
              organizationId={activeOrganization?.id ?? ""}
              credentials={credentials}
              onRefresh={() => void loadView("team")}
            />
          )}
          {view === "notifications" && (
            <Notifications
              items={notifications}
              credentials={credentials}
              projectId={projectId}
              onChange={setNotifications}
            />
          )}
          {view === "billing" && (
            <BillingPanel
              billing={billing}
              credentials={credentials}
              projectId={projectId}
              onRefresh={() => void loadView("billing")}
            />
          )}
          {view === "widget" && (
            <WidgetBuilder
              settings={settings}
              categories={categories}
              projectId={projectId}
              publicKey={publicKey}
              credentials={credentials}
              onSettings={setSettings}
              onCategories={setCategories}
              onNotice={setNotice}
            />
          )}
          {view === "roadmap" && (
            <Roadmap
              items={roadmap}
              credentials={credentials}
              projectId={projectId}
              feedback={feedback}
              onChange={() => void loadView("roadmap")}
            />
          )}
          {view === "changelog" && (
            <Changelog
              items={changelog}
              credentials={credentials}
              projectId={projectId}
              feedback={feedback}
              onChange={() => void loadView("changelog")}
            />
          )}
          {view === "settings" && (
            <SettingsPanel
              settings={settings}
              projectId={projectId}
              publicKey={publicKey}
              serverKey={serverKey}
              onProject={setProjectId}
              onPublic={setPublicKey}
              onServer={setServerKey}
              onSave={saveWorkspace}
              onSettings={setSettings}
            />
          )}
          {view === "privacy" && (
            <PrivacyPanel
              feedback={feedback}
              settings={settings}
              projectId={projectId}
              credentials={credentials}
              onRefresh={loadInbox}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function WorkspaceSetup({
  organizations,
  loading,
  onCreate,
}: {
  organizations: Organization[];
  loading: boolean;
  onCreate: (organizationName: string, projectName: string) => Promise<void>;
}) {
  const [organizationName, setOrganizationName] = useState(
    organizations[0]?.name ?? "",
  );
  const [projectName, setProjectName] = useState("");
  const existingOrganization = organizations[0];
  return (
    <div className="setup-shell">
      <div className="setup-card setup-card-wide">
        <div className="setup-brand">
          <span className="brand-mark">N</span>
          <span>
            Nitro<strong>Ping</strong>
          </span>
        </div>
        <p className="eyebrow">First steps</p>
        <h1>
          {existingOrganization
            ? "Create your first project"
            : "Create your workspace"}
        </h1>
        <p className="setup-copy">
          Connect your product to NitroPing and start turning user feedback into
          product momentum.
        </p>
        <div className="setup-fields">
          {!existingOrganization && (
            <label className="form-field">
              <span>Organization name</span>
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Acme Studio"
                autoFocus
              />
            </label>
          )}
          <label className="form-field">
            <span>Project name</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Web app"
              autoFocus={Boolean(existingOrganization)}
            />
          </label>
        </div>
        <button
          className="primary-button setup-submit"
          disabled={
            loading ||
            !projectName.trim() ||
            (!existingOrganization && !organizationName.trim())
          }
          onClick={() => onCreate(organizationName.trim(), projectName.trim())}
        >
          {loading ? "Setting up…" : "Create project →"}
        </button>
        <small className="setup-note">
          You can add more projects and team members later.
        </small>
      </div>
    </div>
  );
}

function NavItem({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      {label}
      {count ? <span className="nav-count">{count}</span> : null}
    </button>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow ?? "Workspace"}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Inbox({
  feedback,
  allFeedback,
  selected,
  members,
  filter,
  query,
  loading,
  onFilter,
  onQuery,
  onOpen,
  onStatus,
  onPriority,
  onClose,
  onAssign,
  onMerge,
  onReply,
  onRefresh,
}: {
  feedback: Feedback[];
  allFeedback: Feedback[];
  selected: FeedbackDetail | null;
  members: MemberItem[];
  filter: string;
  query: string;
  loading: boolean;
  onFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onOpen: (item: Feedback) => void;
  onStatus: (item: Feedback, status: FeedbackStatus) => void;
  onPriority: (item: Feedback, priority: FeedbackPriority) => void;
  onClose: () => void;
  onAssign: (id: string, assigneeUserId: string | null) => Promise<void>;
  onMerge: (id: string, targetFeedbackId: string) => Promise<void>;
  onReply: (id: string, body: string, internal: boolean) => Promise<void>;
  onRefresh: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Feedback workspace"
        title="Feedback inbox"
        description="Review what your users are saying and keep the product moving."
        action={
          <button className="primary-button" onClick={onRefresh}>
            ↻ <span>Refresh inbox</span>
          </button>
        }
      />
      <div className="metric-row">
        <Metric
          label="Total feedback"
          value={allFeedback.length}
          detail="All time"
          accent="purple"
        />
        <Metric
          label="Needs triage"
          value={allFeedback.filter((item) => item.status === "new").length}
          detail="New submissions"
          accent="orange"
        />
        <Metric
          label="In progress"
          value={
            allFeedback.filter((item) => item.status === "in_progress").length
          }
          detail="Being worked on"
          accent="blue"
        />
        <Metric
          label="Resolved"
          value={
            allFeedback.filter((item) => item.status === "resolved").length
          }
          detail="Closed the loop"
          accent="green"
        />
      </div>
      <section className="panel inbox-panel">
        <div className="panel-toolbar">
          <div className="tabs">
            {[
              ["all", "All feedback"],
              ["new", "Needs triage"],
              ["in_progress", "In progress"],
              ["resolved", "Resolved"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "selected" : ""}
                onClick={() => onFilter(value)}
              >
                {label}
                <span>
                  {value === "all"
                    ? allFeedback.length
                    : allFeedback.filter((item) => item.status === value)
                        .length}
                </span>
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <label className="search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Search feedback"
              />
            </label>
            <button className="filter-button" type="button" title="Use the status tabs and search to filter feedback" aria-label="Filter feedback">
              ☷ <span>Filter</span>
            </button>
          </div>
        </div>
        <div className="inbox-layout">
          <div className="feedback-list">
            {loading ? (
              <div className="empty-state">
                <div className="loader" />
                Loading feedback…
              </div>
            ) : feedback.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✦</div>
                <strong>No feedback here yet</strong>
                <p>New user feedback will appear in this view.</p>
              </div>
            ) : (
              feedback.map((item) => (
                <FeedbackRow
                  key={item.id}
                  item={item}
                  selected={selected?.feedback.id === item.id}
                  onOpen={() => onOpen(item)}
                  onStatus={(status) => onStatus(item, status)}
                />
              ))
            )}
          </div>
          {selected ? (
            <FeedbackDetailPanel
              detail={selected}
              members={members}
              onClose={onClose}
              onAssign={onAssign}
              onMerge={onMerge}
              onReply={onReply}
              onStatus={(status) => onStatus(selected.feedback, status)}
              onPriority={(priority) => onPriority(selected.feedback, priority)}
            />
          ) : (
            <div className="detail-placeholder">
              <div className="placeholder-art">
                <span>◈</span>
                <span>✦</span>
                <span>○</span>
              </div>
              <strong>Select feedback to inspect it</strong>
              <p>
                Replies, notes, status history, and context will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  accent: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${accent}`}>✦</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <span className="metric-trend">↗</span>
    </div>
  );
}

function FeedbackRow({
  item,
  selected,
  onOpen,
  onStatus,
}: {
  item: Feedback;
  selected: boolean;
  onOpen: () => void;
  onStatus: (status: FeedbackStatus) => void;
}) {
  return (
    <article
      className={`feedback-row ${selected ? "selected" : ""}`}
      onClick={onOpen}
    >
      <span className={`type-dot ${item.type}`} />{" "}
      <div className="feedback-main">
        <div className="feedback-title-row">
          <h3>{item.title}</h3>
          <time>{formatDate(item.createdAt)}</time>
        </div>
        <p>{item.body}</p>
        <div className="feedback-meta">
          <span className={`status-pill ${item.status}`}>
            {statusLabel(item.status)}
          </span>
          <span className="type-label">{statusLabel(item.type)}</span>
          {item.platform && <span className="type-label">{item.platform}</span>}
        </div>
      </div>
      <select
        value={item.status}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onStatus(event.target.value as FeedbackStatus)}
        aria-label="Change status"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
    </article>
  );
}

function FeedbackDetailPanel({
  detail,
  members,
  onClose,
  onAssign,
  onMerge,
  onReply,
  onStatus,
  onPriority,
}: {
  detail: FeedbackDetail;
  members: MemberItem[];
  onClose: () => void;
  onAssign: (id: string, assigneeUserId: string | null) => Promise<void>;
  onMerge: (id: string, targetFeedbackId: string) => Promise<void>;
  onReply: (id: string, body: string, internal: boolean) => Promise<void>;
  onStatus: (status: FeedbackStatus) => void;
  onPriority: (priority: FeedbackPriority) => void;
}) {
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const item = detail.feedback;
  return (
    <aside className="detail-panel">
      <div className="detail-head">
        <div>
          <span className={`status-pill ${item.status}`}>
            {statusLabel(item.status)}
          </span>
          <span className="detail-date">{formatDate(item.createdAt)}</span>
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      <h2>{item.title}</h2>
      <div className="detail-tags">
        <span>{statusLabel(item.type)}</span>
        <span>{item.platform ?? "Unknown platform"}</span>
        <span>{item.priority} priority</span>
        {detail.tags?.map((tag) => (
          <span key={tag.id}>{tag.name}</span>
        ))}
      </div>
      <p className="detail-body">{item.body}</p>
      {item.email && (
        <div className="user-card">
          <span className="avatar purple-avatar">
            {item.email[0].toUpperCase()}
          </span>
          <div>
            <strong>{item.email}</strong>
            <small>Feedback author</small>
          </div>
        </div>
      )}
      <div className="detail-controls">
        <label>
          Assignee
          <select
            value={item.assignedUserId ?? ""}
            onChange={(event) =>
              void onAssign(item.id, event.target.value || null)
            }
          >
            <option value="">Unassigned</option>
            {members
              .filter((member) => member.role !== "viewer")
              .map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.email}
                </option>
              ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={item.priority}
            onChange={(event) =>
              onPriority(event.target.value as FeedbackPriority)
            }
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {statusLabel(priority)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Merge duplicate
          <div className="merge-control">
            <input
              value={mergeTarget}
              onChange={(event) => setMergeTarget(event.target.value)}
              placeholder="Feedback ID"
            />
            <button
              className="secondary-button"
              disabled={!mergeTarget.trim()}
              onClick={async () => {
                await onMerge(item.id, mergeTarget.trim());
                setMergeTarget("");
              }}
            >
              Merge
            </button>
          </div>
        </label>
      </div>
      <div className="detail-section">
        <div className="section-heading">
          <strong>Activity</strong>
          <span>
            {detail.comments.length + detail.statusHistory.length} events
          </span>
        </div>
        {detail.statusHistory.map((event) => (
          <div className="activity-item" key={event.id}>
            <span className="activity-dot status-dot" />
            <div>
              <p>
                Status changed to <strong>{statusLabel(event.toStatus)}</strong>
              </p>
              <small>{formatDate(event.createdAt)}</small>
            </div>
          </div>
        ))}
        {detail.comments.map((comment) => (
          <div className="activity-item" key={comment.id}>
            <span
              className={`activity-dot ${comment.isInternal ? "note-dot" : "reply-dot"}`}
            />
            <div>
              <p>
                {comment.isInternal ? "Internal note" : "Reply"}: {comment.body}
              </p>
              <small>{formatDate(comment.createdAt)}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="reply-box">
        <div className="reply-mode">
          <button
            className={!internal ? "active" : ""}
            onClick={() => setInternal(false)}
          >
            Reply to user
          </button>
          <button
            className={internal ? "active note-mode" : ""}
            onClick={() => setInternal(true)}
          >
            Internal note
          </button>
        </div>
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder={
            internal
              ? "Leave a note for your team…"
              : "Write a thoughtful reply…"
          }
        />
        <div className="reply-footer">
          <span>⌘ ↵ to send</span>
          <button
            className={`primary-button ${internal ? "note-button" : ""}`}
            disabled={!reply.trim()}
            onClick={async () => {
              await onReply(item.id, reply.trim(), internal);
              setReply("");
            }}
          >
            Send {internal ? "note" : "reply"}
          </button>
        </div>
      </div>
      <div className="detail-status">
        <label>
          Status
          <select
            value={item.status}
            onChange={(event) => onStatus(event.target.value as FeedbackStatus)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}

function Moderation({
  items,
  credentials,
  projectId,
  onChange,
}: {
  items: ModerationItem[];
  credentials: ApiOptions;
  projectId: string;
  onChange: () => void;
}) {
  const decide = async (
    feedbackId: string,
    outcome: "approved" | "rejected" | "spam",
  ) => {
    try {
      await api(`/dashboard/projects/${projectId}/moderation`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ feedbackId, outcome }),
      });
      onChange();
    } catch {
      /* parent view will refresh on the next action */
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Trust & safety"
        title="Moderation queue"
        description="Review automated flags before they affect your public feedback stream."
        action={
          <button className="secondary-button" onClick={onChange}>
            ↻ Refresh queue
          </button>
        }
      />
      <section className="panel moderation-panel">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <strong>Queue is clear</strong>
            <p>New automated moderation events will appear here.</p>
          </div>
        ) : (
          items.map((item) => (
            <article className="moderation-row" key={item.feedbackId}>
              <div className="moderation-copy">
                <div className="feedback-meta">
                  <span className={`status-pill ${item.type}`}>
                    {statusLabel(item.type)}
                  </span>
                  <span className="type-label">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                {item.email && <small>{item.email}</small>}
              </div>
              <div className="moderation-actions">
                <button
                  className="secondary-button"
                  onClick={() => decide(item.feedbackId, "approved")}
                >
                  Approve
                </button>
                <button
                  className="secondary-button"
                  onClick={() => decide(item.feedbackId, "rejected")}
                >
                  Reject
                </button>
                <button
                  className="danger-button"
                  onClick={() => decide(item.feedbackId, "spam")}
                >
                  Mark spam
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}

function AuditLog({
  items,
  onRefresh,
}: {
  items: AuditItem[];
  onRefresh: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Security & accountability"
        title="Audit log"
        description="A durable record of changes made across this project."
        action={
          <button className="secondary-button" onClick={onRefresh}>
            ↻ Refresh log
          </button>
        }
      />
      <section className="panel audit-panel">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <strong>No audit events yet</strong>
            <p>Project activity will be recorded here.</p>
          </div>
        ) : (
          items.map((item) => (
            <article className="audit-row" key={item.id}>
              <span className="audit-icon">
                {item.action.startsWith("moderation") ? "◇" : "•"}
              </span>
              <div>
                <strong>{item.action.replaceAll(".", " · ")}</strong>
                <p>
                  {item.entityType} <code>{item.entityId}</code>
                </p>
              </div>
              <time>{formatDate(item.createdAt)}</time>
            </article>
          ))
        )}
      </section>
    </>
  );
}

function DeveloperControls({
  projectId,
  credentials,
  apiKeys,
  webhooks,
  onRefresh,
}: {
  projectId: string;
  credentials: ApiOptions;
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  onRefresh: () => void;
}) {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"public" | "server">("public");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const rotate = async () => {
    const created = await api<ApiKeyItem & { key: string }>(
      `/dashboard/projects/${projectId}/api-keys`,
      {
        ...credentials,
        method: "POST",
        body: JSON.stringify({
          kind,
          label: label || `${kind} integration key`,
        }),
      },
    );
    setLabel("");
    setSecret(created.key);
    onRefresh();
  };
  const addWebhook = async () => {
    if (!url.trim()) return;
    const created = await api<WebhookItem & { secret: string }>(
      `/dashboard/projects/${projectId}/webhooks`,
      {
        ...credentials,
        method: "POST",
        body: JSON.stringify({
          url,
          events: ["feedback.created", "feedback.updated", "feedback.replied"],
        }),
      },
    );
    setUrl("");
    setSecret(created.secret);
    onRefresh();
  };
  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Developer controls"
        description="Manage project credentials and signed event delivery."
        action={
          <button className="secondary-button" onClick={onRefresh}>
            ↻ Refresh
          </button>
        }
      />
      {secret && (
        <div className="secret-banner">
          <strong>Copy this secret now.</strong>
          <code>{secret}</code>
          <button onClick={() => setSecret(null)}>×</button>
        </div>
      )}
      <div className="developer-grid">
        <section className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>API keys</h2>
              <p>Secrets are shown only once when created.</p>
            </div>
          </div>
          <div className="developer-form">
            <select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as "public" | "server")
              }
            >
              <option value="public">Public SDK key</option>
              <option value="server">Server key</option>
            </select>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Key label"
            />
            <button className="primary-button" onClick={rotate}>
              Create key
            </button>
          </div>
          <div className="integration-list">
            {apiKeys.map((key) => (
              <div className="integration-row" key={key.id}>
                <span className={`key-kind ${key.kind}`}>{key.kind}</span>
                <div>
                  <strong>{key.label}</strong>
                  <small>
                    {key.keyPrefix}•••• · {key.revokedAt ? "Revoked" : "Active"}
                  </small>
                </div>
                <button
                  className="text-danger"
                  disabled={Boolean(key.revokedAt)}
                  onClick={async () => {
                    await api(
                      `/dashboard/projects/${projectId}/api-keys/${key.id}`,
                      { ...credentials, method: "DELETE" },
                    );
                    onRefresh();
                  }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Webhooks</h2>
              <p>Signed delivery for feedback events.</p>
            </div>
          </div>
          <div className="developer-form">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://your-app.com/nitroping"
            />
            <button className="primary-button" onClick={addWebhook}>
              Add webhook
            </button>
          </div>
          <div className="integration-list">
            {webhooks.map((hook) => (
              <div className="integration-row" key={hook.id}>
                <span className="key-kind webhook">hook</span>
                <div>
                  <strong>{hook.url}</strong>
                  <small>
                    {hook.events.length} events ·{" "}
                    {hook.active ? "Active" : "Disabled"}
                  </small>
                </div>
                <button
                  className="text-danger"
                  disabled={!hook.active}
                  onClick={async () => {
                    await api(
                      `/dashboard/projects/${projectId}/webhooks/${hook.id}`,
                      { ...credentials, method: "DELETE" },
                    );
                    onRefresh();
                  }}
                >
                  Disable
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Team({
  members,
  organizationId,
  credentials,
  onRefresh,
}: {
  members: MemberItem[];
  organizationId: string;
  credentials: ApiOptions;
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [sending, setSending] = useState(false);
  const invite = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      await api(`/dashboard/organizations/${organizationId}/invites`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setEmail("");
      onRefresh();
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="People & permissions"
        title="Team"
        description="Invite collaborators and keep project access explicit."
        action={
          <button className="secondary-button" onClick={onRefresh}>
            ↻ Refresh team
          </button>
        }
      />
      <section className="panel settings-card team-card">
        <div className="panel-heading">
          <div>
            <h2>Invite a teammate</h2>
            <p>
              Invitations expire after seven days and are restricted to the
              invited email.
            </p>
          </div>
        </div>
        <div className="developer-form">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@company.com"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="viewer">Viewer</option>
            <option value="billing_admin">Billing admin</option>
          </select>
          <button
            className="primary-button"
            disabled={sending}
            onClick={invite}
          >
            {sending ? "Sending…" : "Send invite"}
          </button>
        </div>
        <div className="member-list">
          {members.map((member) => (
            <div className="member-row" key={member.userId}>
              <span className="avatar purple-avatar">
                {member.email[0].toUpperCase()}
              </span>
              <div>
                <strong>{member.email}</strong>
                <small>
                  {member.role} · Joined {formatDate(member.createdAt)}
                </small>
              </div>
              {member.role === "owner" ? (
                <span className="role-badge">Owner</span>
              ) : (
                <button
                  className="text-danger"
                  onClick={async () => {
                    await api(
                      `/dashboard/organizations/${organizationId}/members/${member.userId}`,
                      { ...credentials, method: "DELETE" },
                    );
                    onRefresh();
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Notifications({
  items,
  credentials,
  projectId,
  onChange,
}: {
  items: NotificationPreference[];
  credentials: ApiOptions;
  projectId: string;
  onChange: (items: NotificationPreference[]) => void;
}) {
  const update = async (eventType: string, enabled: boolean) => {
    try {
      await api(`/dashboard/projects/${projectId}/notifications`, {
        ...credentials,
        method: "PATCH",
        body: JSON.stringify({ eventType, enabled }),
      });
      onChange(
        items.map((item) =>
          item.eventType === eventType ? { ...item, enabled } : item,
        ),
      );
    } catch {
      /* the parent toast handles the next navigation refresh */
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Personal workflow"
        title="Notifications"
        description="Choose which project events should reach your team inbox."
        action={
          <button
            className="secondary-button"
            onClick={() => location.reload()}
          >
            ↻ Refresh
          </button>
        }
      />
      <section className="panel settings-card notification-card">
        {items.map((item) => (
          <label className="notification-row" key={item.eventType}>
            <span>
              <strong>{statusLabel(item.eventType)}</strong>
              <small>Project activity notification</small>
            </span>
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(event) =>
                void update(item.eventType, event.target.checked)
              }
            />
          </label>
        ))}
      </section>
    </>
  );
}

function BillingPanel({
  billing,
  credentials,
  projectId,
  onRefresh,
}: {
  billing: Billing | null;
  credentials: ApiOptions;
  projectId: string;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const checkout = async (plan: "pro" | "business") => {
    setBusy(plan);
    try {
      const result = await api<{ url: string | null }>(
        `/dashboard/billing/checkout?projectId=${encodeURIComponent(projectId)}`,
        { ...credentials, method: "POST", body: JSON.stringify({ plan }) },
      );
      if (result.url) location.assign(result.url);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Billing checkout is unavailable.",
      );
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Workspace finance"
        title="Billing & usage"
        description="Manage your subscription and understand the limits applied to this workspace."
        action={
          <button className="secondary-button" onClick={onRefresh}>
            ↻ Refresh
          </button>
        }
      />
      <section className="settings-grid">
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Current subscription</h2>
              <p>Billing state is synchronized from the provider webhook.</p>
            </div>
            <span className="status-pill resolved">
              {billing?.status ?? "active"}
            </span>
          </div>
          <div className="usage-number">
            <strong>{billing?.plan ?? "free"}</strong>
            <span>plan</span>
          </div>
          <p className="muted">
            {billing?.currentPeriodEnd
              ? `Current period ends ${formatDate(billing.currentPeriodEnd)}`
              : "No paid subscription is active."}
          </p>
          <p className="muted">
            {billing?.providerSubscriptionId
              ? "Subscription is linked to Stripe."
              : "Upgrade to unlock higher limits and team features."}
          </p>
        </div>
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Usage</h2>
              <p>Current period consumption.</p>
            </div>
          </div>
          <div className="usage-number">
            <strong>
              {billing?.plan === "business"
                ? "Business"
                : billing?.plan === "pro"
                  ? "Pro"
                  : "Free"}
            </strong>
            <span>entitlement tier</span>
          </div>
          <p className="muted">
            Feedback and attachment limits are enforced server-side for every
            API request.
          </p>
        </div>
      </section>
      <section className="settings-grid" style={{ marginTop: 16 }}>
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Pro</h2>
              <p>For growing product teams.</p>
            </div>
            <strong>$29/mo</strong>
          </div>
          <p className="muted">
            Multiple projects, roadmap, changelog, webhooks, custom themes, and
            longer retention.
          </p>
          <button
            className="primary-button full-button"
            disabled={busy !== null || billing?.plan === "pro"}
            onClick={() => checkout("pro")}
          >
            {busy === "pro"
              ? "Opening checkout…"
              : billing?.plan === "pro"
                ? "Current plan"
                : "Upgrade to Pro"}
          </button>
        </div>
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Business</h2>
              <p>For organizations with advanced controls.</p>
            </div>
            <strong>Custom</strong>
          </div>
          <p className="muted">
            Advanced roles, SSO adapter, audit export, custom domains, retention
            controls, and SLA support.
          </p>
          <button
            className="secondary-button full-button"
            disabled={busy !== null || billing?.plan === "business"}
            onClick={() => checkout("business")}
          >
            {busy === "business"
              ? "Opening checkout…"
              : billing?.plan === "business"
                ? "Current plan"
                : "Upgrade to Business"}
          </button>
        </div>
      </section>
    </>
  );
}

function Insights({
  analytics,
  usage,
  onRefresh,
}: {
  analytics: Analytics | null;
  usage: Usage | null;
  onRefresh: () => void;
}) {
  const volume = analytics?.volume ?? [];
  const maximum = Math.max(1, ...volume.map((item) => item.count));
  return (
    <>
      <PageHeader
        eyebrow="Product intelligence"
        title="Insights"
        description="Understand the themes behind your users' voice."
        action={
          <button className="secondary-button" onClick={onRefresh}>
            ↻ Refresh data
          </button>
        }
      />
      <div className="analytics-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Feedback volume</h2>
              <p>Last 30 days</p>
            </div>
            <span className="period-pill">Live data</span>
          </div>
          {volume.length === 0 ? (
            <div className="mini-empty">No feedback volume recorded yet.</div>
          ) : (
            <div
              className="volume-chart"
              aria-label="Feedback volume for the last 30 days"
            >
              {volume.map((item) => (
                <div
                  className="volume-bar"
                  key={item.date}
                  title={`${item.date}: ${item.count}`}
                >
                  <i
                    style={{
                      height: `${Math.max(8, (item.count / maximum) * 100)}%`,
                    }}
                  />
                  <small>{item.date.slice(5)}</small>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel breakdown-panel">
          <div className="panel-heading">
            <div>
              <h2>By type</h2>
              <p>What users are asking for</p>
            </div>
          </div>
          {(analytics?.types ?? []).length === 0 ? (
            <div className="mini-empty">No type data yet.</div>
          ) : (
            analytics?.types.map((item, index) => (
              <div className="breakdown-row" key={item.type}>
                <span className={`breakdown-color c${index}`} />
                <span>{statusLabel(item.type)}</span>
                <strong>{item.count}</strong>
                <div className="mini-progress">
                  <i
                    style={{
                      width: `${Math.min(100, (item.count / Math.max(1, analytics.total)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      <div className="analytics-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Statuses</h2>
              <p>Where feedback sits in the workflow</p>
            </div>
          </div>
          {(analytics?.statuses ?? []).map((item) => (
            <div className="status-stat" key={item.status}>
              <span className={`status-pill ${item.status}`}>
                {statusLabel(item.status)}
              </span>
              <strong>{item.count}</strong>
              <span className="muted">items</span>
            </div>
          ))}
        </section>
        <section className="panel usage-panel">
          <div className="panel-heading">
            <div>
              <h2>Response health</h2>
              <p>Average time from submission</p>
            </div>
          </div>
          <div className="usage-number">
            <strong>
              {analytics?.averageResponseMinutes == null
                ? "—"
                : `${analytics.averageResponseMinutes}m`}
            </strong>
            <span>first response</span>
          </div>
          <p className="muted">
            {analytics?.averageResolutionMinutes == null
              ? "No resolved feedback yet"
              : `${analytics.averageResolutionMinutes}m average resolution`}
          </p>
          <div className="usage-number">
            <strong>{usage?.feedbackCount ?? 0}</strong>
            <span>/ {usage?.feedbackLimit ?? 100} monthly feedbacks</span>
          </div>
          <div className="progress large">
            <span
              style={{
                width: `${Math.min(100, ((usage?.feedbackCount ?? 0) / (usage?.feedbackLimit || 1)) * 100)}%`,
              }}
            />
          </div>
          <p className="muted">
            {usage?.plan ?? "Free"} plan · {usage?.attachmentBytes ?? 0}{" "}
            attachment bytes
          </p>
        </section>
      </div>
    </>
  );
}

type FeedbackLink = Pick<Feedback, "id" | "title" | "type" | "status">;

function FeedbackLinks({
  kind,
  itemId,
  projectId,
  credentials,
  feedback,
}: {
  kind: "roadmap" | "changelog";
  itemId: string;
  projectId: string;
  credentials: ApiOptions;
  feedback: Feedback[];
}) {
  const [linked, setLinked] = useState<FeedbackLink[]>([]);
  const [selected, setSelected] = useState("");
  const endpoint = `/dashboard/projects/${encodeURIComponent(projectId)}/${kind}/${encodeURIComponent(itemId)}/feedback`;
  const refresh = async () => {
    const result = await api<{ items: FeedbackLink[] }>(endpoint, credentials);
    setLinked(result.items);
  };
  useEffect(() => {
    void refresh();
  }, [endpoint]);
  const link = async () => {
    if (!selected) return;
    await api(endpoint, {
      ...credentials,
      method: "POST",
      body: JSON.stringify({ feedbackId: selected }),
    });
    setSelected("");
    await refresh();
  };
  const unlink = async (feedbackId: string) => {
    await api(`${endpoint}/${encodeURIComponent(feedbackId)}`, {
      ...credentials,
      method: "DELETE",
    });
    await refresh();
  };
  const available = feedback.filter(
    (item) => !linked.some((entry) => entry.id === item.id),
  );
  return (
    <div className="feedback-links">
      <div className="feedback-links-heading">
        <strong>Linked feedback</strong>
        <span>{linked.length}</span>
      </div>
      <div className="feedback-link-form">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          aria-label={`Link feedback to ${kind}`}
        >
          <option value="">Select feedback…</option>
          {available.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <button
          className="secondary-button"
          disabled={!selected}
          onClick={() => void link()}
        >
          Link
        </button>
      </div>
      {linked.length > 0 && (
        <div className="linked-feedback-list">
          {linked.map((item) => (
            <div className="linked-feedback" key={item.id}>
              <span className={`type-dot ${item.type}`} />
              <span title={item.title}>{item.title}</span>
              <button
                className="text-danger"
                onClick={() => void unlink(item.id)}
                aria-label={`Unlink ${item.title}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Roadmap({
  items,
  credentials,
  projectId,
  feedback,
  onChange,
}: {
  items: Array<Record<string, string>>;
  credentials: ApiOptions;
  projectId: string;
  feedback: Feedback[];
  onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const add = async () => {
    if (!title.trim()) return;
    await api(
      `/dashboard/projects/${projectId}/roadmap?projectId=${projectId}`,
      {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ title, body, status: "planned" }),
      },
    );
    setTitle("");
    setBody("");
    onChange();
  };
  return (
    <>
      <PageHeader
        eyebrow="Product direction"
        title="Roadmap"
        description="Turn recurring feedback into visible product progress."
        action={
          <button className="primary-button" onClick={add}>
            ＋ <span>Add item</span>
          </button>
        }
      />
      <section className="panel composer">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a roadmap item title…"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What are you planning to build?"
        />
        <button className="primary-button" onClick={add}>
          Create roadmap item
        </button>
      </section>
      <div className="roadmap-grid">
        {["planned", "in_progress", "completed"].map((status) => (
          <section className="roadmap-column" key={status}>
            <div className="column-heading">
              <span className={`column-dot ${status}`} />
              <h2>{statusLabel(status)}</h2>
              <span>
                {items.filter((item) => item.status === status).length}
              </span>
            </div>
            {items
              .filter((item) => item.status === status)
              .map((item) => (
                <article className="roadmap-card" key={item.id}>
                  <span className="card-kicker">Product</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <FeedbackLinks
                    kind="roadmap"
                    itemId={item.id}
                    projectId={projectId}
                    credentials={credentials}
                    feedback={feedback}
                  />
                  <small>
                    Updated{" "}
                    {item.updatedAt ? formatDate(item.updatedAt) : "recently"}
                  </small>
                </article>
              ))}
          </section>
        ))}
      </div>
    </>
  );
}

function Changelog({
  items,
  credentials,
  projectId,
  feedback,
  onChange,
}: {
  items: Array<Record<string, string | null>>;
  credentials: ApiOptions;
  projectId: string;
  feedback: Feedback[];
  onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const add = async () => {
    if (!title.trim() || !body.trim()) return;
    await api(
      `/dashboard/projects/${projectId}/changelog?projectId=${projectId}`,
      { ...credentials, method: "POST", body: JSON.stringify({ title, body }) },
    );
    setTitle("");
    setBody("");
    onChange();
  };
  return (
    <>
      <PageHeader
        eyebrow="Keep users in the loop"
        title="Changelog"
        description="Share shipped work and close the feedback loop with your users."
        action={
          <button className="primary-button" onClick={add}>
            ＋ <span>New update</span>
          </button>
        }
      />
      <section className="panel composer">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Update title…"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What changed?"
        />
        <button className="primary-button" onClick={add}>
          Publish update
        </button>
      </section>
      <section className="timeline">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <strong>No updates published yet</strong>
            <p>Your changelog will appear here.</p>
          </div>
        ) : (
          items.map((item) => (
            <article className="timeline-item" key={item.id}>
              <div className="timeline-marker" />
              <div className="panel">
                <div className="timeline-meta">
                  <span className="status-pill resolved">Published</span>
                  <time>
                    {item.publishedAt ? formatDate(item.publishedAt) : "Draft"}
                  </time>
                </div>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <FeedbackLinks
                  kind="changelog"
                  itemId={item.id ?? ""}
                  projectId={projectId}
                  credentials={credentials}
                  feedback={feedback}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}

function WidgetBuilder({
  settings,
  categories,
  projectId,
  publicKey,
  credentials,
  onSettings,
  onCategories,
  onNotice,
}: {
  settings: Settings | null;
  categories: Category[];
  projectId: string;
  publicKey: string;
  credentials: ApiOptions;
  onSettings: (value: Settings) => void;
  onCategories: (value: Category[]) => void;
  onNotice: (value: { text: string; error?: boolean }) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  const theme = (draft?.theme ?? {}) as Record<string, unknown>;
  const value = (key: string, fallback: string) =>
    typeof theme[key] === "string" ? String(theme[key]) : fallback;
  const mode = value("mode", "floating");
  const fields = Array.isArray(theme.fields)
    ? theme.fields.filter((field): field is string => typeof field === "string")
    : ["type", "title", "description", "email"];
  const updateTheme = (key: string, next: unknown) =>
    setDraft(
      draft ? { ...draft, theme: { ...draft.theme, [key]: next } } : draft,
    );
  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api<Settings>(
        `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
        { ...credentials, method: "PATCH", body: JSON.stringify(draft) },
      );
      onSettings(updated);
      onNotice({ text: "Widget configuration saved" });
    } catch (error) {
      onNotice({
        text:
          error instanceof Error
            ? error.message
            : "Unable to save widget configuration",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const addCategory = async () => {
    if (categoryName.trim().length < 2) return;
    try {
      const created = await api<Category>(
        `/dashboard/projects/${projectId}/categories`,
        {
          ...credentials,
          method: "POST",
          body: JSON.stringify({ name: categoryName.trim() }),
        },
      );
      onCategories(
        [...categories, created].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setCategoryName("");
      onNotice({ text: "Category added" });
    } catch (error) {
      onNotice({
        text: error instanceof Error ? error.message : "Unable to add category",
        error: true,
      });
    }
  };
  const removeCategory = async (category: Category) => {
    if (
      !window.confirm(
        `Delete the ${category.name} category? Existing feedback will keep its other data.`,
      )
    )
      return;
    try {
      await api(
        `/dashboard/projects/${projectId}/categories/${encodeURIComponent(category.id)}`,
        { ...credentials, method: "DELETE" },
      );
      onCategories(categories.filter((item) => item.id !== category.id));
      onNotice({ text: "Category deleted" });
    } catch (error) {
      onNotice({
        text:
          error instanceof Error ? error.message : "Unable to delete category",
        error: true,
      });
    }
  };
  const snippet = `import { NitroPing } from "@nitroping/web";\n\nNitroPing.init({\n  projectKey: "${publicKey}",\n  mode: "${mode}",\n  theme: "system",\n  colors: { primary: "${value("primary", "#7C3AED")}" },\n  fields: ${JSON.stringify(fields)},${categories.length ? `\n  categoryOptions: ${JSON.stringify(categories.map((category) => ({ id: category.id, name: category.name })))},` : ""}\n});`;
  const copy = async () => {
    await navigator.clipboard?.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <>
      <PageHeader
        eyebrow="Activation"
        title="Widget builder"
        description="Shape the feedback experience, preview it, and copy the exact Web SDK setup."
        action={
          <button
            className="primary-button"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save widget"}
          </button>
        }
      />
      <div className="widget-builder-grid">
        <section className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Appearance & behavior</h2>
              <p>
                These settings are stored with the project and can be mirrored
                in any SDK.
              </p>
            </div>
          </div>
          <label className="form-field">
            <span>Display mode</span>
            <select
              value={mode}
              onChange={(event) => updateTheme("mode", event.target.value)}
            >
              <option value="floating">Floating button</option>
              <option value="modal">Modal</option>
              <option value="side-panel">Side panel</option>
              <option value="inline">Inline form</option>
              <option value="portal">Full-page portal</option>
              <option value="headless">Headless</option>
            </select>
          </label>
          <div className="color-fields">
            <label className="form-field">
              <span>Primary color</span>
              <input
                type="color"
                value={value("primary", "#7C3AED")}
                onChange={(event) => updateTheme("primary", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Background</span>
              <input
                type="color"
                value={value("background", "#FFFFFF")}
                onChange={(event) =>
                  updateTheme("background", event.target.value)
                }
              />
            </label>
            <label className="form-field">
              <span>Text color</span>
              <input
                type="color"
                value={value("text", "#181221")}
                onChange={(event) => updateTheme("text", event.target.value)}
              />
            </label>
          </div>
          <label className="form-field">
            <span>Button label</span>
            <input
              value={value("buttonLabel", "Give feedback")}
              onChange={(event) =>
                updateTheme("buttonLabel", event.target.value)
              }
              maxLength={40}
            />
          </label>
          <div className="field-picker">
            <span>Form fields</span>
            {[
              "type",
              "category",
              "title",
              "description",
              "attachment",
              "email",
            ].map((field) => (
              <label key={field}>
                <input
                  type="checkbox"
                  checked={fields.includes(field)}
                  onChange={(event) =>
                    updateTheme(
                      "fields",
                      event.target.checked
                        ? [...fields, field]
                        : fields.filter((entry) => entry !== field),
                    )
                  }
                />
                {statusLabel(field)}
              </label>
            ))}
          </div>
        </section>
        <section className="panel widget-preview-card">
          <div className="panel-heading">
            <div>
              <h2>Live preview</h2>
              <p>A lightweight preview of the configured surface.</p>
            </div>
            <span className="period-pill">{mode}</span>
          </div>
          <div
            className="widget-preview"
            style={{
              background: value("background", "#FFFFFF"),
              color: value("text", "#181221"),
            }}
          >
            <div className="preview-top">
              <span
                className="preview-mark"
                style={{ background: value("primary", "#7C3AED") }}
              >
                N
              </span>
              <div>
                <strong>Your feedback</strong>
                <small>Help us make this product better.</small>
              </div>
            </div>
            <div className="preview-input">Tell us what happened…</div>
            <div className="preview-input">Describe your feedback…</div>
            <button style={{ background: value("primary", "#7C3AED") }}>
              {value("buttonLabel", "Give feedback")}
            </button>
          </div>
        </section>
      </div>
      <div className="widget-lower-grid">
        <section className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Public categories</h2>
              <p>
                Categories can be passed as category IDs by the Web, iOS, and
                Android clients.
              </p>
            </div>
          </div>
          <div className="developer-form">
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="e.g. Payments"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void addCategory();
                }
              }}
            />
            <button
              className="primary-button"
              onClick={() => void addCategory()}
              disabled={categoryName.trim().length < 2}
            >
              Add category
            </button>
          </div>
          <div className="category-list">
            {categories.length === 0 ? (
              <p className="muted">
                No custom categories yet. The built-in feedback types remain
                available.
              </p>
            ) : (
              categories.map((category) => (
                <div className="category-row" key={category.id}>
                  <span className="category-dot" />
                  <div>
                    <strong>{category.name}</strong>
                    <small>{category.slug}</small>
                  </div>
                  <button
                    className="text-danger"
                    type="button"
                    onClick={() => void removeCategory(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="panel settings-card snippet-card">
          <div className="panel-heading">
            <div>
              <h2>Install snippet</h2>
              <p>Give this to your developer or use it as a starting point.</p>
            </div>
            <button className="secondary-button" onClick={() => void copy()}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre>
            <code>{snippet}</code>
          </pre>
        </section>
      </div>
    </>
  );
}

function PrivacyPanel({
  feedback,
  settings,
  projectId,
  credentials,
  onRefresh,
}: {
  feedback: Feedback[];
  settings: Settings | null;
  projectId: string;
  credentials: ApiOptions;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const exportData = async () => {
    setBusy(true);
    setNotice("");
    try {
      const headers = new Headers();
      if (credentials.projectKey)
        headers.set("x-nitroping-project-key", credentials.projectKey);
      if (credentials.serverKey)
        headers.set("x-nitroping-server-key", credentials.serverKey);
      const response = await fetch(
        `/api/v1/dashboard/projects/${encodeURIComponent(projectId)}/export`,
        { credentials: "include", headers },
      );
      if (!response.ok)
        throw new Error("The data export could not be created.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nitroping-${projectId}-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Your export download has started.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The data export failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  const anonymize = async (item: Feedback) => {
    if (
      !window.confirm(
        `Anonymize “${item.title}”? This removes the author email, body, metadata, comments, and attachments.`,
      )
    )
      return;
    setBusy(true);
    setNotice("");
    try {
      await api(
        `/dashboard/projects/${encodeURIComponent(projectId)}/feedback/${encodeURIComponent(item.id)}/anonymize`,
        { ...credentials, method: "POST" },
      );
      setNotice("Feedback anonymized.");
      await onRefresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The feedback could not be anonymized.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Privacy & compliance"
        title="Privacy & data"
        description="Export project data, review retention, and remove personal feedback data safely."
        action={
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void exportData()}
          >
            {busy ? "Working…" : "Download project export"}
          </button>
        }
      />
      {notice && <div className="privacy-notice">{notice}</div>}
      <section className="settings-grid">
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Retention policy</h2>
              <p>Automatic cleanup follows the project policy.</p>
            </div>
          </div>
          <div className="usage-number">
            <strong>{settings?.retentionDays ?? 365}</strong>
            <span>days</span>
          </div>
          <p className="muted">
            Feedback older than this period is anonymized and attachments are
            queued for physical deletion.
          </p>
        </div>
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Data export</h2>
              <p>
                Download feedback, comments, and attachment metadata in JSON.
              </p>
            </div>
          </div>
          <button
            className="secondary-button full-button"
            disabled={busy}
            onClick={() => void exportData()}
          >
            Download export
          </button>
        </div>
      </section>
      <section className="panel settings-card privacy-feedback">
        <div className="panel-heading">
          <div>
            <h2>Feedback anonymization</h2>
            <p>
              Use this for a verified deletion request or data minimization
              workflow.
            </p>
          </div>
        </div>
        {feedback.length === 0 ? (
          <div className="empty-state">
            <strong>No feedback to anonymize</strong>
          </div>
        ) : (
          feedback.slice(0, 50).map((item) => (
            <div className="privacy-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.email ?? "Anonymous"} · {formatDate(item.createdAt)}
                </small>
              </div>
              <button
                className="text-danger"
                disabled={busy || item.body === "[anonymized]"}
                onClick={() => void anonymize(item)}
              >
                {item.body === "[anonymized]" ? "Anonymized" : "Anonymize"}
              </button>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function SettingsPanel({
  settings,
  projectId,
  publicKey,
  serverKey,
  onProject,
  onPublic,
  onServer,
  onSave,
  onSettings,
}: {
  settings: Settings | null;
  projectId: string;
  publicKey: string;
  serverKey: string;
  onProject: (value: string) => void;
  onPublic: (value: string) => void;
  onServer: (value: string) => void;
  onSave: () => void;
  onSettings: (value: Settings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  const save = async () => {
    if (!draft) return;
    const updated = await api<Settings>(
      `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
      {
        projectKey: publicKey,
        serverKey,
        method: "PATCH",
        body: JSON.stringify(draft),
      },
    );
    onSettings(updated);
    onSave();
  };
  return (
    <>
      <PageHeader
        eyebrow="Control room"
        title="Project settings"
        description="Configure how NitroPing fits into your product and team."
        action={
          <button className="primary-button" onClick={save}>
            Save changes
          </button>
        }
      />
      <section className="settings-grid">
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Connection</h2>
              <p>Keys used by the dashboard and SDKs.</p>
            </div>
          </div>
          <label className="form-field">
            <span>Project ID</span>
            <input value={projectId} readOnly aria-readonly="true" />
          </label>
          <label className="form-field">
            <span>Public project key</span>
            <input
              value={publicKey}
              onChange={(event) => onPublic(event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>
              Server key <em>development only</em>
            </span>
            <input
              type="password"
              value={serverKey}
              onChange={(event) => onServer(event.target.value)}
              placeholder="Required for dashboard API calls"
            />
          </label>
          <button className="secondary-button full-button" onClick={onSave}>
            Apply connection
          </button>
        </div>
        <div className="panel settings-card">
          <div className="panel-heading">
            <div>
              <h2>Privacy & data</h2>
              <p>Keep control of retention and custom context.</p>
            </div>
          </div>
          <label className="form-field">
            <span>
              Retention period <em>days</em>
            </span>
            <input
              type="number"
              min="1"
              max="3650"
              value={draft?.retentionDays ?? 365}
              onChange={(event) =>
                setDraft(
                  draft
                    ? { ...draft, retentionDays: Number(event.target.value) }
                    : draft,
                )
              }
            />
          </label>
          <label className="form-field">
            <span>
              Allowed metadata fields <em>comma separated</em>
            </span>
            <input
              value={draft?.allowedMetadata.join(", ") ?? ""}
              onChange={(event) =>
                setDraft(
                  draft
                    ? {
                        ...draft,
                        allowedMetadata: event.target.value
                          .split(/,\s*/)
                          .map((part) => part.trim())
                          .filter(Boolean),
                      }
                    : draft,
                )
              }
              placeholder="appVersion, account.plan"
            />
          </label>
          <label className="form-field">
            <span>Allowed widget origins</span>
            <input
              value={draft?.origins.join(", ") ?? ""}
              onChange={(event) =>
                setDraft(
                  draft
                    ? {
                        ...draft,
                        origins: event.target.value
                          .split(", ")
                          .map((part) => part.trim())
                          .filter(Boolean),
                      }
                    : draft,
                )
              }
              placeholder="https://app.example.com"
            />
          </label>
        </div>
      </section>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
