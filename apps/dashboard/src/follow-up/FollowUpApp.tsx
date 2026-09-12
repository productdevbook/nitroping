import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useConfirm } from "@/hooks/useConfirm";
import { notifyError, notifySuccess } from "@/lib/notify";

type Snapshot = {
  feedback: {
    id: string;
    type: string;
    status: string;
    priority: string;
    title: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  };
  comments: Array<{ id: string; body: string; createdAt: string }>;
};

const token = new URLSearchParams(location.search).get("token") ?? "";

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export function FollowUpApp() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const confirm = useConfirm();

  useEffect(() => {
    if (!token) {
      setError("This follow-up link is incomplete.");
      return;
    }
    void fetch(`/api/v1/follow-up/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body?.error?.message ?? "This follow-up link has expired.");
        setSnapshot(body);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Could not load your feedback."),
      );
  }, []);

  const remove = async () => {
    const confirmed = await confirm({
      title: "Delete this feedback permanently?",
      description: "The team loses the report and every reply attached to it.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    const response = await fetch(`/api/v1/follow-up/${encodeURIComponent(token)}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setSnapshot(null);
      setDone("Your feedback has been deleted.");
    } else notifyError("We could not delete this feedback.");
  };

  const unsubscribe = async () => {
    const response = await fetch(
      `/api/v1/follow-up/${encodeURIComponent(token)}/unsubscribe`,
      { method: "POST" },
    );
    if (response.ok) notifySuccess("You will no longer receive email updates.");
    else notifyError("We could not change your email preference.");
  };

  return (
    <main className="mx-auto min-h-svh w-full max-w-[720px] px-4 pb-16 sm:px-6">
      <header className="flex h-12 items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="grid size-5 place-items-center rounded-md bg-foreground">
            <span className="size-1.5 rounded-full bg-background" />
          </span>
          NitroPing
        </div>
        <a href="/portal" className="text-xs text-muted-foreground hover:text-foreground">
          Feedback board
        </a>
      </header>

      <section className="py-8">
        {error ? (
          <>
            <h1 className="text-lg font-medium tracking-[-0.01em]">
              We could not open this link
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </>
        ) : done && !snapshot ? (
          <>
            <h1 className="text-lg font-medium tracking-[-0.01em]">
              Your request is complete
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{done}</p>
          </>
        ) : snapshot ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-lg font-medium tracking-[-0.01em]">
                {snapshot.feedback.title}
              </h1>
              <StatusBadge status={snapshot.feedback.status} />
            </div>
            <p className="mt-3 text-xs leading-5 whitespace-pre-wrap">
              {snapshot.feedback.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-y border-border py-2 text-[11px] text-muted-foreground">
              <span>{titleCase(snapshot.feedback.type)}</span>
              <span>Submitted {formatDate(snapshot.feedback.createdAt)}</span>
              <span>Last updated {formatDate(snapshot.feedback.updatedAt)}</span>
            </div>

            <section className="mt-6">
              <h2 className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                Updates from the team
              </h2>
              {snapshot.comments.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  There are no replies yet. We will show them here when the team responds.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-border">
                  {snapshot.comments.map((comment) => (
                    <article key={comment.id} className="py-2">
                      <p className="text-xs">{comment.body}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => void unsubscribe()}>
                Unsubscribe from emails
              </Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => void remove()}
              >
                Delete my feedback
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-10 text-xs text-muted-foreground">
            <Spinner />
            Loading your feedback…
          </div>
        )}
      </section>
    </main>
  );
}
