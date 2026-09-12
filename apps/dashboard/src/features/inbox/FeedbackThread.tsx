import { useState } from "react";
import { PaperclipIcon, XIcon } from "lucide-react";
import type { FeedbackStatus } from "@nitroping/contracts";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBytes, formatDate, initials, statusLabel } from "@/lib/format";
import { priorities, statuses } from "@/lib/status";
import type { FeedbackDetail, FeedbackPriority, MemberItem } from "@/lib/types";

type ThreadEntry =
  | { kind: "status"; id: string; label: string; createdAt: string }
  | { kind: "comment"; id: string; body: string; internal: boolean; createdAt: string };

export function FeedbackThread({
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
  const [sending, setSending] = useState(false);
  const item = detail.feedback;
  const assignable = members.filter((member) => member.role !== "viewer");
  const author = item.email ?? "Anonymous";

  const entries: ThreadEntry[] = [
    ...detail.statusHistory.map((event) => ({
      kind: "status" as const,
      id: event.id,
      label: statusLabel(event.toStatus),
      createdAt: event.createdAt,
    })),
    ...detail.comments.map((comment) => ({
      kind: "comment" as const,
      id: comment.id,
      body: comment.body,
      internal: comment.isInternal === 1,
      createdAt: comment.createdAt,
    })),
  ].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await onReply(item.id, reply.trim(), internal);
    setSending(false);
    setReply("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight">{item.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <StatusBadge status={item.status} />
            <span>{statusLabel(item.type)}</span>
            <span>{item.platform ?? "Unknown platform"}</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <XIcon />
        </Button>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border p-3">
        <Select
          value={item.status}
          onValueChange={(value) => onStatus(value as FeedbackStatus)}
        >
          <SelectTrigger aria-label="Status">
            <SelectValue>{(value) => statusLabel(String(value))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={item.priority}
          onValueChange={(value) => onPriority(value as FeedbackPriority)}
        >
          <SelectTrigger aria-label="Priority">
            <SelectValue>{(value) => `${statusLabel(String(value))} priority`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {statusLabel(priority)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={item.assignedUserId ?? ""}
          onValueChange={(value) => void onAssign(item.id, String(value) || null)}
        >
          <SelectTrigger aria-label="Assignee">
            <SelectValue>
              {(value) =>
                assignable.find((member) => member.userId === value)?.email ?? "Unassigned"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {assignable.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <MessageGroup className="gap-4 p-4">
          <Message align="start">
            <MessageAvatar className="size-8 text-xs font-medium">
              {initials(author)}
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>{author}</MessageHeader>
              <Bubble variant="muted">
                <BubbleContent className="whitespace-pre-wrap">{item.body}</BubbleContent>
              </Bubble>
              {detail.attachments && detail.attachments.length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                  {detail.attachments.map((attachment) =>
                    /* A screenshot is the message; show it rather than its MIME type. */
                    attachment.contentType.startsWith("image/") ? (
                      <a
                        key={attachment.id}
                        href={attachment.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`${attachment.contentType} · ${formatBytes(attachment.sizeBytes)}`}
                        className="block overflow-hidden rounded-md border border-border transition-colors hover:border-foreground/30"
                      >
                        <img
                          src={attachment.downloadUrl}
                          alt=""
                          loading="lazy"
                          className="size-20 object-cover"
                        />
                      </a>
                    ) : (
                      <Button
                        key={attachment.id}
                        variant="outline"
                        size="sm"
                        render={
                          <a
                            href={attachment.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                        nativeButton={false}
                      >
                        <PaperclipIcon />
                        {attachment.contentType} · {formatBytes(attachment.sizeBytes)}
                      </Button>
                    ),
                  )}
                </div>
              )}
              <MessageFooter>{formatDate(item.createdAt)}</MessageFooter>
            </MessageContent>
          </Message>

          {entries.map((entry) =>
            entry.kind === "status" ? (
              <div
                key={entry.id}
                className="flex items-center gap-3 text-xs text-muted-foreground"
              >
                <Separator className="flex-1" />
                <span>
                  Status changed to {entry.label} · {formatDate(entry.createdAt)}
                </span>
                <Separator className="flex-1" />
              </div>
            ) : (
              <Message key={entry.id} align="end">
                <MessageContent>
                  <MessageHeader>
                    {entry.internal ? "Internal note" : "Team reply"}
                  </MessageHeader>
                  <Bubble
                    align="end"
                    variant={entry.internal ? "outline" : "default"}
                  >
                    <BubbleContent className="whitespace-pre-wrap">
                      {entry.body}
                    </BubbleContent>
                  </Bubble>
                  <MessageFooter>{formatDate(entry.createdAt)}</MessageFooter>
                </MessageContent>
              </Message>
            ),
          )}
        </MessageGroup>
      </ScrollArea>

      <footer className="border-t border-border p-3">
        <Tabs
          value={internal ? "note" : "reply"}
          onValueChange={(value) => setInternal(value === "note")}
        >
          <TabsList>
            <TabsTrigger value="reply">Reply to user</TabsTrigger>
            <TabsTrigger value="note">Internal note</TabsTrigger>
          </TabsList>
        </Tabs>
        <Textarea
          className="mt-2 min-h-[80px]"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void send();
            }
          }}
          placeholder={
            internal ? "Leave a note for your team…" : "Write a thoughtful reply…"
          }
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <KbdGroup className="text-xs text-muted-foreground">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
            <span>to send</span>
          </KbdGroup>
          <Button disabled={sending || !reply.trim()} onClick={() => void send()}>
            Send {internal ? "note" : "reply"}
          </Button>
        </div>
        <Field className="mt-3">
          <FieldLabel htmlFor="merge-target">Merge duplicate</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="merge-target"
              value={mergeTarget}
              onChange={(event) => setMergeTarget(event.target.value)}
              placeholder="Feedback ID"
            />
            <Button
              variant="outline"
              disabled={!mergeTarget.trim()}
              onClick={async () => {
                await onMerge(item.id, mergeTarget.trim());
                setMergeTarget("");
              }}
            >
              Merge
            </Button>
          </div>
        </Field>
      </footer>
    </div>
  );
}
