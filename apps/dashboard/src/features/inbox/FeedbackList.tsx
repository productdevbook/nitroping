import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, TypeDot } from "@/components/StatusBadge";
import { formatDate, statusLabel } from "@/lib/format";
import { priorities, statuses } from "@/lib/status";
import type { FeedbackPriority } from "@/lib/types";

export function FeedbackList({
  items,
  selectedId,
  loading,
  onOpen,
  onStatus,
  onPriority,
}: {
  items: Feedback[];
  selectedId: string | null;
  loading: boolean;
  onOpen: (item: Feedback) => void;
  onStatus: (item: Feedback, status: FeedbackStatus) => void;
  onPriority: (item: Feedback, priority: FeedbackPriority) => void;
}) {
  if (loading)
    return (
      <ItemGroup className="gap-0 p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Item key={index}>
            <ItemMedia variant="icon">
              <Skeleton className="size-2 rounded-full" />
            </ItemMedia>
            <ItemContent>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    );

  if (items.length === 0)
    return (
      <Empty>
        <EmptyTitle>No feedback here yet</EmptyTitle>
        <EmptyDescription>New user feedback will appear in this view.</EmptyDescription>
      </Empty>
    );

  return (
    <ItemGroup className="gap-0 p-2">
      {items.map((item) => (
        <ContextMenu key={item.id}>
          <ContextMenuTrigger
            render={
              <Item
                variant={selectedId === item.id ? "muted" : "default"}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => onOpen(item)}
              />
            }
          >
            <ItemMedia variant="icon">
              <TypeDot type={item.type} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{item.title}</ItemTitle>
              <ItemDescription>{item.body}</ItemDescription>
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground">
                  {statusLabel(item.type)}
                </span>
                {item.platform && (
                  <span className="text-xs text-muted-foreground">{item.platform}</span>
                )}
                {item.priority !== "normal" && (
                  <span className="text-xs text-muted-foreground">
                    {statusLabel(item.priority)} priority
                  </span>
                )}
              </div>
            </ItemContent>
            <ItemActions className="self-start">
              <time className="text-xs whitespace-nowrap text-muted-foreground">
                {formatDate(item.createdAt)}
              </time>
            </ItemActions>
          </ContextMenuTrigger>
          {/* Right-click changes status and priority without leaving the list. */}
          <ContextMenuContent className="w-44">
            <ContextMenuGroup>
              <ContextMenuLabel>Status</ContextMenuLabel>
              {statuses.map((status) => (
                <ContextMenuItem
                  key={status}
                  disabled={item.status === status}
                  onClick={() => onStatus(item, status)}
                >
                  {statusLabel(status)}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuLabel>Priority</ContextMenuLabel>
              {priorities.map((priority) => (
                <ContextMenuItem
                  key={priority}
                  disabled={item.priority === priority}
                  onClick={() => onPriority(item, priority)}
                >
                  {statusLabel(priority)}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </ItemGroup>
  );
}
