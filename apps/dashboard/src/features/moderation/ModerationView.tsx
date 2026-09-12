import { RefreshCwIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { formatDate, statusLabel } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { ModerationItem } from "@/lib/types";
import { useConfirm } from "@/hooks/useConfirm";

export function ModerationView({
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
  const confirm = useConfirm();

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
    } catch (error) {
      notifyError(errorMessage(error, "Unable to record the decision"));
    }
  };

  const markSpam = async (item: ModerationItem) => {
    const confirmed = await confirm({
      title: "Mark this feedback as spam?",
      description: `“${item.title}” will be hidden from public views.`,
      confirmLabel: "Mark spam",
      destructive: true,
    });
    if (confirmed) await decide(item.feedbackId, "spam");
  };

  const requestAiReview = async (feedbackId: string) => {
    try {
      await api(
        `/dashboard/projects/${projectId}/feedback/${feedbackId}/ai-review`,
        { ...credentials, method: "POST" },
      );
      notifySuccess("AI review requested");
      onChange();
    } catch (error) {
      notifyError(errorMessage(error, "AI assist is unavailable"));
    }
  };

  return (
    <>
      <PageHeader
        title="Moderation queue"
        description="Review automated flags before they affect your public feedback stream."
        action={
          <Button variant="outline" onClick={onChange}>
            <RefreshCwIcon />
            Refresh queue
          </Button>
        }
      />
      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>Queue is clear</EmptyTitle>
          <EmptyDescription>
            New automated moderation events will appear here.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <article
              key={item.feedbackId}
              className="flex flex-wrap items-start justify-between gap-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {statusLabel(item.type)}
                  </span>
                  <StatusBadge status={item.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <h2 className="mt-1 text-[13px] font-medium">{item.title}</h2>
                <p className="mt-0.5 max-w-[80ch] text-xs text-muted-foreground">
                  {item.body}
                </p>
                {item.email && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{item.email}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <Button
                  variant="ghost"
                  onClick={() => void requestAiReview(item.feedbackId)}
                >
                  <SparklesIcon />
                  AI assist
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void decide(item.feedbackId, "approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void decide(item.feedbackId, "rejected")}
                >
                  Reject
                </Button>
                <Button variant="destructive" onClick={() => void markSpam(item)}>
                  Mark spam
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
