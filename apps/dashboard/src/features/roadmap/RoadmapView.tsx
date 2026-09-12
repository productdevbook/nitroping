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
import { formatDate, statusLabel } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import { roadmapDot, roadmapStatuses } from "@/lib/status";
import type { RoadmapItem } from "@/lib/types";
import { cn } from "cn";

export function RoadmapView({
  items,
  credentials,
  projectId,
  feedback,
  onChange,
}: {
  items: RoadmapItem[];
  credentials: ApiOptions;
  projectId: string;
  feedback: Feedback[];
  onChange: () => void;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [linksFor, setLinksFor] = useState<RoadmapItem | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await api(`/dashboard/projects/${projectId}/roadmap?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ title, body, status: "planned" }),
      });
      setTitle("");
      setBody("");
      setComposerOpen(false);
      notifySuccess("Roadmap item created");
      onChange();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to create the roadmap item"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Roadmap"
        description="Turn recurring feedback into visible product progress."
        action={
          <Button onClick={() => setComposerOpen(true)}>
            <PlusIcon />
            Add item
          </Button>
        }
      />

      {items.length === 0 ? (
        <Empty>
          <EmptyTitle>No roadmap items yet</EmptyTitle>
          <EmptyDescription>
            Plan the work your users are asking for and link it back to their feedback.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="border-t border-border">
          {roadmapStatuses.map((status) => {
            const group = items.filter((item) => item.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  <span className={cn("size-1.5 rounded-full", roadmapDot[status])} />
                  {statusLabel(status)}
                  <span className="tabular-nums">{group.length}</span>
                </h2>
                <div className="divide-y divide-border">
                  {group.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium">{item.title}</p>
                        {item.body && (
                          <p className="mt-0.5 max-w-[80ch] text-xs text-muted-foreground">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Updated{" "}
                          {item.updatedAt ? formatDate(item.updatedAt) : "recently"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLinksFor(item)}
                      >
                        Linked feedback
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void add();
            }}
          >
            <DialogHeader>
              <DialogTitle>New roadmap item</DialogTitle>
              <DialogDescription>
                Items start in the planned column and can be linked to feedback.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="roadmap-title">Title</FieldLabel>
              <Input
                id="roadmap-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Dark mode for the reports page"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="roadmap-body">Description</FieldLabel>
              <Textarea
                id="roadmap-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="What are you planning to build?"
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
              <Button type="submit" disabled={busy || !title.trim()}>
                {busy ? "Creating…" : "Create item"}
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
              kind="roadmap"
              itemId={linksFor.id}
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
