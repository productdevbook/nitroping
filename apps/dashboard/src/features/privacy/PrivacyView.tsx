import { useState } from "react";
import { DownloadIcon } from "lucide-react";
import type { Feedback } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import { Empty, EmptyTitle } from "@/components/ui/empty";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { Settings } from "@/lib/types";
import { useConfirm } from "@/hooks/useConfirm";

export function PrivacyView({
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
  const confirm = useConfirm();

  const exportData = async () => {
    setBusy(true);
    const headers = new Headers();
    if (credentials.projectKey)
      headers.set("x-nitroping-project-key", credentials.projectKey);
    if (credentials.serverKey)
      headers.set("x-nitroping-server-key", credentials.serverKey);
    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    try {
      const response = await fetch(
        `/api/v1/dashboard/projects/${encodeURIComponent(projectId)}/export`,
        { credentials: "include", headers },
      );
      if (!response.ok) throw new Error("The data export could not be created.");
      url = URL.createObjectURL(await response.blob());
      anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nitroping-${projectId}-export.json`;
      document.body.append(anchor);
      anchor.click();
      notifySuccess("Your export download has started.");
    } catch (error) {
      notifyError(errorMessage(error, "The data export failed."));
    } finally {
      anchor?.remove();
      // Revoke on the next tick: Safari cancels a download whose blob URL is
      // released in the same frame as the click.
      const objectUrl = url;
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      setBusy(false);
    }
  };

  const anonymize = async (item: Feedback) => {
    const confirmed = await confirm({
      title: "Anonymize this feedback?",
      description: `“${item.title}” loses its author email, body, metadata, comments, and attachments.`,
      confirmLabel: "Anonymize",
      destructive: true,
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await api(
        `/dashboard/projects/${encodeURIComponent(projectId)}/feedback/${encodeURIComponent(item.id)}/anonymize`,
        { ...credentials, method: "POST" },
      );
      notifySuccess("Feedback anonymized.");
      await onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "The feedback could not be anonymized."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Privacy & data"
        description="Export project data, review retention, and remove personal feedback data safely."
        action={
          <Button disabled={busy} onClick={() => void exportData()}>
            <DownloadIcon />
            {busy ? "Working…" : "Download export"}
          </Button>
        }
      />

      <section className="max-w-[720px]">
        <SectionHeader
          title="Retention policy"
          description="Feedback older than this period is anonymized and attachments are queued for physical deletion."
        />
        <p className="py-3 text-lg font-medium tabular-nums">
          {settings?.retentionDays ?? 365}{" "}
          <span className="text-sm font-normal text-muted-foreground">days</span>
        </p>
      </section>

      <section className="mt-8">
        <SectionHeader
          title="Feedback anonymization"
          description="Use this for a verified deletion request or data minimization workflow."
        />
        {feedback.length === 0 ? (
          <Empty>
            <EmptyTitle>No feedback to anonymize</EmptyTitle>
          </Empty>
        ) : (
          <div className="divide-y divide-border">
            {feedback.slice(0, 50).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.email ?? "Anonymous"} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy || item.body === "[anonymized]"}
                  onClick={() => void anonymize(item)}
                >
                  {item.body === "[anonymized]" ? "Anonymized" : "Anonymize"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
