import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import "./styles.css";

type View = "inbox" | "insights" | "moderation" | "roadmap" | "changelog" | "audit" | "developer" | "team" | "notifications" | "settings";
type ApiOptions = RequestInit & { projectKey?: string; serverKey?: string };
type FeedbackDetail = { feedback: Feedback; comments: Array<{ id: string; body: string; isInternal: number; createdAt: string }>; statusHistory: Array<{ id: string; fromStatus: string | null; toStatus: string; createdAt: string }>; tags?: Array<{ id: string; name: string; slug: string }> };
type Analytics = { total: number; statuses: Array<{ status: string; count: number }>; platforms: Array<{ platform: string; count: number }>; types: Array<{ type: string; count: number }>; volume: Array<{ date: string; count: number }>; averageResponseMinutes: number | null; averageResolutionMinutes: number | null };
type Usage = { plan: string; period: string; feedbackCount: number; feedbackLimit: number; attachmentBytes: number };
type Settings = { theme: Record<string, unknown>; allowedMetadata: string[]; retentionDays: number; origins: string[] };
type Organization = { id: string; name: string; slug: string; role: string };
type Project = { id: string; organizationId: string; name: string; slug: string; publicKey: string };
type ModerationItem = Feedback & { feedbackId: string; kind: string; outcome: string; createdAt: string };
type AuditItem = { id: string; action: string; entityType: string; entityId: string; actorUserId: string | null; metadata: Record<string, unknown>; createdAt: string };
type ApiKeyItem = { id: string; kind: string; label: string; keyPrefix: string; createdAt: string; revokedAt: string | null };
type WebhookItem = { id: string; url: string; events: string[]; active: number; createdAt: string };
type MemberItem = { userId: string; email: string; role: string; createdAt: string };
type NotificationPreference = { eventType: string; enabled: boolean };

const apiBase = "/api/v1";
const statuses: FeedbackStatus[] = ["new", "triaged", "planned", "in_progress", "resolved", "closed", "spam"];
const statusLabel = (value: string) => value.replaceAll("_", " ");
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const initials = (value: string) => value.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { projectKey, serverKey, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (projectKey) requestHeaders.set("x-nitroping-project-key", projectKey);
  if (serverKey) requestHeaders.set("x-nitroping-server-key", serverKey);
  if (init.body && !requestHeaders.has("content-type")) requestHeaders.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, credentials: "include", headers: requestHeaders });
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message ?? `Request failed (${response.status})`);
  return data;
}

