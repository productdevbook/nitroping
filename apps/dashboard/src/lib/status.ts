import type { FeedbackStatus, FeedbackType } from "@nitroping/contracts";
import type { FeedbackPriority } from "@/lib/types";

export const statuses: FeedbackStatus[] = [
  "new",
  "triaged",
  "planned",
  "in_progress",
  "resolved",
  "closed",
  "spam",
];

export const priorities: FeedbackPriority[] = ["low", "normal", "high", "urgent"];

export const feedbackTypes: FeedbackType[] = [
  "complaint",
  "bug",
  "suggestion",
  "feature_request",
];

/*
 * Tailwind only sees class names it can read as literals, so every dot and
 * badge color is looked up here instead of interpolated at the call site. A
 * missing case is a type error rather than an element that silently renders
 * unstyled.
 */
export const statusDot: Record<FeedbackStatus, string> = {
  new: "bg-status-new",
  triaged: "bg-status-triaged",
  planned: "bg-status-planned",
  in_progress: "bg-status-progress",
  resolved: "bg-status-resolved",
  closed: "bg-status-closed",
  spam: "bg-status-spam",
};

export const statusText: Record<FeedbackStatus, string> = {
  new: "text-foreground",
  triaged: "text-muted-foreground",
  planned: "text-muted-foreground",
  in_progress: "text-status-progress",
  resolved: "text-status-resolved",
  closed: "text-muted-foreground",
  spam: "text-status-spam",
};

export const typeDot: Record<FeedbackType, string> = {
  complaint: "bg-status-progress",
  bug: "bg-status-spam",
  suggestion: "bg-status-resolved",
  feature_request: "bg-foreground",
};

export const priorityText: Record<FeedbackPriority, string> = {
  low: "text-muted-foreground",
  normal: "text-muted-foreground",
  high: "text-status-progress",
  urgent: "text-status-spam",
};

export const roadmapStatuses = ["planned", "in_progress", "completed"] as const;

export type RoadmapStatus = (typeof roadmapStatuses)[number];

export const roadmapDot: Record<RoadmapStatus, string> = {
  planned: "bg-status-planned",
  in_progress: "bg-status-progress",
  completed: "bg-status-resolved",
};

export const isFeedbackStatus = (value: string): value is FeedbackStatus =>
  (statuses as string[]).includes(value);

export const isFeedbackType = (value: string): value is FeedbackType =>
  (feedbackTypes as string[]).includes(value);
