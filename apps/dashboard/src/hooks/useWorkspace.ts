import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { MemberItem, Organization, Project, Session } from "@/lib/types";

const projectKeyStorage = "np.project";
const publicKeyStorage = "np.public";

export function useWorkspace({ onProjectChange }: { onProjectChange: () => void }) {
  const [ready, setReady] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [projectId, setProjectId] = useState(
    () => localStorage.getItem(projectKeyStorage) ?? "",
  );
  const [publicKey, setPublicKey] = useState(
    () => localStorage.getItem(publicKeyStorage) ?? "",
  );
  const [serverKey, setServerKey] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const credentials = useMemo<ApiOptions>(
    () => ({ projectKey: publicKey || undefined, serverKey: serverKey || undefined }),
    [publicKey, serverKey],
  );
  const activeProject = projects.find((project) => project.id === projectId);
  const activeOrganization =
    organizations.find(
      (organization) => organization.id === activeProject?.organizationId,
    ) ?? organizations[0];

  const rememberProject = useCallback((project: Project) => {
    setProjectId(project.id);
    setPublicKey(project.publicKey);
    localStorage.setItem(projectKeyStorage, project.id);
    localStorage.setItem(publicKeyStorage, project.publicKey);
  }, []);

  const load = useCallback(async () => {
    try {
      const [sessionResult, organizationResult, projectResult] = await Promise.all([
        api<Session>("/dashboard/session"),
        api<{ items: Organization[] }>("/dashboard/organizations"),
        api<{ items: Project[] }>("/dashboard/projects"),
      ]);
      setSession(sessionResult);
      setOrganizations(organizationResult.items);
      setProjects(projectResult.items);
      if (organizationResult.items[0]) {
        try {
          const memberResult = await api<{ items: MemberItem[] }>(
            `/dashboard/organizations/${organizationResult.items[0].id}/members`,
          );
          setMembers(memberResult.items);
        } catch {
          setMembers([]);
        }
      }
      const selectedProject =
        projectResult.items.find((item) => item.id === projectId) ??
        projectResult.items[0];
      if (selectedProject) rememberProject(selectedProject);
      setReady(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthRequired(true);
        setReady(true);
        return;
      }
      notifyError(errorMessage(error, "Unable to load your workspace"));
      setReady(true);
    }
  }, [projectId, rememberProject]);

  useEffect(() => {
    void load();
    // Runs once: later reloads happen through explicit actions.
  }, []);

  const createWorkspace = async (organizationName: string, projectName: string) => {
    setSetupLoading(true);
    try {
      const organization =
        organizations[0] ??
        (await api<Organization>("/dashboard/organizations", {
          method: "POST",
          body: JSON.stringify({ name: organizationName }),
        }));
      if (!organizations.length) setOrganizations([organization]);
      const project = await api<Project & { serverKey?: string }>(
        `/dashboard/organizations/${organization.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: projectName }) },
      );
      setProjects([project]);
      rememberProject(project);
      notifySuccess("Your workspace is ready");
    } catch (error) {
      notifyError(errorMessage(error, "Workspace setup failed"));
    } finally {
      setSetupLoading(false);
    }
  };

  const createProject = async (name: string) => {
    if (!activeOrganization || name.trim().length < 2) return false;
    try {
      const project = await api<Project>(
        `/dashboard/organizations/${activeOrganization.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: name.trim() }) },
      );
      setProjects((items) => [...items, project]);
      rememberProject(project);
      onProjectChange();
      notifySuccess("Project created");
      return true;
    } catch (error) {
      notifyError(errorMessage(error, "Unable to create project"));
      return false;
    }
  };

  const createOrganizationWorkspace = async (
    organizationName: string,
    projectName: string,
  ) => {
    if (organizationName.trim().length < 2 || projectName.trim().length < 2)
      return false;
    try {
      const organization = await api<Organization>("/dashboard/organizations", {
        method: "POST",
        body: JSON.stringify({ name: organizationName.trim() }),
      });
      const project = await api<Project>(
        `/dashboard/organizations/${organization.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: projectName.trim() }) },
      );
      setOrganizations((items) => [...items, organization]);
      setProjects((items) => [...items, project]);
      rememberProject(project);
      onProjectChange();
      notifySuccess("Workspace created");
      return true;
    } catch (error) {
      notifyError(errorMessage(error, "Unable to create workspace"));
      return false;
    }
  };

  const selectProject = (nextProjectId: string) => {
    const nextProject = projects.find((project) => project.id === nextProjectId);
    if (!nextProject) return;
    rememberProject(nextProject);
    onProjectChange();
  };

  const saveConnection = () => {
    localStorage.setItem(projectKeyStorage, projectId);
    localStorage.setItem(publicKeyStorage, publicKey);
  };

  return {
    ready,
    authRequired,
    setAuthRequired,
    session,
    organizations,
    projects,
    members,
    setMembers,
    projectId,
    publicKey,
    serverKey,
    setProjectId,
    setPublicKey,
    setServerKey,
    credentials,
    activeProject,
    activeOrganization,
    setupLoading,
    createWorkspace,
    createProject,
    createOrganizationWorkspace,
    selectProject,
    saveConnection,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