function App() {
  const [view, setView] = useState<View>("inbox");
  const [projectId, setProjectId] = useState(() => localStorage.getItem("np.project") ?? "");
  const [publicKey, setPublicKey] = useState(() => localStorage.getItem("np.public") ?? "");
  const [serverKey, setServerKey] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selected, setSelected] = useState<FeedbackDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [roadmap, setRoadmap] = useState<Array<Record<string, string>>>([]);
  const [changelog, setChangelog] = useState<Array<Record<string, string | null>>>([]);
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  const credentials = { projectKey: publicKey || undefined, serverKey: serverKey || undefined };
  const filteredFeedback = useMemo(() => feedback.filter((item) => (filter === "all" || item.status === filter) && `${item.title} ${item.body} ${item.type}`.toLowerCase().includes(query.toLowerCase())), [feedback, filter, query]);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const feedbackQuery = new URLSearchParams({ limit: "50" });
      if (query.trim()) feedbackQuery.set("q", query.trim());
      if (filter !== "all") feedbackQuery.set("status", filter);
      const [list, insight, currentUsage] = await Promise.all([
        api<{ items: Feedback[] }>(`/dashboard/projects/${encodeURIComponent(projectId)}/feedback?projectId=${encodeURIComponent(projectId)}&${feedbackQuery}`, credentials),
        api<Analytics>(`/dashboard/projects/${encodeURIComponent(projectId)}/analytics?projectId=${encodeURIComponent(projectId)}`, credentials),
        api<Usage>(`/dashboard/projects/${encodeURIComponent(projectId)}/usage?projectId=${encodeURIComponent(projectId)}`, credentials),
      ]);
      setFeedback(list.items); setAnalytics(insight); setUsage(currentUsage); setNotice({ text: "Workspace refreshed" });
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : "Unable to load workspace", error: true }); }
    finally { setLoading(false); }
  };

  const loadWorkspace = async () => {
    try {
      const [organizationResult, projectResult] = await Promise.all([
        api<{ items: Organization[] }>("/dashboard/organizations"),
        api<{ items: Project[] }>("/dashboard/projects"),
      ]);
      setOrganizations(organizationResult.items);
      setProjects(projectResult.items);
      if (organizationResult.items[0]) {
        try {
          const memberResult = await api<{ items: MemberItem[] }>(`/dashboard/organizations/${organizationResult.items[0].id}/members`);
          setMembers(memberResult.items);
        } catch {
          setMembers([]);
        }
      }
      const selectedProject = projectResult.items.find((item) => item.id === projectId) ?? projectResult.items[0];
      if (selectedProject) {
        setProjectId(selectedProject.id);
        setPublicKey(selectedProject.publicKey);
        localStorage.setItem("np.project", selectedProject.id);
        localStorage.setItem("np.public", selectedProject.publicKey);
      }
      setWorkspaceReady(true);
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Unable to load your workspace", error: true });
      setWorkspaceReady(true);
    }
  };

  const createWorkspace = async (organizationName: string, projectName: string) => {
    setSetupLoading(true);
    try {
      const organization = organizations[0] ?? await api<Organization>("/dashboard/organizations", { method: "POST", body: JSON.stringify({ name: organizationName }) });
      if (!organizations.length) setOrganizations([organization]);
      const project = await api<Project & { serverKey?: string }>(`/dashboard/organizations/${organization.id}/projects`, { method: "POST", body: JSON.stringify({ name: projectName }) });
      setProjects([project]);
      setProjectId(project.id); setPublicKey(project.publicKey);
      localStorage.setItem("np.project", project.id); localStorage.setItem("np.public", project.publicKey);
      setNotice({ text: "Your workspace is ready" });
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : "Workspace setup failed", error: true }); }
    finally { setSetupLoading(false); }
  };

  const loadView = async (nextView: View) => {
    setView(nextView);
    try {
      if (nextView === "roadmap") setRoadmap((await api<{ items: Array<Record<string, string>> }>(`/dashboard/projects/${projectId}/roadmap?projectId=${projectId}`, credentials)).items);
      if (nextView === "changelog") setChangelog((await api<{ items: Array<Record<string, string | null>> }>(`/dashboard/projects/${projectId}/changelog?projectId=${projectId}`, credentials)).items);
      if (nextView === "moderation") setModeration((await api<{ items: ModerationItem[] }>(`/dashboard/projects/${projectId}/moderation`, credentials)).items);
      if (nextView === "audit") setAuditLogs((await api<{ items: AuditItem[] }>(`/dashboard/projects/${projectId}/audit-logs`, credentials)).items);
      if (nextView === "developer") {
        const [keys, hooks] = await Promise.all([
          api<{ items: ApiKeyItem[] }>(`/dashboard/projects/${projectId}/api-keys`, credentials),
          api<{ items: WebhookItem[] }>(`/dashboard/projects/${projectId}/webhooks`, credentials),
        ]);
        setApiKeys(keys.items); setWebhooks(hooks.items);
      }
      if (nextView === "team") setMembers((await api<{ items: MemberItem[] }>(`/dashboard/organizations/${organizations[0]?.id}/members`, credentials)).items);
      if (nextView === "notifications") setNotifications((await api<{ items: NotificationPreference[] }>(`/dashboard/projects/${projectId}/notifications`, credentials)).items);
      if (nextView === "settings") setSettings(await api<Settings>(`/dashboard/projects/${projectId}/settings?projectId=${projectId}`, credentials));
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : "Unable to load view", error: true }); }
  };

  useEffect(() => { void loadWorkspace(); }, []);
  useEffect(() => { if (workspaceReady && projectId) void loadInbox(); }, [workspaceReady, projectId, query, filter]);

  const openFeedback = async (item: Feedback) => {
    try { setSelected(await api<FeedbackDetail>(`/dashboard/feedback/${item.id}?projectId=${projectId}`, credentials)); }
    catch (error) { setNotice({ text: error instanceof Error ? error.message : "Unable to open feedback", error: true }); }
  };

  const changeStatus = async (item: Feedback, status: FeedbackStatus) => {
    try {
      const updated = await api<Feedback>(`/dashboard/feedback/${item.id}/status?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ status }) });
      setFeedback((items) => items.map((entry) => entry.id === item.id ? updated : entry));
      if (selected?.feedback.id === item.id) setSelected({ ...selected, feedback: updated });
      setNotice({ text: "Status updated" });
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : "Status update failed", error: true }); }
  };

  const saveWorkspace = () => { localStorage.setItem("np.project", projectId); localStorage.setItem("np.public", publicKey); void loadInbox(); };

  if (!workspaceReady) return <div className="setup-shell"><div className="setup-card"><span className="brand-mark">N</span><h1>Loading your workspace</h1><p>Connecting to NitroPing securely…</p><div className="loader" /></div></div>;
  if (!projectId) return <WorkspaceSetup organizations={organizations} loading={setupLoading} onCreate={createWorkspace} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">N</span><span>Nitro<strong>Ping</strong></span></div>
      <div className="workspace-switcher"><span className="workspace-icon">{(organizations[0]?.name ?? "N")[0]}</span><div><small>Workspace</small><strong>{organizations[0]?.name ?? "NitroPing"}</strong></div><span className="chevron">⌄</span></div>
      <nav className="nav" aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        <NavItem active={view === "inbox"} icon="◈" label="Inbox" count={feedback.filter((item) => item.status === "new").length} onClick={() => loadView("inbox")} />
        <NavItem active={view === "insights"} icon="◒" label="Insights" onClick={() => loadView("insights")} />
        <NavItem active={view === "moderation"} icon="◇" label="Moderation" onClick={() => loadView("moderation")} />
        <p className="nav-label section-label">Product</p>
        <NavItem active={view === "roadmap"} icon="↗" label="Roadmap" onClick={() => loadView("roadmap")} />
        <NavItem active={view === "changelog"} icon="✦" label="Changelog" onClick={() => loadView("changelog")} />
        <NavItem active={view === "audit"} icon="▤" label="Audit log" onClick={() => loadView("audit")} />
        <NavItem active={view === "developer"} icon="⌘" label="Developer" onClick={() => loadView("developer")} />
        <NavItem active={view === "team"} icon="◎" label="Team" onClick={() => loadView("team")} />
        <NavItem active={view === "notifications"} icon="♢" label="Notifications" onClick={() => loadView("notifications")} />
        <p className="nav-label section-label">Manage</p>
        <NavItem active={view === "settings"} icon="⚙" label="Project settings" onClick={() => loadView("settings")} />
      </nav>
      <div className="sidebar-bottom"><div className="plan-card"><div className="plan-row"><span>{usage?.plan ?? "Free"} plan</span><span>{usage ? `${usage.feedbackCount}/${usage.feedbackLimit}` : "—"}</span></div><div className="progress"><span style={{ width: `${Math.min(100, ((usage?.feedbackCount ?? 0) / (usage?.feedbackLimit || 1)) * 100)}%` }} /></div><button onClick={async () => { try { const checkout = await api<{ url: string | null }>(`/dashboard/billing/checkout?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ plan: "pro" }) }); if (checkout.url) location.assign(checkout.url); else setNotice({ text: "Billing checkout is unavailable." }); } catch (error) { setNotice({ text: error instanceof Error ? error.message : "Unable to open billing", error: true }); } }}>Upgrade plan <span>→</span></button></div><div className="user-row"><span className="avatar">{initials("Alex Morgan")}</span><div><strong>Alex Morgan</strong><small>Owner</small></div><span className="more">•••</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">N</span>Nitro<strong>Ping</strong></div><div className="breadcrumbs"><span>{organizations[0]?.name ?? "Workspace"}</span><b>/</b><strong>{view === "inbox" ? "Inbox" : view[0].toUpperCase() + view.slice(1)}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button" aria-label="Notifications">♢<i /></button><button className="help-button">? <span>Help center</span></button></div></header>
      <div className="content-wrap">
        {notice && <div className={`toast ${notice.error ? "toast-error" : ""}`} role="status">{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
        {view === "inbox" && <Inbox feedback={filteredFeedback} allFeedback={feedback} selected={selected} members={members} filter={filter} query={query} loading={loading} onFilter={setFilter} onQuery={setQuery} onOpen={openFeedback} onStatus={changeStatus} onClose={() => setSelected(null)} onAssign={async (id, assigneeUserId) => { const updated = await api<Feedback>(`/dashboard/feedback/${id}/assign?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ assigneeUserId }) }); setFeedback((items) => items.map((entry) => entry.id === id ? updated : entry)); setSelected((current) => current?.feedback.id === id ? { ...current, feedback: updated } : current); setNotice({ text: assigneeUserId ? "Feedback assigned" : "Assignment cleared" }); }} onMerge={async (id, targetFeedbackId) => { await api(`/dashboard/feedback/${id}/merge?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ targetFeedbackId }) }); setSelected(null); await loadInbox(); setNotice({ text: "Feedback merged" }); }} onReply={async (id, body, internal) => { await api(`/dashboard/feedback/${id}/reply?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ body, internal }) }); const item = feedback.find((entry) => entry.id === id); if (item) await openFeedback(item); setNotice({ text: internal ? "Internal note added" : "Reply sent" }); }} onRefresh={loadInbox} />}
        {view === "insights" && <Insights analytics={analytics} usage={usage} onRefresh={loadInbox} />}
        {view === "moderation" && <Moderation items={moderation} credentials={credentials} projectId={projectId} onChange={() => void loadView("moderation")} />}
        {view === "audit" && <AuditLog items={auditLogs} onRefresh={() => void loadView("audit")} />}
        {view === "developer" && <DeveloperControls projectId={projectId} credentials={credentials} apiKeys={apiKeys} webhooks={webhooks} onRefresh={() => void loadView("developer")} />}
        {view === "team" && <Team members={members} organizationId={organizations[0]?.id ?? ""} credentials={credentials} onRefresh={() => void loadView("team")} />}
        {view === "notifications" && <Notifications items={notifications} credentials={credentials} projectId={projectId} onChange={setNotifications} />}
        {view === "roadmap" && <Roadmap items={roadmap} credentials={credentials} projectId={projectId} onChange={() => void loadView("roadmap")} />}
        {view === "changelog" && <Changelog items={changelog} credentials={credentials} projectId={projectId} onChange={() => void loadView("changelog")} />}
        {view === "settings" && <SettingsPanel settings={settings} projectId={projectId} publicKey={publicKey} serverKey={serverKey} onProject={setProjectId} onPublic={setPublicKey} onServer={setServerKey} onSave={saveWorkspace} onSettings={setSettings} />}
      </div>
    </main>
  </div>;
}

function WorkspaceSetup({ organizations, loading, onCreate }: { organizations: Organization[]; loading: boolean; onCreate: (organizationName: string, projectName: string) => Promise<void> }) {
  const [organizationName, setOrganizationName] = useState(organizations[0]?.name ?? "");
  const [projectName, setProjectName] = useState("");
  const existingOrganization = organizations[0];
  return <div className="setup-shell"><div className="setup-card setup-card-wide"><div className="setup-brand"><span className="brand-mark">N</span><span>Nitro<strong>Ping</strong></span></div><p className="eyebrow">First steps</p><h1>{existingOrganization ? "Create your first project" : "Create your workspace"}</h1><p className="setup-copy">Connect your product to NitroPing and start turning user feedback into product momentum.</p><div className="setup-fields">{!existingOrganization && <label className="form-field"><span>Organization name</span><input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Acme Studio" autoFocus /></label>}<label className="form-field"><span>Project name</span><input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Web app" autoFocus={Boolean(existingOrganization)} /></label></div><button className="primary-button setup-submit" disabled={loading || !projectName.trim() || (!existingOrganization && !organizationName.trim())} onClick={() => onCreate(organizationName.trim(), projectName.trim())}>{loading ? "Setting up…" : "Create project →"}</button><small className="setup-note">You can add more projects and team members later.</small></div></div>;
}

function NavItem({ active, icon, label, count, onClick }: { active: boolean; icon: string; label: string; count?: number; onClick: () => void }) { return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><span className="nav-icon">{icon}</span>{label}{count ? <span className="nav-count">{count}</span> : null}</button>; }

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) { return <div className="page-header"><div><p className="eyebrow">{eyebrow ?? "Workspace"}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>; }

function Inbox({ feedback, allFeedback, selected, members, filter, query, loading, onFilter, onQuery, onOpen, onStatus, onClose, onAssign, onMerge, onReply, onRefresh }: { feedback: Feedback[]; allFeedback: Feedback[]; selected: FeedbackDetail | null; members: MemberItem[]; filter: string; query: string; loading: boolean; onFilter: (value: string) => void; onQuery: (value: string) => void; onOpen: (item: Feedback) => void; onStatus: (item: Feedback, status: FeedbackStatus) => void; onClose: () => void; onAssign: (id: string, assigneeUserId: string | null) => Promise<void>; onMerge: (id: string, targetFeedbackId: string) => Promise<void>; onReply: (id: string, body: string, internal: boolean) => Promise<void>; onRefresh: () => void }) {
  return <><PageHeader eyebrow="Feedback workspace" title="Good morning, Alex" description="Review what your users are saying and keep the product moving." action={<button className="primary-button" onClick={onRefresh}>↻ <span>Refresh inbox</span></button>} /><div className="metric-row"><Metric label="Total feedback" value={allFeedback.length} detail="All time" accent="purple" /><Metric label="Needs triage" value={allFeedback.filter((item) => item.status === "new").length} detail="New submissions" accent="orange" /><Metric label="In progress" value={allFeedback.filter((item) => item.status === "in_progress").length} detail="Being worked on" accent="blue" /><Metric label="Resolved" value={allFeedback.filter((item) => item.status === "resolved").length} detail="Closed the loop" accent="green" /></div><section className="panel inbox-panel"><div className="panel-toolbar"><div className="tabs">{[["all", "All feedback"], ["new", "Needs triage"], ["in_progress", "In progress"], ["resolved", "Resolved"]].map(([value, label]) => <button key={value} className={filter === value ? "selected" : ""} onClick={() => onFilter(value)}>{label}<span>{value === "all" ? allFeedback.length : allFeedback.filter((item) => item.status === value).length}</span></button>)}</div><div className="toolbar-actions"><label className="search"><span>⌕</span><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search feedback" /></label><button className="filter-button">☷ <span>Filter</span></button></div></div><div className="inbox-layout"><div className="feedback-list">{loading ? <div className="empty-state"><div className="loader" />Loading feedback…</div> : feedback.length === 0 ? <div className="empty-state"><div className="empty-icon">✦</div><strong>No feedback here yet</strong><p>New user feedback will appear in this view.</p></div> : feedback.map((item) => <FeedbackRow key={item.id} item={item} selected={selected?.feedback.id === item.id} onOpen={() => onOpen(item)} onStatus={(status) => onStatus(item, status)} />)}</div>{selected ? <FeedbackDetailPanel detail={selected} members={members} onClose={onClose} onAssign={onAssign} onMerge={onMerge} onReply={onReply} onStatus={(status) => onStatus(selected.feedback, status)} /> : <div className="detail-placeholder"><div className="placeholder-art"><span>◈</span><span>✦</span><span>○</span></div><strong>Select feedback to inspect it</strong><p>Replies, notes, status history, and context will appear here.</p></div>}</div></section></>;
}

function Metric({ label, value, detail, accent }: { label: string; value: number; detail: string; accent: string }) { return <div className="metric-card"><div className={`metric-icon ${accent}`}>✦</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><span className="metric-trend">↗</span></div>; }

function FeedbackRow({ item, selected, onOpen, onStatus }: { item: Feedback; selected: boolean; onOpen: () => void; onStatus: (status: FeedbackStatus) => void }) { return <article className={`feedback-row ${selected ? "selected" : ""}`} onClick={onOpen}><span className={`type-dot ${item.type}`} /> <div className="feedback-main"><div className="feedback-title-row"><h3>{item.title}</h3><time>{formatDate(item.createdAt)}</time></div><p>{item.body}</p><div className="feedback-meta"><span className={`status-pill ${item.status}`}>{statusLabel(item.status)}</span><span className="type-label">{statusLabel(item.type)}</span>{item.platform && <span className="type-label">{item.platform}</span>}</div></div><select value={item.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onStatus(event.target.value as FeedbackStatus)} aria-label="Change status">{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></article>; }

function FeedbackDetailPanel({ detail, members, onClose, onAssign, onMerge, onReply, onStatus }: { detail: FeedbackDetail; members: MemberItem[]; onClose: () => void; onAssign: (id: string, assigneeUserId: string | null) => Promise<void>; onMerge: (id: string, targetFeedbackId: string) => Promise<void>; onReply: (id: string, body: string, internal: boolean) => Promise<void>; onStatus: (status: FeedbackStatus) => void }) { const [reply, setReply] = useState(""); const [internal, setInternal] = useState(false); const [mergeTarget, setMergeTarget] = useState(""); const item = detail.feedback; return <aside className="detail-panel"><div className="detail-head"><div><span className={`status-pill ${item.status}`}>{statusLabel(item.status)}</span><span className="detail-date">{formatDate(item.createdAt)}</span></div><button className="close-button" onClick={onClose}>×</button></div><h2>{item.title}</h2><div className="detail-tags"><span>{statusLabel(item.type)}</span><span>{item.platform ?? "Unknown platform"}</span><span>{item.priority} priority</span>{detail.tags?.map((tag) => <span key={tag.id}>{tag.name}</span>)}</div><p className="detail-body">{item.body}</p>{item.email && <div className="user-card"><span className="avatar purple-avatar">{item.email[0].toUpperCase()}</span><div><strong>{item.email}</strong><small>Feedback author</small></div></div>}<div className="detail-controls"><label>Assignee<select value={item.assignedUserId ?? ""} onChange={(event) => void onAssign(item.id, event.target.value || null)}><option value="">Unassigned</option>{members.filter((member) => member.role !== "viewer").map((member) => <option key={member.userId} value={member.userId}>{member.email}</option>)}</select></label><label>Merge duplicate<div className="merge-control"><input value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} placeholder="Feedback ID" /><button className="secondary-button" disabled={!mergeTarget.trim()} onClick={async () => { await onMerge(item.id, mergeTarget.trim()); setMergeTarget(""); }}>Merge</button></div></label></div><div className="detail-section"><div className="section-heading"><strong>Activity</strong><span>{detail.comments.length + detail.statusHistory.length} events</span></div>{detail.statusHistory.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot status-dot" /><div><p>Status changed to <strong>{statusLabel(event.toStatus)}</strong></p><small>{formatDate(event.createdAt)}</small></div></div>)}{detail.comments.map((comment) => <div className="activity-item" key={comment.id}><span className={`activity-dot ${comment.isInternal ? "note-dot" : "reply-dot"}`} /><div><p>{comment.isInternal ? "Internal note" : "Reply"}: {comment.body}</p><small>{formatDate(comment.createdAt)}</small></div></div>)}</div><div className="reply-box"><div className="reply-mode"><button className={!internal ? "active" : ""} onClick={() => setInternal(false)}>Reply to user</button><button className={internal ? "active note-mode" : ""} onClick={() => setInternal(true)}>Internal note</button></div><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={internal ? "Leave a note for your team…" : "Write a thoughtful reply…"} /><div className="reply-footer"><span>⌘ ↵ to send</span><button className={`primary-button ${internal ? "note-button" : ""}`} disabled={!reply.trim()} onClick={async () => { await onReply(item.id, reply.trim(), internal); setReply(""); }}>Send {internal ? "note" : "reply"}</button></div></div><div className="detail-status"><label>Status<select value={item.status} onChange={(event) => onStatus(event.target.value as FeedbackStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label></div></aside>; }

function Moderation({ items, credentials, projectId, onChange }: { items: ModerationItem[]; credentials: ApiOptions; projectId: string; onChange: () => void }) {
  const decide = async (feedbackId: string, outcome: "approved" | "rejected" | "spam") => { try { await api(`/dashboard/projects/${projectId}/moderation`, { ...credentials, method: "POST", body: JSON.stringify({ feedbackId, outcome }) }); onChange(); } catch { /* parent view will refresh on the next action */ } };
  return <><PageHeader eyebrow="Trust & safety" title="Moderation queue" description="Review automated flags before they affect your public feedback stream." action={<button className="secondary-button" onClick={onChange}>↻ Refresh queue</button>} /><section className="panel moderation-panel">{items.length === 0 ? <div className="empty-state"><div className="empty-icon">✓</div><strong>Queue is clear</strong><p>New automated moderation events will appear here.</p></div> : items.map((item) => <article className="moderation-row" key={item.feedbackId}><div className="moderation-copy"><div className="feedback-meta"><span className={`status-pill ${item.type}`}>{statusLabel(item.type)}</span><span className="type-label">{formatDate(item.createdAt)}</span></div><h2>{item.title}</h2><p>{item.body}</p>{item.email && <small>{item.email}</small>}</div><div className="moderation-actions"><button className="secondary-button" onClick={() => decide(item.feedbackId, "approved")}>Approve</button><button className="secondary-button" onClick={() => decide(item.feedbackId, "rejected")}>Reject</button><button className="danger-button" onClick={() => decide(item.feedbackId, "spam")}>Mark spam</button></div></article>)}</section></>;
}

function AuditLog({ items, onRefresh }: { items: AuditItem[]; onRefresh: () => void }) {
  return <><PageHeader eyebrow="Security & accountability" title="Audit log" description="A durable record of changes made across this project." action={<button className="secondary-button" onClick={onRefresh}>↻ Refresh log</button>} /><section className="panel audit-panel">{items.length === 0 ? <div className="empty-state"><div className="empty-icon">▤</div><strong>No audit events yet</strong><p>Project activity will be recorded here.</p></div> : items.map((item) => <article className="audit-row" key={item.id}><span className="audit-icon">{item.action.startsWith("moderation") ? "◇" : "•"}</span><div><strong>{item.action.replaceAll(".", " · ")}</strong><p>{item.entityType} <code>{item.entityId}</code></p></div><time>{formatDate(item.createdAt)}</time></article>)}</section></>;
}

function DeveloperControls({ projectId, credentials, apiKeys, webhooks, onRefresh }: { projectId: string; credentials: ApiOptions; apiKeys: ApiKeyItem[]; webhooks: WebhookItem[]; onRefresh: () => void }) {
  const [label, setLabel] = useState(""); const [kind, setKind] = useState<"public" | "server">("public"); const [url, setUrl] = useState(""); const [secret, setSecret] = useState<string | null>(null);
  const rotate = async () => { const created = await api<ApiKeyItem & { key: string }>(`/dashboard/projects/${projectId}/api-keys`, { ...credentials, method: "POST", body: JSON.stringify({ kind, label: label || `${kind} integration key` }) }); setLabel(""); setSecret(created.key); onRefresh(); };
  const addWebhook = async () => { if (!url.trim()) return; const created = await api<WebhookItem & { secret: string }>(`/dashboard/projects/${projectId}/webhooks`, { ...credentials, method: "POST", body: JSON.stringify({ url, events: ["feedback.created", "feedback.updated", "feedback.replied"] }) }); setUrl(""); setSecret(created.secret); onRefresh(); };
  return <><PageHeader eyebrow="Integrations" title="Developer controls" description="Manage project credentials and signed event delivery." action={<button className="secondary-button" onClick={onRefresh}>↻ Refresh</button>} />{secret && <div className="secret-banner"><strong>Copy this secret now.</strong><code>{secret}</code><button onClick={() => setSecret(null)}>×</button></div>}<div className="developer-grid"><section className="panel settings-card"><div className="panel-heading"><div><h2>API keys</h2><p>Secrets are shown only once when created.</p></div></div><div className="developer-form"><select value={kind} onChange={(event) => setKind(event.target.value as "public" | "server")}><option value="public">Public SDK key</option><option value="server">Server key</option></select><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Key label" /><button className="primary-button" onClick={rotate}>Create key</button></div><div className="integration-list">{apiKeys.map((key) => <div className="integration-row" key={key.id}><span className={`key-kind ${key.kind}`}>{key.kind}</span><div><strong>{key.label}</strong><small>{key.keyPrefix}•••• · {key.revokedAt ? "Revoked" : "Active"}</small></div><button className="text-danger" disabled={Boolean(key.revokedAt)} onClick={async () => { await api(`/dashboard/projects/${projectId}/api-keys/${key.id}`, { ...credentials, method: "DELETE" }); onRefresh(); }}>Revoke</button></div>)}</div></section><section className="panel settings-card"><div className="panel-heading"><div><h2>Webhooks</h2><p>Signed delivery for feedback events.</p></div></div><div className="developer-form"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-app.com/nitroping" /><button className="primary-button" onClick={addWebhook}>Add webhook</button></div><div className="integration-list">{webhooks.map((hook) => <div className="integration-row" key={hook.id}><span className="key-kind webhook">hook</span><div><strong>{hook.url}</strong><small>{hook.events.length} events · {hook.active ? "Active" : "Disabled"}</small></div><button className="text-danger" disabled={!hook.active} onClick={async () => { await api(`/dashboard/projects/${projectId}/webhooks/${hook.id}`, { ...credentials, method: "DELETE" }); onRefresh(); }}>Disable</button></div>)}</div></section></div></>;
}

function Team({ members, organizationId, credentials, onRefresh }: { members: MemberItem[]; organizationId: string; credentials: ApiOptions; onRefresh: () => void }) {
  const [email, setEmail] = useState(""); const [role, setRole] = useState("member"); const [sending, setSending] = useState(false);
  const invite = async () => { if (!email.trim()) return; setSending(true); try { await api(`/dashboard/organizations/${organizationId}/invites`, { ...credentials, method: "POST", body: JSON.stringify({ email, role }) }); setEmail(""); onRefresh(); } finally { setSending(false); } };
  return <><PageHeader eyebrow="People & permissions" title="Team" description="Invite collaborators and keep project access explicit." action={<button className="secondary-button" onClick={onRefresh}>↻ Refresh team</button>} /><section className="panel settings-card team-card"><div className="panel-heading"><div><h2>Invite a teammate</h2><p>Invitations expire after seven days and are restricted to the invited email.</p></div></div><div className="developer-form"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" /><select value={role} onChange={(event) => setRole(event.target.value)}><option value="member">Member</option><option value="admin">Admin</option><option value="moderator">Moderator</option><option value="viewer">Viewer</option><option value="billing_admin">Billing admin</option></select><button className="primary-button" disabled={sending} onClick={invite}>{sending ? "Sending…" : "Send invite"}</button></div><div className="member-list">{members.map((member) => <div className="member-row" key={member.userId}><span className="avatar purple-avatar">{member.email[0].toUpperCase()}</span><div><strong>{member.email}</strong><small>{member.role} · Joined {formatDate(member.createdAt)}</small></div>{member.role === "owner" ? <span className="role-badge">Owner</span> : <button className="text-danger" onClick={async () => { await api(`/dashboard/organizations/${organizationId}/members/${member.userId}`, { ...credentials, method: "DELETE" }); onRefresh(); }}>Remove</button>}</div>)}</div></section></>;
}

function Notifications({ items, credentials, projectId, onChange }: { items: NotificationPreference[]; credentials: ApiOptions; projectId: string; onChange: (items: NotificationPreference[]) => void }) {
  const update = async (eventType: string, enabled: boolean) => {
    try {
      await api(`/dashboard/projects/${projectId}/notifications`, { ...credentials, method: "PATCH", body: JSON.stringify({ eventType, enabled }) });
      onChange(items.map((item) => item.eventType === eventType ? { ...item, enabled } : item));
    } catch { /* the parent toast handles the next navigation refresh */ }
  };
  return <><PageHeader eyebrow="Personal workflow" title="Notifications" description="Choose which project events should reach your team inbox." action={<button className="secondary-button" onClick={() => location.reload()}>↻ Refresh</button>} /><section className="panel settings-card notification-card">{items.map((item) => <label className="notification-row" key={item.eventType}><span><strong>{statusLabel(item.eventType)}</strong><small>Project activity notification</small></span><input type="checkbox" checked={item.enabled} onChange={(event) => void update(item.eventType, event.target.checked)} /></label>)}</section></>;
}

function Insights({ analytics, usage, onRefresh }: { analytics: Analytics | null; usage: Usage | null; onRefresh: () => void }) {
  const volume = analytics?.volume ?? [];
  const maximum = Math.max(1, ...volume.map((item) => item.count));
  return <><PageHeader eyebrow="Product intelligence" title="Insights" description="Understand the themes behind your users' voice." action={<button className="secondary-button" onClick={onRefresh}>↻ Refresh data</button>} /><div className="analytics-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Feedback volume</h2><p>Last 30 days</p></div><span className="period-pill">Live data</span></div>{volume.length === 0 ? <div className="mini-empty">No feedback volume recorded yet.</div> : <div className="volume-chart" aria-label="Feedback volume for the last 30 days">{volume.map((item) => <div className="volume-bar" key={item.date} title={`${item.date}: ${item.count}`}><i style={{ height: `${Math.max(8, (item.count / maximum) * 100)}%` }} /><small>{item.date.slice(5)}</small></div>)}</div>}</section><section className="panel breakdown-panel"><div className="panel-heading"><div><h2>By type</h2><p>What users are asking for</p></div></div>{(analytics?.types ?? []).length === 0 ? <div className="mini-empty">No type data yet.</div> : analytics?.types.map((item, index) => <div className="breakdown-row" key={item.type}><span className={`breakdown-color c${index}`} /><span>{statusLabel(item.type)}</span><strong>{item.count}</strong><div className="mini-progress"><i style={{ width: `${Math.min(100, (item.count / Math.max(1, analytics.total)) * 100)}%` }} /></div></div>)}</section></div><div className="analytics-bottom"><section className="panel"><div className="panel-heading"><div><h2>Statuses</h2><p>Where feedback sits in the workflow</p></div></div>{(analytics?.statuses ?? []).map((item) => <div className="status-stat" key={item.status}><span className={`status-pill ${item.status}`}>{statusLabel(item.status)}</span><strong>{item.count}</strong><span className="muted">items</span></div>)}</section><section className="panel usage-panel"><div className="panel-heading"><div><h2>Response health</h2><p>Average time from submission</p></div></div><div className="usage-number"><strong>{analytics?.averageResponseMinutes == null ? "—" : `${analytics.averageResponseMinutes}m`}</strong><span>first response</span></div><p className="muted">{analytics?.averageResolutionMinutes == null ? "No resolved feedback yet" : `${analytics.averageResolutionMinutes}m average resolution`}</p><div className="usage-number"><strong>{usage?.feedbackCount ?? 0}</strong><span>/ {usage?.feedbackLimit ?? 100} monthly feedbacks</span></div><div className="progress large"><span style={{ width: `${Math.min(100, ((usage?.feedbackCount ?? 0) / (usage?.feedbackLimit || 1)) * 100)}%` }} /></div><p className="muted">{usage?.plan ?? "Free"} plan · {usage?.attachmentBytes ?? 0} attachment bytes</p></section></div></>;
}

function Roadmap({ items, credentials, projectId, onChange }: { items: Array<Record<string, string>>; credentials: ApiOptions; projectId: string; onChange: () => void }) { const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const add = async () => { if (!title.trim()) return; await api(`/dashboard/projects/${projectId}/roadmap?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ title, body, status: "planned" }) }); setTitle(""); setBody(""); onChange(); }; return <><PageHeader eyebrow="Product direction" title="Roadmap" description="Turn recurring feedback into visible product progress." action={<button className="primary-button" onClick={add}>＋ <span>Add item</span></button>} /><section className="panel composer"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a roadmap item title…" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What are you planning to build?" /><button className="primary-button" onClick={add}>Create roadmap item</button></section><div className="roadmap-grid">{["planned", "in_progress", "completed"].map((status) => <section className="roadmap-column" key={status}><div className="column-heading"><span className={`column-dot ${status}`} /><h2>{statusLabel(status)}</h2><span>{items.filter((item) => item.status === status).length}</span></div>{items.filter((item) => item.status === status).map((item) => <article className="roadmap-card" key={item.id}><span className="card-kicker">Product</span><h3>{item.title}</h3><p>{item.body}</p><small>Updated {item.updatedAt ? formatDate(item.updatedAt) : "recently"}</small></article>)}</section>)}</div></> }

