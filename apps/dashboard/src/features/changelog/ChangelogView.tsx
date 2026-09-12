import { useState } from "react";
import { PlusIcon } from "lucide-react";
import type { Feedback } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackLinks } from "@/features/shared/FeedbackLinks";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { ChangelogItem } from "@/lib/types";

export function ChangelogView({
  items,
  credentials,
  projectId,
  feedback,
  onChange,
}: {
  items: ChangelogItem[];
  credentials: ApiOptions;
  projectId: string;
  feedback: Feedback[];
  onChange: () => void;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [linksFor, setLinksFor] = useState<ChangelogItem | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await api(`/dashboard/projects/${projectId}/changelog?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ title, body }),
      });
      setTitle("");
      setBody("");
      setComposerOpen(false);
      notifySuccess("Update published");
      onChange();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to publish the update"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Changelog"
        description="Share shipped work and close the feedback loop with your users."
        action={
          <Button onClick={() => setComposerOpen(true)}>
            <PlusIcon />
            New update
          </Button>
        }
      />

      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No updates published yet</EmptyTitle>
          <EmptyDescription>Your changelog will appear here.</EmptyDescription>
        </Empty>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <article key={item.id} className="flex gap-4 py-3">
              <time className="w-24 shrink-0 text-[11px] text-muted-foreground">
                {item.publishedAt ? formatDate(item.publishedAt) : "Draft"}
              </time>
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-medium">{item.title}</h2>
                <p className="mt-0.5 max-w-[80ch] text-xs whitespace-pre-wrap text-muted-foreground">
                  {item.body}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLinksFor(item)}>
                Linked feedback
              </Button>
            </article>
          ))}
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void publish();
            }}
          >
            <DialogHeader>
              <DialogTitle>New changelog update</DialogTitle>
              <DialogDescription>
                Published updates are visible on your public portal.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="changelog-title">Title</FieldLabel>
              <Input
                id="changelog-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Faster exports"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="changelog-body">What changed?</FieldLabel>
              <Textarea
                id="changelog-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Describe the change for your users."
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setComposerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !title.trim() || !body.trim()}>
                {busy ? "Publishing…" : "Publish update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={linksFor !== null} onOpenChange={(open) => !open && setLinksFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Linked feedback</DialogTitle>
            <DialogDescription>{linksFor?.title}</DialogDescription>
          </DialogHeader>
          {linksFor && (
            <FeedbackLinks
              kind="changelog"
              itemId={linksFor.id ?? ""}
              projectId={projectId}
              credentials={credentials}
              feedback={feedback}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
