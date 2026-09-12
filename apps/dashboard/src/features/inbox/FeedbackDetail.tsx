import { useState } from "react";
import { XIcon } from "lucide-react";
import type { FeedbackStatus } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBytes, formatDate, statusLabel } from "@/lib/format";
import { priorities, statuses } from "@/lib/status";
import type { FeedbackDetail as Detail, FeedbackPriority, MemberItem } from "@/lib/types";

export function FeedbackDetail({
  detail,
  members,
  onClose,
  onAssign,
  onMerge,
  onReply,
  onStatus,
  onPriority,
}: {
  detail: Detail;
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

  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} />
          <span className="text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
          <XIcon />
        </Button>
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight">{item.title}</h2>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{statusLabel(item.type)}</span>
        <span>{item.platform ?? "Unknown platform"}</span>
        <span>{item.priority} priority</span>
        {detail.tags?.map((tag) => <span key={tag.id}>{tag.name}</span>)}
        {item.email && <span>{item.email}</span>}
      </div>
      <p className="mt-3 text-sm leading-5 whitespace-pre-wrap">{item.body}</p>

      {detail.attachments && detail.attachments.length > 0 && (
        <section className="mt-4 border-t border-border pt-3">
          <h3 className="text-sm font-medium">
            Attachments · {detail.attachments.length}
          </h3>
          <div className="mt-2 divide-y divide-border">
            {detail.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 py-1.5 text-sm hover:underline"
              >
                <span className="truncate">{attachment.contentType}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(attachment.sizeBytes)}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 grid gap-3 border-t border-border pt-3">
        <Field>
          <FieldLabel>Assignee</FieldLabel>
          <Select
            value={item.assignedUserId ?? ""}
            onValueChange={(value) => void onAssign(item.id, String(value) || null)}
          >
            <SelectTrigger className="w-full" aria-label="Assignee">
              <SelectValue>
                {(value) =>
                  assignable.find((member) => member.userId === value)?.email ??
                  "Unassigned"
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
        </Field>
        <Field>
          <FieldLabel>Priority</FieldLabel>
          <Select
            value={item.priority}
            onValueChange={(value) => onPriority(value as FeedbackPriority)}
          >
            <SelectTrigger className="w-full" aria-label="Priority">
              <SelectValue>{(value) => statusLabel(String(value))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {statusLabel(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={item.status}
            onValueChange={(value) => onStatus(value as FeedbackStatus)}
          >
            <SelectTrigger className="w-full" aria-label="Status">
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
        </Field>
        <Field>
          <FieldLabel>Merge duplicate</FieldLabel>
          <div className="flex gap-2">
            <Input
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
      </section>

      <section className="mt-4 border-t border-border pt-3">
        <h3 className="text-sm font-medium">
          Activity · {detail.comments.length + detail.statusHistory.length} events
        </h3>
        <div className="mt-2 divide-y divide-border">
          {detail.statusHistory.map((event) => (
            <div key={event.id} className="py-1.5">
              <p className="text-sm">
                Status changed to{" "}
                <span className="font-medium">{statusLabel(event.toStatus)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </p>
            </div>
          ))}
          {detail.comments.map((comment) => (
            <div key={comment.id} className="py-1.5">
              <p className="text-sm">
                <span className="font-medium">
                  {comment.isInternal ? "Internal note" : "Reply"}
                </span>
                : {comment.body}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 border-t border-border pt-3">
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
          className="mt-2 min-h-[72px]"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder={
            internal ? "Leave a note for your team…" : "Write a thoughtful reply…"
          }
        />
        <div className="mt-2 flex justify-end">
          <Button
            disabled={sending || !reply.trim()}
            onClick={async () => {
              setSending(true);
              await onReply(item.id, reply.trim(), internal);
              setSending(false);
              setReply("");
            }}
          >
            Send {internal ? "note" : "reply"}
          </Button>
        </div>
      </section>
    </aside>
  );
}
