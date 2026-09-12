import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError } from "@/lib/notify";
import type { View } from "@/lib/nav";
import type {
  ApiKeyItem,
  AuditItem,
  Billing,
  Category,
  ChangelogItem,
  CustomDomain,
  MemberItem,
  ModerationItem,
  NotificationPreference,
  RoadmapItem,
  Settings,
  WebhookItem,
} from "@/lib/types";

/*
 * Every view loads its own data when it is opened, exactly as before. Keeping
 * the loaders here means App no longer carries eleven fetch branches.
 */
export function useViewData({
  projectId,
  credentials,
  organizationId,
  onMembers,
}: {
  projectId: string;
  credentials: ApiOptions;
  organizationId: string;
  onMembers: (items: MemberItem[]) => void;
}) {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>([]);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const load = async (view: View) => {
    if (!projectId) return;
    try {
      if (view === "roadmap")
        setRoadmap(
          (
            await api<{ items: RoadmapItem[] }>(
              `/dashboard/projects/${projectId}/roadmap?projectId=${projectId}`,
              credentials,
            )
          ).items,
        );
      if (view === "changelog")
        setChangelog(
          (
            await api<{ items: ChangelogItem[] }>(
              `/dashboard/projects/${projectId}/changelog?projectId=${projectId}`,
              credentials,
            )
          ).items,
        );
      if (view === "moderation")
        setModeration(
          (
            await api<{ items: ModerationItem[] }>(
              `/dashboard/projects/${projectId}/moderation`,
              credentials,
            )
          ).items,
        );
      if (view === "audit")
        setAuditLogs(
          (
            await api<{ items: AuditItem[] }>(
              `/dashboard/projects/${projectId}/audit-logs`,
              credentials,
            )
          ).items,
        );
      if (view === "developer") {
        const [keys, hooks] = await Promise.all([
          api<{ items: ApiKeyItem[] }>(
            `/dashboard/projects/${projectId}/api-keys`,
            credentials,
          ),
          api<{ items: WebhookItem[] }>(
            `/dashboard/projects/${projectId}/webhooks`,
            credentials,
          ),
        ]);
        setApiKeys(keys.items);
        setWebhooks(hooks.items);
      }
      if (view === "team" && organizationId)
        onMembers(
          (
            await api<{ items: MemberItem[] }>(
              `/dashboard/organizations/${organizationId}/members`,
              credentials,
            )
          ).items,
        );
      if (view === "notifications")
        setNotifications(
          (
            await api<{ items: NotificationPreference[] }>(
              `/dashboard/projects/${projectId}/notifications`,
              credentials,
            )
          ).items,
        );
      if (view === "billing")
        setBilling(
          await api<Billing>(
            `/dashboard/billing?projectId=${encodeURIComponent(projectId)}`,
            credentials,
          ),
        );
      if (view === "settings") {
        const [settingsResult, domainResult] = await Promise.all([
          api<Settings>(
            `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
            credentials,
          ),
          api<{ domain: CustomDomain | null }>(
            `/dashboard/projects/${projectId}/custom-domain`,
            credentials,
          ),
        ]);
        setSettings(settingsResult);
        setCustomDomain(domainResult.domain);
      }
      if (view === "privacy")
        setSettings(
          await api<Settings>(
            `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
            credentials,
          ),
        );
      if (view === "widget") {
        const [categoryResult, settingsResult] = await Promise.all([
          api<{ items: Category[] }>(
            `/dashboard/projects/${projectId}/categories`,
            credentials,
          ),
          api<Settings>(
            `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
            credentials,
          ),
        ]);
        setCategories(categoryResult.items);
        setSettings(settingsResult);
      }
    } catch (error) {
      notifyError(errorMessage(error, "Unable to load view"));
    }
  };

  return {
    roadmap,
    changelog,
    moderation,
    auditLogs,
    apiKeys,
    webhooks,
    notifications,
    billing,
    settings,
    customDomain,
    categories,
    setNotifications,
    setSettings,
    setCustomDomain,
    setCategories,
    load,
  };
}

export type ViewData = ReturnType<typeof useViewData>;
