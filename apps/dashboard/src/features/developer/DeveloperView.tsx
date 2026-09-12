import { useState } from "react";
import { RefreshCwIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { ApiKeyItem, WebhookItem } from "@/lib/types";
import { useConfirm } from "@/hooks/useConfirm";

export function DeveloperView({
  projectId,
  credentials,
  apiKeys,
  webhooks,
  onRefresh,
}: {
  projectId: string;
  credentials: ApiOptions;
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  onRefresh: () => void;
}) {
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"public" | "server">("public");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const confirm = useConfirm();

  const createKey = async () => {
    try {
      const created = await api<ApiKeyItem & { key: string }>(
        `/dashboard/projects/${projectId}/api-keys`,
        {
          ...credentials,
          method: "POST",
          body: JSON.stringify({ kind, label: label || `${kind} integration key` }),
        },
      );
      setLabel("");
      setSecret(created.key);
      notifySuccess("API key created");
      onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to create the key"));
    }
  };

  const addWebhook = async () => {
    if (!url.trim()) return;
    try {
      const created = await api<WebhookItem & { secret: string }>(
        `/dashboard/projects/${projectId}/webhooks`,
        {
          ...credentials,
          method: "POST",
          body: JSON.stringify({
            url,
            events: ["feedback.created", "feedback.updated", "feedback.replied"],
          }),
        },
      );
      setUrl("");
      setSecret(created.secret);
      notifySuccess("Webhook added");
      onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to add the webhook"));
    }
  };

  const revokeKey = async (key: ApiKeyItem) => {
    const confirmed = await confirm({
      title: "Revoke this key?",
      description: `${key.label} stops working immediately for every client using it.`,
      confirmLabel: "Revoke",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api(`/dashboard/projects/${projectId}/api-keys/${key.id}`, {
        ...credentials,
        method: "DELETE",
      });
      notifySuccess("Key revoked");
      onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to revoke the key"));
    }
  };

  const disableWebhook = async (hook: WebhookItem) => {
    const confirmed = await confirm({
      title: "Disable this webhook?",
      description: `${hook.url} stops receiving events.`,
      confirmLabel: "Disable",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api(`/dashboard/projects/${projectId}/webhooks/${hook.id}`, {
        ...credentials,
        method: "DELETE",
      });
      notifySuccess("Webhook disabled");
      onRefresh();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to disable the webhook"));
    }
  };

  return (
    <>
      <PageHeader
        title="Developer controls"
        description="Manage project credentials and signed event delivery."
        action={
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCwIcon />
            Refresh
          </Button>
        }
      />

      {secret && (
        <div className="mb-4 flex items-center gap-3 border-l-2 border-tone-warning bg-muted/50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Copy this secret now.</p>
            <code className="block truncate text-[11px] text-muted-foreground">
              {secret}
            </code>
          </div>
          <CopyButton value={secret} />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={() => setSecret(null)}
          >
            <XIcon />
          </Button>
        </div>
      )}

      <section className="max-w-[860px]">
        <SectionHeader
          title="API keys"
          description="Secrets are shown only once when created."
        />
        <form
          className="flex flex-wrap items-center gap-2 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void createKey();
          }}
        >
          <NativeSelect
            value={kind}
            onChange={(event) => setKind(event.target.value as "public" | "server")}
            aria-label="Key kind"
          >
            <NativeSelectOption value="public">Public SDK key</NativeSelectOption>
            <NativeSelectOption value="server">Server key</NativeSelectOption>
          </NativeSelect>
          <Input
            className="w-56"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Key label"
          />
          <Button type="submit">Create key</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.label}</TableCell>
                <TableCell className="text-muted-foreground">{key.kind}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {key.keyPrefix}••••
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {key.revokedAt ? "Revoked" : "Active"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={Boolean(key.revokedAt)}
                    onClick={() => void revokeKey(key)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="mt-8 max-w-[860px]">
        <SectionHeader
          title="Webhooks"
          description="Signed delivery for feedback events."
        />
        <form
          className="flex flex-wrap items-center gap-2 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void addWebhook();
          }}
        >
          <Input
            className="w-80"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://your-app.com/nitroping"
          />
          <Button type="submit" disabled={!url.trim()}>
            Add webhook
          </Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((hook) => (
              <TableRow key={hook.id}>
                <TableCell className="max-w-[320px] truncate font-medium">
                  {hook.url}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {hook.events.length}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {hook.active ? "Active" : "Disabled"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={!hook.active}
                    onClick={() => void disableWebhook(hook)}
                  >
                    Disable
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
