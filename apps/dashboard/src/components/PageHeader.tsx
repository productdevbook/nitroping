import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-medium tracking-[-0.01em]">{title}</h1>
        <p className="mt-1 max-w-[70ch] text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
      <div className="min-w-0">
        <h2 className="text-[13px] font-medium">{title}</h2>
        {description && (
          <p className="mt-0.5 max-w-[70ch] text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
