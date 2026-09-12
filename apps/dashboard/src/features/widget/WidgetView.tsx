import { useEffect, useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { WidgetCustomField, WidgetCustomFieldType } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
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
import { statusLabel } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { Category, Settings } from "@/lib/types";
import { useConfirm } from "@/hooks/useConfirm";

const modes = [
  ["floating", "Floating button"],
  ["modal", "Modal"],
  ["side-panel", "Side panel"],
  ["inline", "Inline form"],
  ["portal", "Full-page portal"],
  ["headless", "Headless"],
] as const;

const formFields = [
  "type",
  "category",
  "title",
  "description",
  "attachment",
  "email",
];

export function WidgetView({
  settings,
  categories,
  projectId,
  publicKey,
  credentials,
  onSettings,
  onCategories,
}: {
  settings: Settings | null;
  categories: Category[];
  projectId: string;
  publicKey: string;
  credentials: ApiOptions;
  onSettings: (value: Settings) => void;
  onCategories: (value: Category[]) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  useEffect(() => setDraft(settings), [settings]);

  const theme = (draft?.theme ?? {}) as Record<string, unknown>;
  const value = (key: string, fallback: string) =>
    typeof theme[key] === "string" ? String(theme[key]) : fallback;
  const mode = value("mode", "floating");
  const fields = Array.isArray(theme.fields)
    ? theme.fields.filter((field): field is string => typeof field === "string")
    : ["type", "title", "description", "email"];
  const customFields = Array.isArray(theme.customFields)
    ? theme.customFields.filter(
        (field): field is WidgetCustomField =>
          Boolean(field) &&
          typeof field === "object" &&
          typeof (field as WidgetCustomField).id === "string" &&
          typeof (field as WidgetCustomField).label === "string" &&
          typeof (field as WidgetCustomField).type === "string",
      )
    : [];

  const updateTheme = (key: string, next: unknown) =>
    setDraft(draft ? { ...draft, theme: { ...draft.theme, [key]: next } } : draft);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const updated = await api<Settings>(
        `/dashboard/projects/${projectId}/settings?projectId=${projectId}`,
        { ...credentials, method: "PATCH", body: JSON.stringify(draft) },
      );
      onSettings(updated);
      notifySuccess("Widget configuration saved");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to save widget configuration"));
    } finally {
      setSaving(false);
    }
  };

  const addCategory = async () => {
    if (categoryName.trim().length < 2) return;
    try {
      const created = await api<Category>(
        `/dashboard/projects/${projectId}/categories`,
        {
          ...credentials,
          method: "POST",
          body: JSON.stringify({ name: categoryName.trim() }),
        },
      );
      onCategories(
        [...categories, created].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setCategoryName("");
      notifySuccess("Category added");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to add category"));
    }
  };

  const removeCategory = async (category: Category) => {
    const confirmed = await confirm({
      title: `Delete the ${category.name} category?`,
      description: "Existing feedback keeps its other data.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api(
        `/dashboard/projects/${projectId}/categories/${encodeURIComponent(category.id)}`,
        { ...credentials, method: "DELETE" },
      );
      onCategories(categories.filter((item) => item.id !== category.id));
      notifySuccess("Category deleted");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to delete category"));
    }
  };

  const updateCustomField = (id: string, next: Partial<WidgetCustomField>) =>
    updateTheme(
      "customFields",
      customFields.map((field) => (field.id === id ? { ...field, ...next } : field)),
    );

  const snippet = `import { NitroPing } from "@nitroping/web";\n\nNitroPing.init({\n  projectKey: "${publicKey}",\n  mode: "${mode}",\n  theme: "system",\n  brandName: "${value("brandName", "Your feedback")}",\n  colors: { primary: "${value("primary", "#1C1C1E")}" },\n  fields: ${JSON.stringify(fields)},${customFields.length ? `\n  customFields: ${JSON.stringify(customFields)},` : ""}${categories.length ? `\n  categoryOptions: ${JSON.stringify(categories.map((category) => ({ id: category.id, name: category.name })))},` : ""}\n});`;

  return (
    <>
      <PageHeader
        title="Widget builder"
        description="Shape the feedback experience, preview it, and copy the exact Web SDK setup."
        action={
          <Button onClick={() => void save()} disabled={saving || !draft}>
            {saving ? "Saving…" : "Save widget"}
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="max-w-[720px]">
          <SectionHeader
            title="Appearance & behavior"
            description="These settings are stored with the project and can be mirrored in any SDK."
          />
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="widget-mode">Display mode</FieldLabel>
              <NativeSelect
                id="widget-mode"
                value={mode}
                onChange={(event) => updateTheme("mode", event.target.value)}
              >
                {modes.map(([option, label]) => (
                  <NativeSelectOption key={option} value={option}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="widget-primary">Primary</FieldLabel>
                <Input
                  id="widget-primary"
                  type="color"
                  className="h-8 p-1"
                  value={value("primary", "#1C1C1E")}
                  onChange={(event) => updateTheme("primary", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="widget-background">Background</FieldLabel>
                <Input
                  id="widget-background"
                  type="color"
                  className="h-8 p-1"
                  value={value("background", "#FFFFFF")}
                  onChange={(event) => updateTheme("background", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="widget-text">Text</FieldLabel>
                <Input
                  id="widget-text"
                  type="color"
                  className="h-8 p-1"
                  value={value("text", "#181221")}
                  onChange={(event) => updateTheme("text", event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="widget-button">Button label</FieldLabel>
              <Input
                id="widget-button"
                value={value("buttonLabel", "Give feedback")}
                maxLength={40}
                onChange={(event) => updateTheme("buttonLabel", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="widget-brand">Brand name</FieldLabel>
              <Input
                id="widget-brand"
                value={value("brandName", "Your feedback")}
                maxLength={80}
                placeholder="Your product name"
                onChange={(event) => updateTheme("brandName", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="widget-logo">Logo URL (optional)</FieldLabel>
              <Input
                id="widget-logo"
                type="url"
                value={value("logoUrl", "")}
                placeholder="https://cdn.example.com/logo.png"
                onChange={(event) => updateTheme("logoUrl", event.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium">Show “Powered by NitroPing”</p>
                <p className="text-xs text-muted-foreground">
                  Displayed on the success message.
                </p>
              </div>
              <Switch
                checked={theme.showPoweredBy !== false}
                onCheckedChange={(checked) => updateTheme("showPoweredBy", checked)}
                aria-label="Show Powered by NitroPing"
              />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium">
                Form fields
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {formFields.map((field) => (
                  <label key={field} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={fields.includes(field)}
                      onCheckedChange={(checked) =>
                        updateTheme(
                          "fields",
                          checked
                            ? [...fields, field]
                            : fields.filter((entry) => entry !== field),
                        )
                      }
                    />
                    {statusLabel(field)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Live preview" description={mode} />
          <div
            className="mt-4 grid gap-2 rounded-md border border-border p-4"
            style={{
              background: value("background", "#FFFFFF"),
              color: value("text", "#181221"),
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: `color-mix(in oklab, ${value("primary", "#1C1C1E")} 10%, transparent)`,
                  color: value("primary", "#1C1C1E"),
                }}
              >
                Something broke
              </span>
              <span className="text-xs opacity-40">✕</span>
            </div>
            <div className="rounded-xl bg-black/5 px-3 py-4 text-xs opacity-60">
              What happened, and what did you expect?
            </div>
            <div className="rounded-xl bg-black/5 px-3 py-2 text-xs opacity-60">
              Email for updates (optional)
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] opacity-40">⌘↵</span>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: value("primary", "#1C1C1E") }}
              >
                Send
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 max-w-[860px]">
        <SectionHeader
          title="Public categories"
          description="Categories can be passed as category IDs by the Web, iOS, and Android clients."
        />
        <form
          className="flex flex-wrap items-center gap-2 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void addCategory();
          }}
        >
          <Input
            className="w-56"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="e.g. Payments"
          />
          <Button type="submit" disabled={categoryName.trim().length < 2}>
            Add category
          </Button>
        </form>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom categories yet. The built-in feedback types remain available.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => void removeCategory(category)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="mt-8 max-w-[980px]">
        <SectionHeader
          title="Custom fields"
          description="Collect structured context and store it in the approved metadata schema."
          action={
            <Button
              variant="outline"
              disabled={customFields.length >= 20}
              onClick={() =>
                updateTheme("customFields", [
                  ...customFields,
                  {
                    id: `field_${customFields.length + 1}`,
                    label: "New field",
                    type: "text" as WidgetCustomFieldType,
                  },
                ])
              }
            >
              <PlusIcon />
              Add field
            </Button>
          }
        />
        {customFields.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            No custom fields yet. Add one for account, environment, or workflow context.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customFields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input
                                            aria-label="Field ID"
                      value={field.id}
                      onChange={(event) =>
                        updateCustomField(field.id, {
                          id: event.target.value
                            .replace(/[^a-zA-Z0-9_.-]/g, "_")
                            .slice(0, 64),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                                            aria-label="Field label"
                      value={field.label}
                      onChange={(event) =>
                        updateCustomField(field.id, {
                          label: event.target.value.slice(0, 80),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <NativeSelect
                      aria-label="Field type"
                      value={field.type}
                      onChange={(event) =>
                        updateCustomField(field.id, {
                          type: event.target.value as WidgetCustomFieldType,
                        })
                      }
                    >
                      <NativeSelectOption value="text">Text</NativeSelectOption>
                      <NativeSelectOption value="textarea">Long text</NativeSelectOption>
                      <NativeSelectOption value="select">Select</NativeSelectOption>
                      <NativeSelectOption value="number">Number</NativeSelectOption>
                      <NativeSelectOption value="boolean">Boolean</NativeSelectOption>
                    </NativeSelect>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={field.required === true}
                      onCheckedChange={(checked) =>
                        updateCustomField(field.id, { required: checked === true })
                      }
                      aria-label="Required"
                    />
                  </TableCell>
                  <TableCell>
                    {field.type === "select" ? (
                      <Input
                                                aria-label="Select options"
                        placeholder="Option A, Option B"
                        value={(field.options ?? []).join(", ")}
                        onChange={(event) =>
                          updateCustomField(field.id, {
                            options: event.target.value
                              .split(/,\s*/)
                              .map((option) => option.trim())
                              .filter(Boolean)
                              .slice(0, 20),
                          })
                        }
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${field.label}`}
                      className="text-destructive"
                      onClick={() =>
                        updateTheme(
                          "customFields",
                          customFields.filter((entry) => entry.id !== field.id),
                        )
                      }
                    >
                      <TrashIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="mt-8 max-w-[860px]">
        <SectionHeader
          title="Install snippet"
          description="Give this to your developer or use it as a starting point."
          action={<CopyButton value={snippet} />}
        />
        <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs leading-5">
          <code>{snippet}</code>
        </pre>
      </section>
    </>
  );
}
