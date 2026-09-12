import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronUpIcon, SearchIcon } from "lucide-react";
import type { Feedback } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, TypeDot } from "@/components/StatusBadge";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  apiBase,
  projectId,
  projectKey,
  relativeTime,
  request,
  titleCase,
} from "@/portal/client";
import type { PortalConfig } from "@/portal/client";
import { FeedbackForm } from "@/portal/FeedbackForm";
import { cn } from "cn";

type PortalItem = Omit<Feedback, "organizationId" | "metadata"> & { votes?: number };
type Comment = { id: string; body: string; createdAt: string };
type RoadmapEntry = { id: string; title: string; body: string; status: string };
type ChangelogEntry = {
  id: string;
  title: string;
  body: string;
  publishedAt?: string;
};

const tabs = ["feedback", "roadmap", "changelog"] as const;

export function PortalApp() {
  const [config, setConfig] = useState<PortalConfig>({});
  const [items, setItems] = useState<PortalItem[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapEntry[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("feedback");
  const [selected, setSelected] = useState<PortalItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  const refresh = async () => {
    if (!projectId || !projectKey) {
      setError("This portal link is missing its project configuration.");
      return;
    }
    try {
      const suffix = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
      const [publicConfig, feedback, roadmapResult, changelogResult] = await Promise.all([
        request<PortalConfig>(`/projects/${encodeURIComponent(projectId)}/public/config`),
        request<{ items: PortalItem[] }>(
          `/projects/${encodeURIComponent(projectId)}/feedback?limit=50${suffix}`,
        ),
        request<{ items: RoadmapEntry[] }>(
          `/projects/${encodeURIComponent(projectId)}/public/roadmap`,
        ),
        request<{ items: ChangelogEntry[] }>(
          `/projects/${encodeURIComponent(projectId)}/public/changelog`,
        ),
      ]);
      setConfig(publicConfig);
      setItems(feedback.items ?? []);
      setRoadmap(roadmapResult.items ?? []);
      setChangelog(changelogResult.items ?? []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this portal.");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!projectId || !projectKey || typeof WebSocket === "undefined") return;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(
      `${protocol}//${location.host}${apiBase}/projects/${encodeURIComponent(projectId)}/events?projectKey=${encodeURIComponent(projectKey)}`,
    );
    socket.onopen = () => setLive(true);
    socket.onclose = () => setLive(false);
    socket.onerror = () => setLive(false);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as { type?: string };
        if (message.type !== "connected") void refresh();
      } catch {
        // Ignore malformed realtime payloads and keep the current view.
      }
    };
    return () => {
      socket.close();
      setLive(false);
    };
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          !query || `${item.title} ${item.body}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  );

  const openItem = async (item: PortalItem) => {
    setSelected(item);
    try {
      const result = await request<{ items: Comment[] }>(
        `/projects/${encodeURIComponent(projectId)}/feedback/${item.id}/comments`,
      );
      setComments(result.items ?? []);
    } catch (cause) {
      notifyError(cause instanceof Error ? cause.message : "Could not load comments.");
    }
  };

  const vote = async (item: PortalItem) => {
    try {
      const result = await request<{ votes: number }>(
        `/projects/${encodeURIComponent(projectId)}/feedback/${item.id}/vote`,
        { method: "POST" },
      );
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, votes: result.votes } : entry,
        ),
      );
      setSelected((current) =>
        current?.id === item.id ? { ...current, votes: result.votes } : current,
      );
    } catch (cause) {
      notifyError(cause instanceof Error ? cause.message : "Could not record the vote.");
    }
  };

  const addComment = async () => {
    if (!selected || !comment.trim()) return;
    try {
      await request(
        `/projects/${encodeURIComponent(projectId)}/feedback/${selected.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ body: comment.trim() }),
          headers: { "content-type": "application/json" },
        },
      );
      setComment("");
      await openItem(selected);
    } catch (cause) {
      notifyError(cause instanceof Error ? cause.message : "Could not add the comment.");
    }
  };

  return (
    <main
      className="mx-auto min-h-svh w-full max-w-[900px] px-4 pb-16 sm:px-6"
      style={
        { "--portal-primary": config.theme?.colors?.primary ?? "#0a0a0a" } as CSSProperties
      }
    >
      <header className="flex h-12 items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="grid size-5 place-items-center rounded-md bg-foreground">
            <span className="size-1.5 rounded-full bg-background" />
          </span>
          NitroPing
        </div>
        <Button onClick={() => setShowForm(true)}>Share feedback</Button>
      </header>

      <section className="py-8">
        <h1 className="text-lg font-medium tracking-[-0.01em]">
          Help shape what comes next.
        </h1>
        <p className="mt-1 max-w-[60ch] text-xs text-muted-foreground">
          Vote on ideas, report problems, and follow the progress of work that matters to
          you.
        </p>
        <div className="relative mt-4 max-w-md">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-7"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void refresh()}
            placeholder="Search feedback"
          />
        </div>
      </section>

      {error && <p className="pb-4 text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as (typeof tabs)[number])}
        >
          <TabsList>
            {tabs.map((value) => (
              <TabsTrigger key={value} value={value}>
                {titleCase(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={cn(
              "size-1.5 rounded-full",
              live ? "bg-tone-success" : "bg-muted-foreground",
            )}
          />
          {live ? "Live updates enabled" : "Updates refresh automatically"}
        </span>
      </div>

      {tab === "feedback" &&
        (filtered.length === 0 ? (
          <Empty>
            <EmptyTitle>No feedback matches your search yet</EmptyTitle>
            <EmptyDescription>Be the first to share an idea.</EmptyDescription>
          </Empty>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3">
                <TypeDot type={item.type} className="mt-1.5" />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left outline-none focus-visible:underline"
                  onClick={() => void openItem(item)}
                >
                  <span className="block text-[13px] font-medium">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                    {item.body}
                  </span>
                  <span className="mt-1 flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(item.createdAt)}
                    </span>
                  </span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 tabular-nums"
                  onClick={() => void vote(item)}
                  aria-label={`Vote for ${item.title}`}
                >
                  <ChevronUpIcon />
                  {item.votes ?? 0}
                </Button>
              </div>
            ))}
          </div>
        ))}

      {tab === "roadmap" && (
        <div className="divide-y divide-border">
          {roadmap.map((item) => (
            <article key={item.id} className="py-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
              </div>
              <h2 className="mt-1 text-[13px] font-medium">{item.title}</h2>
              <p className="mt-0.5 max-w-[70ch] text-xs text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      )}

      {tab === "changelog" && (
        <div className="divide-y divide-border">
          {changelog.map((item) => (
            <article key={item.id} className="flex gap-4 py-3">
              <time className="w-24 shrink-0 text-[11px] text-muted-foreground">
                {item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString("en", {
                      dateStyle: "medium",
                    })
                  : "Recently"}
              </time>
              <div className="min-w-0">
                <h2 className="text-[13px] font-medium">{item.title}</h2>
                <p className="mt-0.5 max-w-[70ch] text-xs whitespace-pre-wrap text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                <span className="text-[11px] text-muted-foreground">
                  {titleCase(selected.type)}
                </span>
              </div>
              <p className="text-xs whitespace-pre-wrap">{selected.body}</p>
              <div className="flex items-center gap-3 border-y border-border py-2">
                <Button variant="outline" size="sm" onClick={() => void vote(selected)}>
                  <ChevronUpIcon />
                  Vote
                </Button>
                <span className="text-xs tabular-nums">
                  {selected.votes ?? 0} people agree
                </span>
              </div>
              <div>
                <h3 className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  Comments
                </h3>
                <div className="mt-2 divide-y divide-border">
                  {comments.map((entry) => (
                    <div key={entry.id} className="py-2">
                      <p className="text-xs">{entry.body}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {relativeTime(entry.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
                <Textarea
                  className="mt-2"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add your perspective…"
                />
                <div className="mt-2 flex justify-end">
                  <Button disabled={!comment.trim()} onClick={() => void addComment()}>
                    Comment
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <FeedbackForm
        open={showForm}
        projectId={projectId}
        config={config}
        onOpenChange={setShowForm}
        onCreated={() => {
          setShowForm(false);
          notifySuccess("Thanks — your feedback is now on the board.");
          void refresh();
        }}
      />
    </main>
  );
}
