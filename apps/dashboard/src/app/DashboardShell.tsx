import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/AppSidebar";
import { AppTopbar } from "@/app/AppTopbar";
import { LoadingScreen } from "@/app/AuthScreen";
import { useWorkspace } from "@/app/workspace";
import { useRealtime } from "@/hooks/useRealtime";
import { useTheme } from "@/hooks/useTheme";
import {
  emptyFilters,
  feedbackListQuery,
  keys,
  usageQuery,
} from "@/lib/queries";
import type { View } from "@/lib/nav";

/* The view is whatever the last URL segment says it is. */
const viewFromPath = (pathname: string): View =>
  (pathname.split("/").filter(Boolean).pop() ?? "inbox") as View;

export function DashboardShell() {
  const { projectId, projects, publicKey, credentials, activeProject } =
    useWorkspace();
  const { preference, setPreference } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const feedback = useQuery(
    feedbackListQuery(projectId, credentials, emptyFilters),
  );
  const usage = useQuery(usageQuery(projectId, credentials));

  /*
   * Realtime knows only that this project changed, so it marks the project's
   * queries stale and lets whatever is on screen refetch itself.
   */
  const realtime = useRealtime({
    enabled: projectId.length > 0,
    projectId,
    publicKey,
    onEvent: () =>
      void queryClient.invalidateQueries({ queryKey: keys.project(projectId) }),
  });

  /* A link to a project that is gone (or belongs to another account) falls
   * back to the workspace rather than rendering an empty shell. */
  const missing = projects.length > 0 && !activeProject;
  useEffect(() => {
    if (missing) void navigate({ to: "/", replace: true });
  }, [missing, navigate]);
  if (missing) return <LoadingScreen />;

  return (
    <SidebarProvider>
      <AppSidebar
        view={viewFromPath(pathname)}
        newCount={
          feedback.data?.filter((item) => item.status === "new").length ?? 0
        }
        usage={usage.data ?? null}
      />
      <SidebarInset>
        <AppTopbar
          view={viewFromPath(pathname)}
          realtime={realtime}
          theme={preference}
          onTheme={setPreference}
        />
        <div className="mx-auto w-full max-w-[1280px] p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
