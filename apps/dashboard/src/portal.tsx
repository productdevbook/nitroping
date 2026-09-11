import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Feedback, FeedbackStatus, FeedbackType } from "@nitroping/contracts";
import "./portal.css";

type PortalItem = Omit<Feedback, "organizationId" | "metadata"> & { votes?: number };
type Comment = { id: string; body: string; createdAt: string };
type PortalCustomField = { id: string; label: string; type: "text" | "textarea" | "select" | "number" | "boolean"; required?: boolean; options?: string[] };
type Config = { theme?: { buttonLabel?: string; colors?: { primary?: string }; customFields?: PortalCustomField[] }; categories?: Array<{ id: string; name: string; slug: string }> };
const api = "/api/v1";
const params = new URLSearchParams(location.search);
const projectId = params.get("projectId") ?? "";
const projectKey = params.get("projectKey") ?? "";
const headers = { "x-nitroping-project-key": projectKey };
const request = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${api}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body as T;
};
const relativeTime = (value: string) => new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round((new Date(value).getTime() - Date.now()) / 86_400_000), "day");
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

function App() {
  const [config, setConfig] = useState<Config>({});
  const [items, setItems] = useState<PortalItem[]>([]);
  const [roadmap, setRoadmap] = useState<Array<{ id: string; title: string; body: string; status: string }>>([]);
  const [changelog, setChangelog] = useState<Array<{ id: string; title: string; body: string; publishedAt?: string }>>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"feedback" | "roadmap" | "changelog">("feedback");
  const [selected, setSelected] = useState<PortalItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  const refresh = async () => {
    if (!projectId || !projectKey) { setError("This portal link is missing its project configuration."); return; }
    try {
      const suffix = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
      const [publicConfig, feedback, roadmapResult, changelogResult] = await Promise.all([
        request<Config>(`/projects/${encodeURIComponent(projectId)}/public/config`),
        request<{ items: PortalItem[] }>(`/projects/${encodeURIComponent(projectId)}/feedback?limit=50${suffix}`),
        request<{ items: typeof roadmap }>(`/projects/${encodeURIComponent(projectId)}/public/roadmap`),
        request<{ items: typeof changelog }>(`/projects/${encodeURIComponent(projectId)}/public/changelog`),
      ]);
      setConfig(publicConfig); setItems(feedback.items ?? []); setRoadmap(roadmapResult.items ?? []); setChangelog(changelogResult.items ?? []); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load this portal."); }
  };
  useEffect(() => { void refresh(); }, [projectId, projectKey]);
  useEffect(() => {
    if (!projectId || !projectKey || typeof WebSocket === "undefined") return;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${location.host}${api}/projects/${encodeURIComponent(projectId)}/events?projectKey=${encodeURIComponent(projectKey)}`);
    socket.onopen = () => setLive(true);
    socket.onclose = () => setLive(false);
    socket.onerror = () => setLive(false);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as { type?: string };
        if (message.type !== "connected") void refresh();
      } catch { /* Ignore malformed realtime payloads and keep the current view. */ }
    };
    return () => { socket.close(); setLive(false); };
  }, [projectId, projectKey]);
  const filtered = useMemo(() => items.filter((item) => !query || `${item.title} ${item.body}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const openItem = async (item: PortalItem) => { setSelected(item); const result = await request<{ items: Comment[] }>(`/projects/${encodeURIComponent(projectId)}/feedback/${item.id}/comments`); setComments(result.items ?? []); };
  const vote = async (item: PortalItem) => { const result = await request<{ votes: number }>(`/projects/${encodeURIComponent(projectId)}/feedback/${item.id}/vote`, { method: "POST" }); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, votes: result.votes } : entry)); };
  const addComment = async () => { if (!selected || !comment.trim()) return; await request(`/projects/${encodeURIComponent(projectId)}/feedback/${selected.id}/comments`, { method: "POST", body: JSON.stringify({ body: comment.trim() }), headers: { "content-type": "application/json" } }); setComment(""); await openItem(selected); };

  return <main className="portal-shell" style={{ "--portal-primary": config.theme?.colors?.primary ?? "#7657e8" } as CSSProperties}>
    <header className="portal-header"><div className="portal-brand"><span>✦</span>NitroPing</div><nav>{(["feedback", "roadmap", "changelog"] as const).map((value) => <button className={tab === value ? "active" : ""} onClick={() => setTab(value)} key={value}>{titleCase(value)}</button>)}</nav><button className="portal-submit" onClick={() => setShowForm(true)}>Share feedback</button></header>
    <section className="portal-hero"><p className="portal-eyebrow">Community feedback</p><h1>Help shape what comes next.</h1><p>Vote on ideas, report problems, and follow the progress of work that matters to you.</p><div className="portal-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void refresh()} placeholder="Search feedback" /></div></section>
    {error && <div className="portal-error">{error}</div>}
    <section className="portal-content"><div className={`portal-live ${live ? "connected" : ""}`}><i />{live ? "Live updates enabled" : "Updates refresh automatically"}</div>
      {tab === "feedback" && <><div className="portal-section-head"><div><p className="portal-eyebrow">Open conversation</p><h2>Feedback board</h2></div><span>{filtered.length} ideas</span></div><div className="feedback-grid">{filtered.map((item) => <article className="public-card" key={item.id} onClick={() => void openItem(item)}><div className="card-top"><span className={`type-pill ${item.type}`}>{titleCase(item.type)}</span><span className="card-time">{relativeTime(item.createdAt)}</span></div><h3>{item.title}</h3><p>{item.body}</p><div className="card-bottom"><span className={`status-pill ${item.status}`}>{titleCase(item.status)}</span><button onClick={(event) => { event.stopPropagation(); void vote(item); }}>▲ {item.votes ?? 0}</button></div></article>)}</div>{filtered.length === 0 && <div className="portal-empty">No feedback matches your search yet.</div>}</>}
      {tab === "roadmap" && <><div className="portal-section-head"><div><p className="portal-eyebrow">Product direction</p><h2>Roadmap</h2></div></div><div className="roadmap-public">{roadmap.map((item) => <article className="public-card" key={item.id}><span className={`status-pill ${item.status}`}>{titleCase(item.status)}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></>}
      {tab === "changelog" && <><div className="portal-section-head"><div><p className="portal-eyebrow">What shipped</p><h2>Changelog</h2></div></div><div className="changelog-public">{changelog.map((item) => <article className="public-card" key={item.id}><time>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en", { dateStyle: "medium" }) : "Recently"}</time><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></>}
    </section>
    {selected && <div className="portal-modal" onClick={(event) => event.target === event.currentTarget && setSelected(null)}><article className="portal-dialog"><button className="dialog-close" onClick={() => setSelected(null)}>×</button><span className={`type-pill ${selected.type}`}>{titleCase(selected.type)}</span><h2>{selected.title}</h2><p>{selected.body}</p><div className="dialog-vote"><button onClick={() => void vote(selected)}>▲ Vote</button><strong>{selected.votes ?? 0}</strong><span>people agree</span></div><div className="dialog-comments"><h3>Comments</h3>{comments.map((entry) => <div className="comment" key={entry.id}><p>{entry.body}</p><small>{relativeTime(entry.createdAt)}</small></div>)}<div className="comment-compose"><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add your perspective…" /><button onClick={() => void addComment()}>Comment</button></div></div></article></div>}
    {showForm && <FeedbackForm projectId={projectId} config={config} onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); setNotice("Thanks — your feedback is now on the board."); void refresh(); }} />}
    {notice && <button className="portal-notice" onClick={() => setNotice("")}>{notice} ×</button>}
  </main>;
}

function FeedbackForm({ projectId: project, config, onClose, onCreated }: { projectId: string; config: Config; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<FeedbackType>("suggestion"); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [email, setEmail] = useState(""); const [categoryId, setCategoryId] = useState(""); const [customValues, setCustomValues] = useState<Record<string, string | number | boolean>>({}); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const missing = (config.theme?.customFields ?? []).find((field) => field.required && (customValues[field.id] === undefined || customValues[field.id] === ""));
      if (missing) throw new Error(`Please complete ${missing.label}.`);
      const created = await request<{ id: string }>(`/projects/${encodeURIComponent(project)}/feedback`, { method: "POST", body: JSON.stringify({ type, title, body, email: email || undefined, categoryId: categoryId || undefined, metadata: customValues, platform: "web" }), headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() } });
      if (file) {
        const initiated = await request<{ uploadUrl: string }>(`/projects/${encodeURIComponent(project)}/uploads/initiate`, { method: "POST", body: JSON.stringify({ feedbackId: created.id, contentType: file.type || "application/octet-stream", size: file.size }), headers: { "content-type": "application/json" } });
        const uploadUrl = initiated.uploadUrl.startsWith("http") ? initiated.uploadUrl : `${location.origin}${initiated.uploadUrl}`;
        const upload = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type || "application/octet-stream", "x-nitroping-project-key": projectKey }, body: file });
        if (!upload.ok) throw new Error("Attachment upload failed");
      }
      onCreated();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send feedback."); } finally { setBusy(false); }
  };
  return <div className="portal-modal"><form className="portal-dialog feedback-form" onSubmit={submit}><button type="button" className="dialog-close" onClick={onClose}>×</button><p className="portal-eyebrow">Your voice matters</p><h2>Share feedback</h2><label>What kind?<select value={type} onChange={(event) => setType(event.target.value as FeedbackType)}><option value="suggestion">Suggestion</option><option value="bug">Bug report</option><option value="feature_request">Feature request</option><option value="complaint">Complaint</option></select></label>{(config.categories ?? []).length > 0 && <label>Category<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Choose a category</option>{config.categories?.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>}<label>Title<input required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Details<textarea required minLength={3} maxLength={20000} value={body} onChange={(event) => setBody(event.target.value)} /></label>{config.theme?.customFields?.map((field) => <label key={field.id}>{field.label}{field.required && " *"}{field.type === "textarea" ? <textarea required={field.required} value={String(customValues[field.id] ?? "")} onChange={(event) => setCustomValues((values) => ({ ...values, [field.id]: event.target.value }))} /> : field.type === "select" ? <select required={field.required} value={String(customValues[field.id] ?? "")} onChange={(event) => setCustomValues((values) => ({ ...values, [field.id]: event.target.value }))}><option value="">Choose…</option>{(field.options ?? []).map((option) => <option value={option} key={option}>{option}</option>)}</select> : field.type === "boolean" ? <input type="checkbox" checked={customValues[field.id] === true} onChange={(event) => setCustomValues((values) => ({ ...values, [field.id]: event.target.checked }))} /> : <input type={field.type === "number" ? "number" : "text"} required={field.required} value={String(customValues[field.id] ?? "")} onChange={(event) => setCustomValues((values) => ({ ...values, [field.id]: field.type === "number" ? Number(event.target.value) : event.target.value }))} />}</label>)}<label>Email <small>optional, for updates</small><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Attachment <small>optional, up to 10 MB</small><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" onChange={(event) => { const selected = event.target.files?.[0] ?? null; if (selected && selected.size > 10 * 1024 * 1024) { setError("Attachments cannot exceed 10 MB."); event.currentTarget.value = ""; setFile(null); return; } setError(""); setFile(selected); }} /></label>{file && <small className="portal-file-name">{file.name}</small>}{error && <p className="form-error">{error}</p>}<button className="portal-submit" disabled={busy}>{busy ? "Sending…" : "Send feedback"}</button></form></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
