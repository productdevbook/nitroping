import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { StatusBadge, TypeDot } from "@/components/StatusBadge";
import { formatDate, statusLabel } from "@/lib/format";
import { statuses } from "@/lib/status";
import { cn } from "cn";

export function FeedbackTable({
  items,
  selectedId,
  loading,
  onOpen,
  onStatus,
}: {
  items: Feedback[];
  selectedId: string | null;
  loading: boolean;
  onOpen: (item: Feedback) => void;
  onStatus: (item: Feedback, status: FeedbackStatus) => void;
}) {
  if (loading)
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        ))}
      </div>
    );

  if (items.length === 0)
    return (
      <Empty>
        <EmptyTitle>No feedback here yet</EmptyTitle>
        <EmptyDescription>New user feedback will appear in this view.</EmptyDescription>
      </Empty>
    );

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-3 px-3 py-3 transition-colors",
            selectedId === item.id
              ? "bg-muted shadow-[inset_2px_0_0_0_var(--foreground)]"
              : "hover:bg-muted/60",
          )}
        >
          <TypeDot type={item.type} className="mt-1.5" />
          {/*
            Only the title is the open target. The row itself is not clickable,
            so the portalled status Select can never re-open another row.
          */}
          <button
            type="button"
            className="min-w-0 flex-1 text-left outline-none focus-visible:underline"
            onClick={() => onOpen(item)}
          >
            <span className="flex items-baseline gap-2">
              <span className="truncate text-sm font-medium">{item.title}</span>
              <span className="ml-auto shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                {formatDate(item.createdAt)}
              </span>
            </span>
            <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">
              {item.body}
            </span>
            <span className="mt-1 flex items-center gap-3">
              <StatusBadge status={item.status} />
              <span className="text-xs text-muted-foreground">
                {statusLabel(item.type)}
              </span>
              {item.platform && (
                <span className="text-xs text-muted-foreground">{item.platform}</span>
              )}
            </span>
          </button>
          <div data-row-action="">
            <Select
              value={item.status}
              onValueChange={(value) => onStatus(item, value as FeedbackStatus)}
            >
              <SelectTrigger size="sm" aria-label="Change status">
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
          </div>
        </div>
      ))}
    </div>
  );
}
