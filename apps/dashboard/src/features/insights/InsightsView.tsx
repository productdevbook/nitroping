import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { MeterBar } from "@/components/MeterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { statusLabel } from "@/lib/format";
import type { Analytics, Usage } from "@/lib/types";

export function InsightsView({
  analytics,
  usage,
  onRefresh,
}: {
  analytics: Analytics | null;
  usage: Usage | null;
  onRefresh: () => void;
}) {
  const volume = analytics?.volume ?? [];
  const maximum = Math.max(1, ...volume.map((item) => item.count));
  const types = analytics?.types ?? [];

  return (
    <>
      <PageHeader
        title="Insights"
        description="Understand the themes behind your users' voice."
        action={
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCwIcon />
            Refresh data
          </Button>
        }
      />

      <section>
        <SectionHeader title="Feedback volume" description="Last 30 days" />
        {volume.length === 0 ? (
          <p className="py-6 text-xs text-muted-foreground">
            No feedback volume recorded yet.
          </p>
        ) : (
          <div className="flex h-40 items-end gap-[3px] py-4">
            {volume.map((item) => (
              <Tooltip key={item.date}>
                <TooltipTrigger
                  render={
                    <div className="flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-xs bg-foreground/80"
                        style={{
                          height: `${Math.max(2, (item.count / maximum) * 100)}%`,
                        }}
                      />
                    </div>
                  }
                />
                <TooltipContent>
                  {item.date} · {item.count}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title="By type" description="What users are asking for" />
        {types.length === 0 ? (
          <p className="py-6 text-xs text-muted-foreground">No type data yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {types.map((item) => (
              <div key={item.type} className="grid gap-1 py-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span>{statusLabel(item.type)}</span>
                  <span className="tabular-nums">{item.count}</span>
                </div>
                <MeterBar
                  value={item.count}
                  max={Math.max(1, analytics?.total ?? 1)}
                  label={statusLabel(item.type)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title="Statuses" description="Where feedback sits in the workflow" />
        <div className="divide-y divide-border">
          {(analytics?.statuses ?? []).map((item) => (
            <div key={item.status} className="flex items-center justify-between py-2.5">
              <StatusBadge status={item.status} />
              <span className="text-xs tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 max-w-[720px]">
        <SectionHeader title="Response health" description="Average time from submission" />
        <dl className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="py-3 pr-3">
            <dt className="text-[11px] text-muted-foreground">First response</dt>
            <dd className="mt-0.5 text-lg font-medium tabular-nums">
              {analytics?.averageResponseMinutes == null
                ? "—"
                : `${analytics.averageResponseMinutes}m`}
            </dd>
          </div>
          <div className="py-3 pl-3">
            <dt className="text-[11px] text-muted-foreground">Average resolution</dt>
            <dd className="mt-0.5 text-lg font-medium tabular-nums">
              {analytics?.averageResolutionMinutes == null
                ? "—"
                : `${analytics.averageResolutionMinutes}m`}
            </dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {usage?.plan ?? "Free"} plan · monthly feedback
            </span>
            <span className="tabular-nums">
              {usage?.feedbackCount ?? 0} / {usage?.feedbackLimit ?? 100}
            </span>
          </div>
          <MeterBar
            value={usage?.feedbackCount ?? 0}
            max={usage?.feedbackLimit ?? 100}
            label="Monthly feedback usage"
          />
        </div>
      </section>
    </>
  );
}
