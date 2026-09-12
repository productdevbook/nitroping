import { useState } from "react";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  PlusIcon,
  SquarePlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MeterBar } from "@/components/MeterBar";
import { navSections } from "@/lib/nav";
import type { View } from "@/lib/nav";
import { initials } from "@/lib/format";
import type { Usage } from "@/lib/types";
import type { Workspace } from "@/hooks/useWorkspace";

export function AppSidebar({
  workspace,
  view,
  onView,
  newCount,
  usage,
}: {
  workspace: Workspace;
  view: View;
  onView: (view: View) => void;
  newCount: number;
  usage: Usage | null;
}) {
  const [projectDialog, setProjectDialog] = useState(false);
  const [workspaceDialog, setWorkspaceDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [firstProjectName, setFirstProjectName] = useState("");
  const [busy, setBusy] = useState(false);

  const { activeOrganization, activeProject, projects, session } = workspace;

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<SidebarMenuButton size="lg" aria-label="Switch project" />}
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-md bg-foreground">
                    <span className="size-2 rounded-full bg-background" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-xs text-muted-foreground">
                      {activeOrganization?.name ?? "Workspace"}
                    </span>
                    <span className="truncate font-medium">
                      {activeProject?.name ?? "Project"}
                    </span>
                  </span>
                  <ChevronsUpDownIcon className="ml-auto text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Projects</DropdownMenuLabel>
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => workspace.selectProject(project.id)}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProjectDialog(true)}>
                    <PlusIcon />
                    New project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setWorkspaceDialog(true)}>
                    <SquarePlusIcon />
                    New workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {navSections.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={view === item.id}
                        tooltip={item.label}
                        onClick={() => onView(item.id)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.id === "inbox" && newCount > 0 && (
                        <SidebarMenuBadge>{newCount}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <div className="grid gap-2 px-2 pb-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{usage?.plan ?? "Free"} plan</span>
              <span className="tabular-nums">
                {usage ? `${usage.feedbackCount}/${usage.feedbackLimit}` : "—"}
              </span>
            </div>
            <MeterBar
              value={usage?.feedbackCount ?? 0}
              max={usage?.feedbackLimit ?? 100}
              label="Monthly feedback usage"
            />
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                    {initials(session?.displayName ?? session?.email ?? "User")}
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">
                      {session?.displayName ?? "Workspace user"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.email ?? "Authenticated user"}
                    </span>
                  </span>
                  <ChevronsUpDownIcon className="ml-auto text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{session?.email ?? "Account"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onView("billing")}>
                    Billing &amp; usage
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<a href="/auth/logout" />}
                    variant="destructive"
                  >
                    <LogOutIcon />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const created = await workspace.createProject(projectName);
              setBusy(false);
              if (created) {
                setProjectName("");
                setProjectDialog(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Projects keep feedback, settings, and keys separate.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="new-project">Project name</FieldLabel>
              <Input
                id="new-project"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Web app"
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProjectDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || projectName.trim().length < 2}>
                {busy ? "Creating…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={workspaceDialog} onOpenChange={setWorkspaceDialog}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const created = await workspace.createOrganizationWorkspace(
                organizationName,
                firstProjectName,
              );
              setBusy(false);
              if (created) {
                setOrganizationName("");
                setFirstProjectName("");
                setWorkspaceDialog(false);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>New workspace</DialogTitle>
              <DialogDescription>
                A workspace owns its own team, billing, and projects.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="new-workspace">Workspace name</FieldLabel>
              <Input
                id="new-workspace"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Acme Studio"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-workspace-project">First project</FieldLabel>
              <Input
                id="new-workspace-project"
                value={firstProjectName}
                onChange={(event) => setFirstProjectName(event.target.value)}
                placeholder="Web app"
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWorkspaceDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  busy ||
                  organizationName.trim().length < 2 ||
                  firstProjectName.trim().length < 2
                }
              >
                {busy ? "Creating…" : "Create workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
