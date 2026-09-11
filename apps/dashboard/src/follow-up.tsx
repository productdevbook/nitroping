import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./portal.css";

type Snapshot = {
  feedback: { id: string; type: string; status: string; priority: string; title: string; body: string; createdAt: string; updatedAt: string };
  comments: Array<{ id: string; body: string; createdAt: string }>;
};
const token = new URLSearchParams(location.search).get("token") ?? "";
const formatDate = (date: string) => new Date(date).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { if (!token) { setError("This follow-up link is incomplete."); return; } void fetch(`/api/v1/follow-up/${encodeURIComponent(token)}`).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "This follow-up link has expired."); setSnapshot(body); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load your feedback.")); }, []);
  const remove = async () => { if (!snapshot || !confirm("Delete this feedback permanently?")) return; const response = await fetch(`/api/v1/follow-up/${encodeURIComponent(token)}`, { method: "DELETE" }); if (response.ok) { setSnapshot(null); setMessage("Your feedback has been deleted."); } else setError("We could not delete this feedback."); };
  const unsubscribe = async () => { const response = await fetch(`/api/v1/follow-up/${encodeURIComponent(token)}/unsubscribe`, { method: "POST" }); setMessage(response.ok ? "You will no longer receive email updates." : "We could not change your email preference."); };
  return <main className="follow-shell"><header className="portal-header"><div className="portal-brand"><span>✦</span>NitroPing</div><a href="/portal">Feedback board</a></header><section className="follow-card">{error ? <><p className="portal-eyebrow">Follow-up unavailable</p><h1>We could not open this link</h1><p>{error}</p></> : message && !snapshot ? <><p className="portal-eyebrow">All set</p><h1>Your request is complete</h1><p>{message}</p></> : snapshot ? <><div className="follow-top"><div><p className="portal-eyebrow">Your feedback</p><h1>{snapshot.feedback.title}</h1></div><span className={`status-pill ${snapshot.feedback.status}`}>{titleCase(snapshot.feedback.status)}</span></div><p className="follow-body">{snapshot.feedback.body}</p><div className="follow-meta"><span>{titleCase(snapshot.feedback.type)}</span><span>Submitted {formatDate(snapshot.feedback.createdAt)}</span><span>Last updated {formatDate(snapshot.feedback.updatedAt)}</span></div><section className="follow-comments"><h2>Updates from the team</h2>{snapshot.comments.length === 0 ? <p className="muted">There are no replies yet. We will show them here when the team responds.</p> : snapshot.comments.map((comment) => <article key={comment.id}><p>{comment.body}</p><small>{formatDate(comment.createdAt)}</small></article>)}</section><div className="follow-actions"><button onClick={() => void unsubscribe()}>Unsubscribe from emails</button><button className="danger-link" onClick={() => void remove()}>Delete my feedback</button></div></> : <div className="follow-loading">Loading your feedback…</div>}</section>{message && snapshot && <div className="portal-notice">{message}</div>}</main>;
}
createRoot(document.getElementById("root")!).render(<App />);
