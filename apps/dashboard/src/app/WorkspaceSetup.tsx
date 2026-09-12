import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/lib/types";

export function WorkspaceSetup({
  organizations,
  loading,
  onCreate,
}: {
  organizations: Organization[];
  loading: boolean;
  onCreate: (organizationName: string, projectName: string) => Promise<void>;
}) {
  const existingOrganization = organizations[0];
  const [organizationName, setOrganizationName] = useState(
    existingOrganization?.name ?? "",
  );
  const [projectName, setProjectName] = useState("");
  const disabled =
    loading ||
    !projectName.trim() ||
    (!existingOrganization && !organizationName.trim());

  return (
    <div className="grid min-h-svh place-items-center px-6">
      <form
        className="flex w-[360px] flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) void onCreate(organizationName.trim(), projectName.trim());
        }}
      >
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="grid size-5 place-items-center rounded-md bg-foreground">
            <span className="size-1.5 rounded-full bg-background" />
          </span>
          NitroPing
        </div>
        <div>
          <h1 className="text-lg font-medium tracking-[-0.01em]">
            {existingOrganization ? "Create your first project" : "Create your workspace"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your product to NitroPing and start turning user feedback into
            product momentum.
          </p>
        </div>
        {!existingOrganization && (
          <Field>
            <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
            <Input
              id="organization-name"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Acme Studio"
              autoFocus
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="project-name">Project name</FieldLabel>
          <Input
            id="project-name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Web app"
            autoFocus={Boolean(existingOrganization)}
          />
        </Field>
        <Button type="submit" size="lg" disabled={disabled}>
          {loading ? "Setting up…" : "Create project"}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          You can add more projects and team members later.
        </p>
      </form>
    </div>
  );
}