function Changelog({ items, credentials, projectId, onChange }: { items: Array<Record<string, string | null>>; credentials: ApiOptions; projectId: string; onChange: () => void }) { const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const add = async () => { if (!title.trim() || !body.trim()) return; await api(`/dashboard/projects/${projectId}/changelog?projectId=${projectId}`, { ...credentials, method: "POST", body: JSON.stringify({ title, body }) }); setTitle(""); setBody(""); onChange(); }; return <><PageHeader eyebrow="Keep users in the loop" title="Changelog" description="Share shipped work and close the feedback loop with your users." action={<button className="primary-button" onClick={add}>＋ <span>New update</span></button>} /><section className="panel composer"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Update title…" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What changed?" /><button className="primary-button" onClick={add}>Publish update</button></section><section className="timeline">{items.length === 0 ? <div className="empty-state"><div className="empty-icon">✦</div><strong>No updates published yet</strong><p>Your changelog will appear here.</p></div> : items.map((item) => <article className="timeline-item" key={item.id}><div className="timeline-marker" /><div className="panel"><div className="timeline-meta"><span className="status-pill resolved">Published</span><time>{item.publishedAt ? formatDate(item.publishedAt) : "Draft"}</time></div><h2>{item.title}</h2><p>{item.body}</p></div></article>)}</section></> }

