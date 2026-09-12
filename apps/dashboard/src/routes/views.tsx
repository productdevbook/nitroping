import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { AuditView } from "@/features/audit/AuditView";
import { BillingView } from "@/features/billing/BillingView";
import { ChangelogView } from "@/features/changelog/ChangelogView";
import { DeveloperView } from "@/features/developer/DeveloperView";
import { InboxView } from "@/features/inbox/InboxView";
import { InsightsView } from "@/features/insights/InsightsView";
import { ModerationView } from "@/features/moderation/ModerationView";
import { NotificationsView } from "@/features/notifications/NotificationsView";
import { PrivacyView } from "@/features/privacy/PrivacyView";
import { RoadmapView } from "@/features/roadmap/RoadmapView";
import { SettingsView } from "@/features/settings/SettingsView";
import { TeamView } from "@/features/team/TeamView";
import { WidgetView } from "@/features/widget/WidgetView";
import { useWorkspace } from "@/app/workspace";
import { useInboxState } from "@/routes/inbox-state";
import { useFeedbackController } from "@/hooks/useFeedbackController";
import {
  analyticsQuery,
  apiKeysQuery,
  auditQuery,
  billingQuery,
  categoriesQuery,
  changelogQuery,
  customDomainQuery,
  feedbackListQuery,
  keys,
  membersQuery,
  moderationQuery,
  notificationsQuery,
  roadmapQuery,
  settingsQuery,
  usageQuery,
  webhooksQuery,
} from "@/lib/queries";
import { emptyFilters } from "@/lib/queries";

/*
 * One container per route: it reads the project from the workspace, pulls what
 * that screen needs out of the query cache, and hands plain data to the view.
 * Views stay presentational and know nothing about fetching.
 */
const useAsyncRefresh = (key: QueryKey) => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: key });
  };
};

const useRefresh = (key: QueryKey) => {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: key });
};

/* Views that own a draft still set their data directly; that write lands in the
 * cache instead of a second copy in component state. */
const useCacheSetter = <T,>(key: QueryKey) => {
  const queryClient = useQueryClient();
  return (value: T | ((current: T) => T)) =>
    queryClient.setQueryData<T>(key, (current) =>
      typeof value === "function"
        ? (value as (input: T) => T)(current as T)
        : value,
    );
};

export function InboxRoute() {
  const { projectId, credentials, members } = useWorkspace();
  const { filters, setFilters, selectedId, select } = useInboxState();
  const feedback = useFeedbackController({
    projectId,
    credentials,
    filters,
    onFilters: setFilters,
    selectedId,
    onSelect: select,
  });
  return <InboxView feedback={feedback} members={members} />;
}

export function InsightsRoute() {
  const { projectId, credentials } = useWorkspace();
  const analytics = useQuery(analyticsQuery(projectId, credentials));
  const usage = useQuery(usageQuery(projectId, credentials));
  return (
    <InsightsView
      analytics={analytics.data ?? null}
      usage={usage.data ?? null}
      onRefresh={useRefresh(keys.project(projectId))}
    />
  );
}

export function ModerationRoute() {
  const { projectId, credentials } = useWorkspace();
  const moderation = useQuery(moderationQuery(projectId, credentials));
  return (
    <ModerationView
      items={moderation.data ?? []}
      credentials={credentials}
      projectId={projectId}
      onChange={useRefresh(keys.resource(projectId, "moderation"))}
    />
  );
}

export function RoadmapRoute() {
  const { projectId, credentials } = useWorkspace();
  const roadmap = useQuery(roadmapQuery(projectId, credentials));
  const feedback = useQuery(
    feedbackListQuery(projectId, credentials, emptyFilters),
  );
  return (
    <RoadmapView
      items={roadmap.data ?? []}
      credentials={credentials}
      projectId={projectId}
      feedback={feedback.data ?? []}
      onChange={useRefresh(keys.resource(projectId, "roadmap"))}
    />
  );
}

