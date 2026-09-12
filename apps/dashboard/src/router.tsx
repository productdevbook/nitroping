import { useEffect } from "react";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { AuthScreen, LoadingScreen } from "@/app/AuthScreen";
import { DashboardShell } from "@/app/DashboardShell";
import { WorkspaceSetup } from "@/app/WorkspaceSetup";
import { WorkspaceProvider, lastProject, useWorkspace } from "@/app/workspace";
import { useTheme } from "@/hooks/useTheme";
import { isUnauthorized } from "@/lib/queries";
import { validateInboxSearch } from "@/routes/inbox-state";
import {
  AuditRoute,
  BillingRoute,
  ChangelogRoute,
  DeveloperRoute,
  InboxRoute,
  InsightsRoute,
  ModerationRoute,
  NotificationsRoute,
  PrivacyRoute,
  RoadmapRoute,
  SettingsRoute,
  TeamRoute,
  WidgetRoute,
} from "@/routes/views";

/*
 * The URL is the dashboard's state: /dashboard/<project>/<view>, with the
 * inbox's filters and open item in the query string. Nothing about where the
 * user is lives in React state any more.
 */
const rootRoute = createRootRoute({
  component: function Root() {
    /* Mounted once, above every route, so the theme survives navigation. */
    useTheme();
    return (
      <WorkspaceProvider>
        <SessionGate />
      </WorkspaceProvider>
    );
  },
});

function SessionGate() {
  const { loading, error } = useWorkspace();
  if (loading) return <LoadingScreen />;
  if (error && isUnauthorized(error)) return <AuthScreen />;
  return <Outlet />;
}

/* /dashboard alone reopens the last project, or asks for the first one. */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Index() {
    const { projects } = useWorkspace();
    const navigate = useNavigate();
    useEffect(() => {
      const target =
        projects.find((project) => project.id === lastProject()) ?? projects[0];
      void navigate(
        target
          ? {
              to: "/$projectId/inbox",
              params: { projectId: target.id },
              search: {},
              replace: true,
            }
          : { to: "/setup", replace: true },
      );
    }, [projects, navigate]);
    return <LoadingScreen />;
  },
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: function Setup() {
    const { organizations, busy, createWorkspace } = useWorkspace();
    return (
      <WorkspaceSetup
        organizations={organizations}
        loading={busy}
        onCreate={async (organizationName, projectName) => {
          await createWorkspace(organizationName, projectName);
        }}
      />
    );
  },
});

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$projectId",
  component: DashboardShell,
});

/* Each view is its own path segment, spelled out so the router can type every
 * link to it. */
const routeTree = rootRoute.addChildren([
  indexRoute,
  setupRoute,
  projectRoute.addChildren([
    createRoute({
      getParentRoute: () => projectRoute,
      path: "inbox",
      validateSearch: validateInboxSearch,
      component: InboxRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "insights",
      component: InsightsRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "moderation",
      component: ModerationRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "roadmap",
      component: RoadmapRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "changelog",
      component: ChangelogRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "audit",
      component: AuditRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "developer",
      component: DeveloperRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "team",
      component: TeamRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "notifications",
      component: NotificationsRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "billing",
      component: BillingRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "widget",
      component: WidgetRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "settings",
      component: SettingsRoute,
    }),
    createRoute({
      getParentRoute: () => projectRoute,
      path: "privacy",
      component: PrivacyRoute,
    }),
  ]),
]);

export const router = createRouter({
  routeTree,
  basepath: "/dashboard",
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
