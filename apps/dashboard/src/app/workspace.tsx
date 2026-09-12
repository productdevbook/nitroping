import { createContext, use, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  keys,
  membersQuery,
  organizationsQuery,
  projectsQuery,
  sessionQuery,
} from "@/lib/queries";
import type { Organization, Project } from "@/lib/types";

/* The last project opened, so /dashboard can reopen where the user left. */
const lastProjectStorage = "np.project";

export const rememberProject = (projectId: string) => {
  try {
    localStorage.setItem(lastProjectStorage, projectId);
  } catch {
    // A browser with storage disabled simply starts at the first project.
  }
};

export const lastProject = () => {
  try {
    return localStorage.getItem(lastProjectStorage) ?? "";
  } catch {
    return "";
  }
};

/*
 * Everything the shell needs about "where am I": the project comes from the
 * URL, the rest comes from the query cache. No component fetches these again.
 */
function useWorkspaceValue() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { projectId = "" } = useParams({ strict: false });
  const [busy, setBusy] = useState(false);

  const session = useQuery(sessionQuery);
  const organizations = useQuery(organizationsQuery);
  const projects = useQuery(projectsQuery);

  const projectList = projects.data ?? [];
  const organizationList = organizations.data ?? [];
  const activeProject = projectList.find((project) => project.id === projectId);
  const activeOrganization =
    organizationList.find(
      (organization) => organization.id === activeProject?.organizationId,
    ) ?? organizationList[0];
  const members = useQuery(membersQuery(activeOrganization?.id ?? ""));

  const credentials = useMemo<ApiOptions>(
    () => ({ projectKey: activeProject?.publicKey || undefined }),
    [activeProject?.publicKey],
  );

  const openProject = (project: Project) => {
    rememberProject(project.id);
    void navigate({
      to: "/$projectId/inbox",
      params: { projectId: project.id },
      search: {} as never,
    });
  };

  const createProject = useMutation({
    mutationFn: (name: string) =>
      api<Project>(
        `/dashboard/organizations/${activeOrganization?.id ?? ""}/projects`,
        { method: "POST", body: JSON.stringify({ name: name.trim() }) },
      ),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: keys.projects });
      notifySuccess("Project created");
      openProject(project);
    },
    onError: (error) =>
      notifyError(errorMessage(error, "Unable to create project")),
  });

  const createWorkspace = useMutation({
    mutationFn: async ({
      organizationName,
      projectName,
    }: {
      organizationName: string;
      projectName: string;
    }) => {
      const organization =
        organizationList[0] ??
        (await api<Organization>("/dashboard/organizations", {
          method: "POST",
          body: JSON.stringify({ name: organizationName.trim() }),
        }));
      return api<Project>(
        `/dashboard/organizations/${organization.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: projectName.trim() }) },
      );
    },
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: keys.organizations });
      await queryClient.invalidateQueries({ queryKey: keys.projects });
      notifySuccess("Your workspace is ready");
      openProject(project);
    },
    onError: (error) =>
      notifyError(errorMessage(error, "Workspace setup failed")),
  });

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    session: session.data ?? null,
    organizations: organizationList,
    projects: projectList,
    members: members.data ?? [],
    projectId,
    publicKey: activeProject?.publicKey ?? "",
    credentials,
    activeProject,
    activeOrganization,
    loading: session.isPending || projects.isPending,
    error: session.error ?? projects.error ?? null,
    busy,
    selectProject: (nextProjectId: string) => {
      const next = projectList.find((project) => project.id === nextProjectId);
      if (next) openProject(next);
    },
    createProject: (name: string) =>
      run(() => createProject.mutateAsync(name)),
    createOrganizationWorkspace: (
      organizationName: string,
      projectName: string,
    ) =>
      run(() =>
        createWorkspace.mutateAsync({ organizationName, projectName }),
      ),
    createWorkspace: (organizationName: string, projectName: string) =>
      run(() =>
        createWorkspace.mutateAsync({ organizationName, projectName }),
      ),
  };
}

export type Workspace = ReturnType<typeof useWorkspaceValue>;

const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const value = useWorkspaceValue();
  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}

export function useWorkspace(): Workspace {
  const value = use(WorkspaceContext);
  if (!value)
    throw new Error("useWorkspace must be used inside a WorkspaceProvider");
  return value;
}
