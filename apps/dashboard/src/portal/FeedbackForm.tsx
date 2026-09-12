import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { FeedbackType } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  loadTurnstile,
  projectKey,
  request,
} from "@/portal/client";
import type { PortalConfig, TurnstileWidget } from "@/portal/client";

const types: Array<[FeedbackType, string]> = [
  ["suggestion", "Suggestion"],
  ["bug", "Bug report"],
  ["feature_request", "Feature request"],
  ["complaint", "Complaint"],
];

export function FeedbackForm({
  open,
  projectId,
  config,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  projectId: string;
  config: PortalConfig;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [customValues, setCustomValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const turnstileWidgetId = useRef<string>(undefined);
  const turnstileHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const siteKey = config.turnstileSiteKey;
    if (!siteKey || !open) return;
    let disposed = false;
    void loadTurnstile()
      .then((turnstile) => {
        const container = turnstileHost.current;
        // A second render would stack two widgets in the same host, which is
        // what StrictMode's double effect invocation would otherwise cause.
        if (disposed || !turnstile || !container || turnstileWidgetId.current) return;
        turnstileWidgetId.current = turnstile.render(container, {
          sitekey: siteKey,
          action: "feedback",
          callback: setTurnstileToken,
          "expired-callback": () => setTurnstileToken(undefined),
          "error-callback": () => setTurnstileToken(undefined),
        });
      })
      .catch(() => setError("Turnstile could not be loaded. Please try again."));
    return () => {
      disposed = true;
      setTurnstileToken(undefined);
      const widget = (window as Window & { turnstile?: TurnstileWidget }).turnstile;
      if (turnstileWidgetId.current) widget?.reset(turnstileWidgetId.current);
      turnstileWidgetId.current = undefined;
    };
  }, [config.turnstileSiteKey, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (config.turnstileSiteKey && !turnstileToken)
        throw new Error("Please complete the verification challenge.");
      const missing = (config.theme?.customFields ?? []).find(
        (field) =>
          field.required &&
          (customValues[field.id] === undefined || customValues[field.id] === ""),
      );
      if (missing) throw new Error(`Please complete ${missing.label}.`);
      const created = await request<{ id: string }>(
        `/projects/${encodeURIComponent(projectId)}/feedback`,
        {
          method: "POST",
          body: JSON.stringify({
            type,
            title,
            body,
            email: email || undefined,
            categoryId: categoryId || undefined,
            metadata: customValues,
            platform: "web",
            turnstileToken,
          }),
          headers: {
            "content-type": "application/json",
            "idempotency-key": crypto.randomUUID(),
          },
        },
      );
      if (file) {
        const initiated = await request<{ uploadUrl: string }>(
          `/projects/${encodeURIComponent(projectId)}/uploads/initiate`,
          {
            method: "POST",
            body: JSON.stringify({
              feedbackId: created.id,
              contentType: file.type || "application/octet-stream",
              size: file.size,
            }),
            headers: { "content-type": "application/json" },
          },
        );
        const uploadUrl = initiated.uploadUrl.startsWith("http")
          ? initiated.uploadUrl
          : `${location.origin}${initiated.uploadUrl}`;
        const upload = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "content-type": file.type || "application/octet-stream",
            "x-nitroping-project-key": projectKey,
          },
          body: file,
        });
        if (!upload.ok) throw new Error("Attachment upload failed");
      }
      setTitle("");
      setBody("");
      setEmail("");
      setFile(null);
      setCustomValues({});
      onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Share feedback</DialogTitle>
            <DialogDescription>
              Tell us what happened or what you would like to see next.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="portal-type">What kind?</FieldLabel>
            <NativeSelect
              id="portal-type"
              value={type}
              onChange={(event) => setType(event.target.value as FeedbackType)}
            >
              {types.map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          {(config.categories ?? []).length > 0 && (
            <Field>
              <FieldLabel htmlFor="portal-category">Category</FieldLabel>
              <NativeSelect
                id="portal-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <NativeSelectOption value="">Choose a category</NativeSelectOption>
                {config.categories?.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="portal-title">Title</FieldLabel>
            <Input
              id="portal-title"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="portal-body">Details</FieldLabel>
            <Textarea
              id="portal-body"
              required
              minLength={3}
              maxLength={20000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </Field>

          {config.theme?.customFields?.map((field) => (
            <Field key={field.id}>
              <FieldLabel htmlFor={`portal-${field.id}`}>
                {field.label}
                {field.required && " *"}
              </FieldLabel>
              {field.type === "textarea" ? (
                <Textarea
                  id={`portal-${field.id}`}
                  required={field.required}
                  value={String(customValues[field.id] ?? "")}
                  onChange={(event) =>
                    setCustomValues((values) => ({
                      ...values,
                      [field.id]: event.target.value,
                    }))
                  }
                />
              ) : field.type === "select" ? (
                <NativeSelect
                  id={`portal-${field.id}`}
                  required={field.required}
                  value={String(customValues[field.id] ?? "")}
                  onChange={(event) =>
                    setCustomValues((values) => ({
                      ...values,
                      [field.id]: event.target.value,
                    }))
                  }
                >
                  <NativeSelectOption value="">Choose…</NativeSelectOption>
                  {(field.options ?? []).map((option) => (
                    <NativeSelectOption key={option} value={option}>
                      {option}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : field.type === "boolean" ? (
                <Checkbox
                  id={`portal-${field.id}`}
                  checked={customValues[field.id] === true}
                  onCheckedChange={(checked) =>
                    setCustomValues((values) => ({
                      ...values,
                      [field.id]: checked === true,
                    }))
                  }
                />
              ) : (
                <Input
                  id={`portal-${field.id}`}
                  type={field.type === "number" ? "number" : "text"}
                  required={field.required}
                  value={String(customValues[field.id] ?? "")}
                  onChange={(event) =>
                    setCustomValues((values) => ({
                      ...values,
                      [field.id]:
                        field.type === "number"
                          ? Number(event.target.value)
                          : event.target.value,
                    }))
                  }
                />
              )}
            </Field>
          ))}

          <Field>
            <FieldLabel htmlFor="portal-email">Email</FieldLabel>
            <Input
              id="portal-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FieldDescription>Optional, for updates.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="portal-file">Attachment</FieldLabel>
            <Input
              id="portal-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                if (selected && selected.size > 10 * 1024 * 1024) {
                  setError("Attachments cannot exceed 10 MB.");
                  event.currentTarget.value = "";
                  setFile(null);
                  return;
                }
                setError("");
                setFile(selected);
              }}
            />
            <FieldDescription>
              {file ? file.name : "Optional, up to 10 MB."}
            </FieldDescription>
          </Field>

          {config.turnstileSiteKey && <div ref={turnstileHost} aria-live="polite" />}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
