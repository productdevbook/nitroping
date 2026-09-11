import { Effect } from "effect";
import type { CreateFeedbackInput, Feedback, FeedbackStatus } from "@nitroping/contracts";

export type TenantContext = { organizationId: string; projectId: string; publicKey?: string };

export type FeedbackRepository = {
  create: (context: TenantContext, input: CreateFeedbackInput, requestId: string) => Promise<Feedback>;
  get: (context: TenantContext, id: string) => Promise<Feedback | null>;
  list: (context: TenantContext, cursor?: string, limit?: number) => Promise<{ items: Feedback[]; nextCursor?: string }>;
  updateStatus: (context: TenantContext, id: string, status: FeedbackStatus) => Promise<Feedback | null>;
};

export const createFeedback = (repo: FeedbackRepository, context: TenantContext, input: CreateFeedbackInput, requestId: string) =>
  Effect.tryPromise({ try: () => repo.create(context, input, requestId), catch: (cause) => new Error(`feedback.create failed: ${String(cause)}`) });

export const getFeedback = (repo: FeedbackRepository, context: TenantContext, id: string) =>
  Effect.tryPromise({ try: () => repo.get(context, id), catch: (cause) => new Error(`feedback.get failed: ${String(cause)}`) });

export const listFeedback = (repo: FeedbackRepository, context: TenantContext, cursor?: string) =>
  Effect.tryPromise({ try: () => repo.list(context, cursor), catch: (cause) => new Error(`feedback.list failed: ${String(cause)}`) });

export const changeFeedbackStatus = (repo: FeedbackRepository, context: TenantContext, id: string, status: FeedbackStatus) =>
  Effect.tryPromise({ try: () => repo.updateStatus(context, id, status), catch: (cause) => new Error(`feedback.status failed: ${String(cause)}`) });