function SettingsPanel({ settings, projectId, publicKey, serverKey, onProject, onPublic, onServer, onSave, onSettings }: { settings: Settings | null; projectId: string; publicKey: string; serverKey: string; onProject: (value: string) => void; onPublic: (value: string) => void; onServer: (value: string) => void; onSave: () => void; onSettings: (value: Settings) => void }) { const [draft, setDraft] = useState(settings); useEffect(() => setDraft(settings), [settings]); const save = async () => { if (!draft) return; const updated = await api<Settings>(`/dashboard/projects/${projectId}/settings?projectId=${projectId}`, { projectKey: publicKey, serverKey, method: "PATCH", body: JSON.stringify(draft) }); onSettings(updated); onSave(); }; return <><PageHeader eyebrow="Control room" title="Project settings" description="Configure how NitroPing fits into your product and team." action={<button className="primary-button" onClick={save}>Save changes</button>} /><section className="settings-grid"><div className="panel settings-card"><div className="panel-heading"><div><h2>Connection</h2><p>Keys used by the dashboard and SDKs.</p></div></div><label className="form-field"><span>Project ID</span><input value={projectId} onChange={(event) => onProject(event.target.value)} /></label><label className="form-field"><span>Public project key</span><input value={publicKey} onChange={(event) => onPublic(event.target.value)} /></label><label className="form-field"><span>Server key <em>development only</em></span><input type="password" value={serverKey} onChange={(event) => onServer(event.target.value)} placeholder="Required for dashboard API calls" /></label><button className="secondary-button full-button" onClick={onSave}>Apply connection</button></div><div className="panel settings-card"><div className="panel-heading"><div><h2>Privacy & data</h2><p>Keep control of retention and custom context.</p></div></div><label className="form-field"><span>Retention period <em>days</em></span><input type="number" min="1" max="3650" value={draft?.retentionDays ?? 365} onChange={(event) => setDraft(draft ? { ...draft, retentionDays: Number(event.target.value) } : draft)} /></label><label className="form-field"><span>Allowed metadata fields <em>comma separated</em></span><input value={draft?.allowedMetadata.join(", ") ?? ""} onChange={(event) => setDraft(draft ? { ...draft, allowedMetadata: event.target.value.split(",").map((part) => part.trim()).filter(Boolean) } : draft)} placeholder="appVersion, account.plan" /></label><label className="form-field"><span>Allowed widget origins</span><input value={draft?.origins.join(", ") ?? ""} onChange={(event) => setDraft(draft ? { ...draft, origins: event.target.value.split(",").map((part) => part.trim()).filter(Boolean) } : draft)} placeholder="https://app.example.com" /></label></div></section></> }

createRoot(document.getElementById("root")!).render(<App />);
