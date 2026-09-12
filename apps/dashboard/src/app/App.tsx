import { useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/AppSidebar";
import { AppTopbar } from "@/app/AppTopbar";
import { AuthScreen, LoadingScreen } from "@/app/AuthScreen";
import { WorkspaceSetup } from "@/app/WorkspaceSetup";
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
import { useFeedback } from "@/hooks/useFeedback";
import { useRealtime } from "@/hooks/useRealtime";
import { useTheme } from "@/hooks/useTheme";
import { useViewData } from "@/hooks/useViewData";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { View } from "@/lib/nav";

export function App() {
  const [view, setView] = useState<View>("inbox");
  const { preference, setPreference } = useTheme();

  const workspace = useWorkspace({
    onProjectChange: () => {
      setView("inbox");
      feedback.reset();
    },
  });

  const feedback = useFeedback({
    ready: workspace.ready,
    projectId: workspace.projectId,
    credentials: workspace.credentials,
    onAuthRequired: () => workspace.setAuthRequired(true),
  });

  const viewData = useViewData({
    projectId: workspace.projectId,
    credentials: workspace.credentials,
    organizationId: workspace.activeOrganization?.id ?? "",
    onMembers: workspace.setMembers,
  });

  const realtime = useRealtime({
    enabled: workspace.ready,
    projectId: workspace.projectId,
    publicKey: workspace.publicKey,
    onEvent: () => void feedback.load(true),
  });

  const openView = (next: View) => {
    setView(next);
    void viewData.load(next);
  };

  if (!workspace.ready) return <LoadingScreen />;
  if (workspace.authRequired) return <AuthScreen />;
  if (!workspace.projectId)
    return (
      <WorkspaceSetup
        organizations={workspace.organizations}
        loading={workspace.setupLoading}
        onCreate={workspace.createWorkspace}
      />
    );

  return (
    <SidebarProvider>
      <AppSidebar
        workspace={workspace}
        view={view}
        onView={openView}
        newCount={feedback.items.filter((item) => item.status === "new").length}
        usage={feedback.usage}
      />
      <SidebarInset>
        <AppTopbar
          organizationName={workspace.activeOrganization?.name ?? "Workspace"}
          projectName={workspace.activeProject?.name ?? "Project"}
          view={view}
          realtime={realtime}
          theme={preference}
          onTheme={setPreference}
        />
        <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
          {view === "inbox" && (
            <InboxView feedback={feedback} members={workspace.members} />
          )}
          {view === "insights" && (
            <InsightsView
              analytics={feedback.analytics}
              usage={feedback.usage}
              onRefresh={() => void feedback.load()}
            />
          )}
          {view === "moderation" && (
            <ModerationView
              items={viewData.moderation}
              credentials={workspace.credentials}
              projectId={workspace.projectId}
              onChange={() => void viewData.load("moderation")}
            />
          )}
          {view === "roadmap" && (
            <RoadmapView
              items={viewData.roadmap}
              credentials={workspace.credentials}
              projectId={workspace.projectId}
              feedback={feedback.items}
              onChange={() => void viewData.load("roadmap")}
            />
          )}
          {view === "changelog" && (
            <ChangelogView
              items={viewData.changelog}
              credentials={workspace.credentials}
              projectId={workspace.projectId}
              feedback={feedback.items}
              onChange={() => void viewData.load("changelog")}
            />
          )}
          {view === "audit" && (
            <AuditView
              items={viewData.auditLogs}
              onRefresh={() => void viewData.load("audit")}
            />
          )}
          {view === "developer" && (
            <DeveloperView
              projectId={workspace.projectId}
              credentials={workspace.credentials}
              apiKeys={viewData.apiKeys}
              webhooks={viewData.webhooks}
              onRefresh={() => void viewData.load("developer")}
            />
          )}
          {view === "team" && (
            <TeamView
              members={workspace.members}
              organizationId={workspace.activeOrganization?.id ?? ""}
              credentials={workspace.credentials}
              onRefresh={() => void viewData.load("team")}
            />
          )}
          {view === "notifications" && (
            <NotificationsView
              items={viewData.notifications}
              credentials={workspace.credentials}
              projectId={workspace.projectId}
              onChange={viewData.setNotifications}
            />
          )}
          {view === "billing" && (
            <BillingView
              billing={viewData.billing}
              credentials={workspace.credentials}
              projectId={workspace.projectId}
              onRefresh={() => void viewData.load("billing")}
            />
          )}
          {view === "widget" && (
            <WidgetView
              settings={viewData.settings}
              categories={viewData.categories}
              projectId={workspace.projectId}
              publicKey={workspace.publicKey}
              credentials={workspace.credentials}
              onSettings={viewData.setSettings}
              onCategories={viewData.setCategories}
            />
          )}
          {view === "settings" && (
            <SettingsView
              settings={viewData.settings}
              customDomain={viewData.customDomain}
              projectId={workspace.projectId}
              publicKey={workspace.publicKey}
              serverKey={workspace.serverKey}
              credentials={workspace.credentials}
              onPublicKey={workspace.setPublicKey}
              onServerKey={workspace.setServerKey}
              onSaveConnection={workspace.saveConnection}
              onSettings={viewData.setSettings}
              onCustomDomain={viewData.setCustomDomain}
            />
          )}
          {view === "privacy" && (
            <PrivacyView
              feedback={feedback.items}
              settings={viewData.settings}
              projectId={workspace.projectId}
              credentials={workspace.credentials}
              onRefresh={() => feedback.load(true)}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
