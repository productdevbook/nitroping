import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import type { Feedback } from "@nitroping/contracts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypeDot } from "@/components/StatusBadge";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError } from "@/lib/notify";

type FeedbackLink = Pick<Feedback, "id" | "title" | "type" | "status">;

export function FeedbackLinks({
  kind,
  itemId,
  projectId,
  credentials,
  feedback,
}: {
  kind: "roadmap" | "changelog";
  itemId: string;
  projectId: string;
  credentials: ApiOptions;
  feedback: Feedback[];
}) {
  const [linked, setLinked] = useState<FeedbackLink[]>([]);
  const [selected, setSelected] = useState("");
  const endpoint = `/dashboard/projects/${encodeURIComponent(projectId)}/${kind}/${encodeURIComponent(itemId)}/feedback`;

  const refresh = async () => {
    try {
      const result = await api<{ items: FeedbackLink[] }>(endpoint, credentials);
      setLinked(result.items);
    } catch (error) {
      notifyError(errorMessage(error, "Unable to load linked feedback"));
    }
  };

  useEffect(() => {
    void refresh();
    // Keyed on the endpoint only, as before: one request per item, not per render.
  }, [endpoint]);

  const available = feedback.filter(
    (item) => !linked.some((entry) => entry.id === item.id),
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Select value={selected} onValueChange={(value) => setSelected(String(value))}>
          <SelectTrigger className="w-full" aria-label={`Link feedback to ${kind}`}>
            <SelectValue>
              {(value) =>
                available.find((item) => item.id === value)?.title ?? "Select feedback…"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {available.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={!selected}
          onClick={async () => {
            try {
              await api(endpoint, {
                ...credentials,
                method: "POST",
                body: JSON.stringify({ feedbackId: selected }),
              });
              setSelected("");
              await refresh();
            } catch (error) {
              notifyError(errorMessage(error, "Unable to link feedback"));
            }
          }}
        >
          Link
        </Button>
      </div>
      {linked.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          {linked.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1.5">
              <TypeDot type={item.type} />
              <span className="min-w-0 flex-1 truncate text-xs">{item.title}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Unlink ${item.title}`}
                onClick={async () => {
                  try {
                    await api(`${endpoint}/${encodeURIComponent(item.id)}`, {
                      ...credentials,
                      method: "DELETE",
                    });
                    await refresh();
                  } catch (error) {
                    notifyError(errorMessage(error, "Unable to unlink feedback"));
                  }
                }}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
