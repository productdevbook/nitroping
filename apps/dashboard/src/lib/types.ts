import type { Feedback } from "@nitroping/contracts";

export type FeedbackPriority = "low" | "normal" | "high" | "urgent";

export type FeedbackDetail = {
  feedback: Feedback;
  comments: Array<{
    id: string;
    body: string;
    isInternal: number;
    createdAt: string;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
  }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
  attachments?: Array<{
    id: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
    downloadUrl: string;
  }>;
};

export type Analytics = {
  total: number;
  statuses: Array<{ status: string; count: number }>;
  platforms: Array<{ platform: string; count: number }>;
  types: Array<{ type: string; count: number }>;
  volume: Array<{ date: string; count: number }>;
  averageResponseMinutes: number | null;
  averageResolutionMinutes: number | null;
};

export type Usage = {
  plan: string;
  period: string;
  feedbackCount: number;
  feedbackLimit: number;
  attachmentBytes: number;
};

export type Settings = {
  theme: Record<string, unknown>;
  allowedMetadata: string[];
  retentionDays: number;
  origins: string[];
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  publicKey: string;
};

export type ModerationItem = Feedback & {
  feedbackId: string;
  kind: string;
  outcome: string;
  createdAt: string;
};

export type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ApiKeyItem = {
  id: string;
  kind: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
};

export type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  active: number;
  createdAt: string;
};

export type MemberItem = {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
};

export type Session = { userId: string; email: string; displayName: string };

export type NotificationPreference = { eventType: string; enabled: boolean };

export type Billing = {
  plan: string;
  status: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
};

export type CustomDomain = {
  id: string;
  hostname: string;
  status: string;
  sslStatus: string | null;
  validationRecords: Array<{
    type?: string;
    name?: string;
    value?: string;
    status?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Notice = { text: string; error?: boolean };

export type RoadmapItem = Record<string, string>;
export type ChangelogItem = Record<string, string | null>;
