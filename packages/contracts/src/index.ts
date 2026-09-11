export const feedbackTypes = ["complaint", "bug", "suggestion", "feature_request"] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

export const feedbackPriorities = ["low", "normal", "high", "urgent"] as const;
export const platforms = ["web", "ios", "android", "other"] as const;

export const feedbackStatuses = ["new", "triaged", "planned", "in_progress", "resolved", "closed", "spam"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];
export type FeedbackPriority = (typeof feedbackPriorities)[number];
export type Platform = (typeof platforms)[number];

export type Feedback = {
  id: string;
  organizationId: string;
  projectId: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  categoryId?: string;
  assignedUserId?: string;
  mergedIntoId?: string;
  title: string;
  body: string;
  email?: string;
  platform?: Platform;
  appVersion?: string;
  osVersion?: string;
  locale?: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
};

export type CreateFeedbackInput = {
  type: FeedbackType;
  title: string;
  body: string;
  priority?: FeedbackPriority;
  categoryId?: string;
  email?: string;
  platform?: Platform;
  appVersion?: string;
  osVersion?: string;
  locale?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ApiError = {
  error: { code: string; message: string; requestId: string; details?: unknown };
};

export const jsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers ?? {}) },
  });
