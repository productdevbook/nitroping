import type { FeedbackStatus, FeedbackType } from "@nitroping/contracts";
import { statusLabel } from "@/lib/format";
import {
  isFeedbackStatus,
  isFeedbackType,
  statusDot,
  statusText,
  typeDot,
} from "@/lib/status";
import { cn } from "cn";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const known: FeedbackStatus | null = isFeedbackStatus(status) ? status : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap",
        known ? statusText[known] : "text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          known ? statusDot[known] : "bg-muted-foreground",
        )}
      />
      {statusLabel(status)}
    </span>
  );
}

export function TypeDot({ type, className }: { type: string; className?: string }) {
  const known: FeedbackType | null = isFeedbackType(type) ? type : null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        known ? typeDot[known] : "bg-muted-foreground",
        className,
      )}
    />
  );
}

export function MetaText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-[11px] text-muted-foreground", className)}>{children}</span>
  );
}
