import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import { notifyError } from "@/lib/notify";
import type { NotificationPreference } from "@/lib/types";

export function NotificationsView({
  items,
  credentials,
  projectId,
  onChange,
}: {
  items: NotificationPreference[];
  credentials: ApiOptions;
  projectId: string;
  onChange: (items: NotificationPreference[]) => void;
}) {
  const update = async (eventType: string, enabled: boolean) => {
    try {
      await api(`/dashboard/projects/${projectId}/notifications`, {
        ...credentials,
        method: "PATCH",
        body: JSON.stringify({ eventType, enabled }),
      });
      onChange(
        items.map((item) =>
          item.eventType === eventType ? { ...item, enabled } : item,
        ),
      );
    } catch (error) {
      notifyError(errorMessage(error, "Unable to update the notification"));
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Choose which project events should reach your team inbox."
      />
      <div className="max-w-[720px] divide-y divide-border border-y border-border">
        {items.map((item) => (
          <div
            key={item.eventType}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{statusLabel(item.eventType)}</p>
              <p className="text-xs text-muted-foreground">
                Project activity notification
              </p>
            </div>
            <Switch
              checked={item.enabled}
              onCheckedChange={(checked) => void update(item.eventType, checked)}
              aria-label={statusLabel(item.eventType)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
