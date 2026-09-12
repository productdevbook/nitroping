import { RefreshCwIcon, SearchIcon } from "lucide-react";
import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackDetail } from "@/features/inbox/FeedbackDetail";
import { FeedbackTable } from "@/features/inbox/FeedbackTable";
import { statusLabel } from "@/lib/format";
import { priorities } from "@/lib/status";
import type { FeedbackController } from "@/hooks/useFeedback";
import type { FeedbackPriority, MemberItem } from "@/lib/types";

const typeOptions: Array<[string, string]> = [
  ["all", "All types"],
  ["complaint", "Complaints"],
  ["bug", "Bugs"],
  ["suggestion", "Suggestions"],
  ["feature_request", "Feature requests"],
];

const tabs: Array<[string, string]> = [
  ["all", "All feedback"],
  ["new", "Needs triage"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
];

export function InboxView({
  feedback,
  members,
}: {
  feedback: FeedbackController;
  members: MemberItem[];
}) {
  const count = (value: string) =>
    value === "all"
      ? feedback.items.length
      : feedback.items.filter((item) => item.status === value).length;

  return (
    <>
      <PageHeader
        title="Feedback inbox"
        description="Review what your users are saying and keep the product moving."
        action={
          <Button variant="outline" onClick={() => void feedback.load()}>
            <RefreshCwIcon />
            Refresh
          </Button>
        }
      />

      <dl className="grid grid-cols-2 divide-border border-y border-border sm:grid-cols-4 sm:divide-x">
        <Metric label="Total feedback" value={feedback.items.length} detail="All time" />
        <Metric label="Needs triage" value={count("new")} detail="New submissions" />
        <Metric
          label="In progress"
          value={count("in_progress")}
          detail="Being worked on"
        />
        <Metric label="Resolved" value={count("resolved")} detail="Closed the loop" />
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <Tabs value={feedback.filter} onValueChange={(value) => feedback.setFilter(value)}>
          <TabsList>
            {tabs.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
                <span className="ml-1.5 tabular-nums text-muted-foreground">
                  {count(value)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-56 pl-8"
              value={feedback.query}
              onChange={(event) => feedback.setQuery(event.target.value)}
              placeholder="Search feedback"
            />
          </div>
          <Toggle
            pressed={feedback.searchMode === "semantic"}
            onPressedChange={(pressed) =>
              feedback.setSearchMode(pressed ? "semantic" : "keyword")
            }
            aria-label="Use meaning-based search powered by Workers AI"
          >
            {feedback.searchMode === "semantic" ? "AI search" : "Keyword search"}
          </Toggle>
          <Select
            value={feedback.typeFilter}
            onValueChange={(value) => feedback.setTypeFilter(String(value))}
          >
            <SelectTrigger aria-label="Filter by type">
              <SelectValue>
                {(value) =>
                  typeOptions.find(([option]) => option === value)?.[1] ?? "All types"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={feedback.priorityFilter}
            onValueChange={(value) => feedback.setPriorityFilter(String(value))}
          >
            <SelectTrigger aria-label="Filter by priority">
              <SelectValue>
                {(value) =>
                  value === "all" ? "All priorities" : statusLabel(String(value))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {statusLabel(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-h-[480px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,38%)]">
        <div className="min-w-0 lg:border-r lg:border-border">
          <FeedbackTable
            items={feedback.filtered}
            selectedId={feedback.selected?.feedback.id ?? null}
            loading={feedback.loading}
            onOpen={(item: Feedback) => void feedback.open(item)}
            onStatus={(item, status: FeedbackStatus) =>
              void feedback.changeStatus(item, status)
            }
          />
        </div>
        {feedback.selected ? (
          <FeedbackDetail
            detail={feedback.selected}
            members={members}
            onClose={() => feedback.setSelected(null)}
            onAssign={feedback.assign}
            onMerge={feedback.merge}
            onReply={feedback.reply}
            onStatus={(status) =>
              feedback.selected && void feedback.changeStatus(feedback.selected.feedback, status)
            }
            onPriority={(priority: FeedbackPriority) =>
              feedback.selected &&
              void feedback.changePriority(feedback.selected.feedback, priority)
            }
          />
        ) : (
          <div className="hidden flex-col items-start justify-center gap-1 px-6 lg:flex">
            <p className="text-sm font-medium">Select feedback to inspect it</p>
            <p className="text-sm text-muted-foreground">
              Replies, notes, status history, and context will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="px-3 py-3 first:pl-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-medium tabular-nums">{value}</dd>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