export function ChangelogRoute() {
  const { projectId, credentials } = useWorkspace();
  const changelog = useQuery(changelogQuery(projectId, credentials));
  const feedback = useQuery(
    feedbackListQuery(projectId, credentials, emptyFilters),
  );
  return (
    <ChangelogView
      items={changelog.data ?? []}
      credentials={credentials}
      projectId={projectId}
      feedback={feedback.data ?? []}
      onChange={useRefresh(keys.resource(projectId, "changelog"))}
    />
  );
}

export function AuditRoute() {
  const { projectId, credentials } = useWorkspace();
  const audit = useQuery(auditQuery(projectId, credentials));
  return (
    <AuditView
      items={audit.data ?? []}
      onRefresh={useRefresh(keys.resource(projectId, "audit-logs"))}
    />
  );
}

export function DeveloperRoute() {
  const { projectId, credentials } = useWorkspace();
  const apiKeys = useQuery(apiKeysQuery(projectId, credentials));
  const webhooks = useQuery(webhooksQuery(projectId, credentials));
  const queryClient = useQueryClient();
  return (
    <DeveloperView
      projectId={projectId}
      credentials={credentials}
      apiKeys={apiKeys.data ?? []}
      webhooks={webhooks.data ?? []}
      onRefresh={() => {
        void queryClient.invalidateQueries({
          queryKey: keys.resource(projectId, "api-keys"),
        });
        void queryClient.invalidateQueries({
          queryKey: keys.resource(projectId, "webhooks"),
        });
      }}
    />
  );
}

export function TeamRoute() {
  const { credentials, activeOrganization } = useWorkspace();
  const organizationId = activeOrganization?.id ?? "";
  const members = useQuery(membersQuery(organizationId));
  return (
    <TeamView
      members={members.data ?? []}
      organizationId={organizationId}
      credentials={credentials}
      onRefresh={useRefresh(keys.members(organizationId))}
    />
  );
}

export function NotificationsRoute() {
  const { projectId, credentials } = useWorkspace();
  const notifications = useQuery(notificationsQuery(projectId, credentials));
  return (
    <NotificationsView
      items={notifications.data ?? []}
      credentials={credentials}
      projectId={projectId}
      onChange={useCacheSetter(keys.resource(projectId, "notifications"))}
    />
  );
}

export function BillingRoute() {
  const { projectId, credentials } = useWorkspace();
  const billing = useQuery(billingQuery(projectId, credentials));
  return (
    <BillingView
      billing={billing.data ?? null}
      credentials={credentials}
      projectId={projectId}
      onRefresh={useRefresh(keys.resource(projectId, "billing"))}
    />
  );
}

export function WidgetRoute() {
  const { projectId, publicKey, credentials } = useWorkspace();
  const settings = useQuery(settingsQuery(projectId, credentials));
  const categories = useQuery(categoriesQuery(projectId, credentials));
  return (
    <WidgetView
      settings={settings.data ?? null}
      categories={categories.data ?? []}
      projectId={projectId}
      publicKey={publicKey}
      credentials={credentials}
      onSettings={useCacheSetter(keys.resource(projectId, "settings"))}
      onCategories={useCacheSetter(keys.resource(projectId, "categories"))}
    />
  );
}

export function SettingsRoute() {
  const { projectId, publicKey, credentials } = useWorkspace();
  const settings = useQuery(settingsQuery(projectId, credentials));
  const customDomain = useQuery(customDomainQuery(projectId, credentials));
  return (
    <SettingsView
      settings={settings.data ?? null}
      customDomain={customDomain.data ?? null}
      projectId={projectId}
      publicKey={publicKey}
      credentials={credentials}
      onSettings={useCacheSetter(keys.resource(projectId, "settings"))}
      onCustomDomain={useCacheSetter(keys.resource(projectId, "custom-domain"))}
    />
  );
}

export function PrivacyRoute() {
  const { projectId, credentials } = useWorkspace();
  const settings = useQuery(settingsQuery(projectId, credentials));
  const feedback = useQuery(
    feedbackListQuery(projectId, credentials, emptyFilters),
  );
  return (
    <PrivacyView
      feedback={feedback.data ?? []}
      settings={settings.data ?? null}
      projectId={projectId}
      credentials={credentials}
      onRefresh={useAsyncRefresh(keys.project(projectId))}
    />
  );
}
