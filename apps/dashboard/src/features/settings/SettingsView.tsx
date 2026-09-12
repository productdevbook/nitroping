import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { CustomDomain, Settings } from "@/lib/types";
import { useConfirm } from "@/hooks/useConfirm";

export function SettingsView({
  settings,
  customDomain,
  projectId,
  publicKey,
  serverKey,
  credentials,
  onPublicKey,
  onServerKey,
  onSaveConnection,
  onSettings,
  onCustomDomain,
}: {
  settings: Settings | null;
  customDomain: CustomDomain | null;
  projectId: string;
  publicKey: string;
  serverKey: string;
  credentials: ApiOptions;
  onPublicKey: (value: string) => void;
  onServerKey: (value: string) => void;
  onSaveConnection: () => void;
  onSettings: (value: Settings) => void;
  onCustomDomain: (value: CustomDomain | null) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [hostname, setHostname] = useState("");
  const [domainBusy, setDomainBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  useEffect(() => setDraft(settings), [settings]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api<Settings>(
        `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
        { ...credentials, method: "PATCH", body: JSON.stringify(draft) },
      );
      onSettings(updated);
      onSaveConnection();
      notifySuccess("Settings saved");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to save settings"));
    } finally {
      setSaving(false);
    }
  };

  const removeDomain = async () => {
    const confirmed = await confirm({
      title: "Remove this custom domain?",
      description: `${customDomain?.hostname} stops serving your public portal.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;
    setDomainBusy(true);
    try {
      await api(`/dashboard/projects/${projectId}/custom-domain`, {
        ...credentials,
        method: "DELETE",
      });
      onCustomDomain(null);
      notifySuccess("Custom domain removed");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to remove custom domain"));
    } finally {
      setDomainBusy(false);
    }
  };

  const addDomain = async () => {
    setDomainBusy(true);
    try {
      const result = await api<{ domain: CustomDomain }>(
        `/dashboard/projects/${projectId}/custom-domain`,
        { ...credentials, method: "POST", body: JSON.stringify({ hostname }) },
      );
      onCustomDomain(result.domain);
      setHostname("");
      notifySuccess("Custom domain provisioning started");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to configure custom domain"));
    } finally {
      setDomainBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Project settings"
        description="Configure how NitroPing fits into your product and team."
        action={
          <Button onClick={() => void save()} disabled={saving || !draft}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <section className="max-w-[720px]">
        <SectionHeader title="Connection" description="Keys used by the dashboard and SDKs." />
        <div className="grid gap-4 py-4">
          <Field>
            <FieldLabel htmlFor="project-id">Project ID</FieldLabel>
            <Input id="project-id" value={projectId} readOnly aria-readonly="true" />
          </Field>
          <Field>
            <FieldLabel htmlFor="public-key">Public project key</FieldLabel>
            <Input
              id="public-key"
              value={publicKey}
              onChange={(event) => onPublicKey(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="server-key">Server key</FieldLabel>
            <Input
              id="server-key"
              type="password"
              value={serverKey}
              onChange={(event) => onServerKey(event.target.value)}
              placeholder="Required for dashboard API calls"
            />
            <FieldDescription>Development only.</FieldDescription>
          </Field>
          <div>
            <Button variant="outline" onClick={onSaveConnection}>
              Apply connection
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8 max-w-[720px]">
        <SectionHeader
          title="Privacy & data"
          description="Keep control of retention and custom context."
        />
        <div className="grid gap-4 py-4">
          <Field>
            <FieldLabel htmlFor="retention">Retention period</FieldLabel>
            <Input
              id="retention"
              type="number"
              min="1"
              max="3650"
              value={draft?.retentionDays ?? 365}
              onChange={(event) =>
                setDraft(
                  draft ? { ...draft, retentionDays: Number(event.target.value) } : draft,
                )
              }
            />
            <FieldDescription>Days.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="metadata">Allowed metadata fields</FieldLabel>
            <Input
              id="metadata"
              value={draft?.allowedMetadata.join(", ") ?? ""}
              placeholder="appVersion, account.plan"
              onChange={(event) =>
                setDraft(
                  draft
                    ? {
                        ...draft,
                        allowedMetadata: event.target.value
                          .split(/,\s*/)
                          .map((part) => part.trim())
                          .filter(Boolean),
                      }
                    : draft,
                )
              }
            />
            <FieldDescription>Comma separated.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="origins">Allowed widget origins</FieldLabel>
            <Input
              id="origins"
              value={draft?.origins.join(", ") ?? ""}
              placeholder="https://app.example.com"
              onChange={(event) =>
                setDraft(
                  draft
                    ? {
                        ...draft,
                        origins: event.target.value
                          .split(", ")
                          .map((part) => part.trim())
                          .filter(Boolean),
                      }
                    : draft,
                )
              }
            />
          </Field>
        </div>
      </section>

      <section className="mt-8 max-w-[860px]">
        <SectionHeader
          title="Custom domain"
          description="Give your public feedback portal a branded Business-plan domain. Cloudflare provides the DNS validation records."
        />
        {customDomain ? (
          <div className="py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium">{customDomain.hostname}</span>
              <span className="text-muted-foreground">
                {customDomain.status.replaceAll("_", " ")}
              </span>
              <span className="text-muted-foreground">
                SSL: {customDomain.sslStatus?.replaceAll("_", " ") ?? "pending"}
              </span>
            </div>
            {customDomain.validationRecords.length > 0 && (
              <Table className="mt-3">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customDomain.validationRecords.map((record, index) => (
                    <TableRow key={`${record.name ?? "record"}-${index}`}>
                      <TableCell>{record.type ?? "DNS"}</TableCell>
                      <TableCell>
                        <code className="text-xs">{record.name ?? "—"}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{record.value ?? "—"}</code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.status ?? "pending"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Button
              variant="outline"
              className="mt-3 text-destructive"
              disabled={domainBusy}
              onClick={() => void removeDomain()}
            >
              {domainBusy ? "Removing…" : "Remove domain"}
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-wrap items-end gap-2 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              void addDomain();
            }}
          >
            <Field className="w-64">
              <FieldLabel htmlFor="hostname">Hostname</FieldLabel>
              <Input
                id="hostname"
                value={hostname}
                onChange={(event) => setHostname(event.target.value)}
                placeholder="feedback.example.com"
                required
              />
            </Field>
            <Button type="submit" disabled={domainBusy || hostname.trim().length < 4}>
              {domainBusy ? "Provisioning…" : "Add custom domain"}
            </Button>
          </form>
        )}
      </section>
    </>
  );
}
