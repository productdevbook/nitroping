import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "cn";
import type { RealtimeState } from "@/hooks/useRealtime";
import type { ThemePreference } from "@/hooks/useTheme";
import { useWorkspace } from "@/app/workspace";
import { viewLabel } from "@/lib/nav";
import type { View } from "@/lib/nav";

const realtimeLabel: Record<RealtimeState, string> = {
  live: "Live updates",
  connecting: "Connecting",
  offline: "Reconnecting",
};

const realtimeDot: Record<RealtimeState, string> = {
  live: "bg-tone-success",
  connecting: "bg-tone-warning",
  offline: "bg-muted-foreground",
};

export function AppTopbar({
  view,
  realtime,
  theme,
  onTheme,
}: {
  view: View;
  realtime: RealtimeState;
  theme: ThemePreference;
  onTheme: (value: ThemePreference) => void;
}) {
  const { activeOrganization, activeProject } = useWorkspace();
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-sm sm:gap-1.5">
          <BreadcrumbItem className="hidden sm:inline-flex">
            {activeOrganization?.name ?? "Workspace"}
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden sm:inline-flex" />
          <BreadcrumbItem>{activeProject?.name ?? "Project"}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{viewLabel(view)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <span className="ml-auto flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
        <span className={cn("size-2 rounded-full", realtimeDot[realtime])} />
        <span className="hidden sm:inline">{realtimeLabel[realtime]}</span>
      </span>
      <ThemeToggle preference={theme} onChange={onTheme} />
    </header>
  );
}
