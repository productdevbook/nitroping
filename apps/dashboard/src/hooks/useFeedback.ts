import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { Analytics, FeedbackDetail, FeedbackPriority, Usage } from "@/lib/types";

export type SearchMode = "keyword" | "semantic";

export function useFeedback({
  ready,
  projectId,
  credentials,
  onAuthRequired,
}: {
  ready: boolean;
  projectId: string;
  credentials: ApiOptions;
  onAuthRequired: () => void;
}) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [selected, setSelected] = useState<FeedbackDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("semantic");

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (filter === "all" || item.status === filter) &&
          (typeFilter === "all" || item.type === typeFilter) &&
          (priorityFilter === "all" || item.priority === priorityFilter) &&
          (searchMode === "semantic" ||
            `${item.title} ${item.body} ${item.type}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [items, filter, typeFilter, priorityFilter, query, searchMode],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      setLoading(true);
      try {
        const feedbackQuery = new URLSearchParams({ limit: "50" });
        const useSemanticSearch = searchMode === "semantic" && query.trim().length >= 2;
        if (!useSemanticSearch) {
          if (query.trim()) feedbackQuery.set("q", query.trim());
          if (filter !== "all") feedbackQuery.set("status", filter);
          if (typeFilter !== "all") feedbackQuery.set("type", typeFilter);
          if (priorityFilter !== "all") feedbackQuery.set("priority", priorityFilter);
        }
        const [list, insight, currentUsage] = await Promise.all([
          api<{ items: Feedback[] }>(
            useSemanticSearch
              ? `/dashboard/projects/${encodeURIComponent(projectId)}/feedback/search?projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(query.trim())}&limit=50`
              : `/dashboard/projects/${encodeURIComponent(projectId)}/feedback?projectId=${encodeURIComponent(projectId)}&${feedbackQuery}`,
            credentials,
          ),
          api<Analytics>(
            `/dashboard/projects/${encodeURIComponent(projectId)}/analytics?projectId=${encodeURIComponent(projectId)}`,
            credentials,
          ),
          api<Usage>(
            `/dashboard/projects/${encodeURIComponent(projectId)}/usage?projectId=${encodeURIComponent(projectId)}`,
            credentials,
          ),
        ]);
        setItems(list.items);
        setAnalytics(insight);
        setUsage(currentUsage);
        if (!silent) notifySuccess("Workspace refreshed");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          onAuthRequired();
          return;
        }
        notifyError(errorMessage(error, "Unable to load workspace"));
      } finally {
        setLoading(false);
      }
    },
    [projectId, credentials, query, filter, typeFilter, priorityFilter, searchMode, onAuthRequired],
  );

  useEffect(() => {
    if (ready && projectId) void load(true);
  }, [ready, projectId, query, filter, typeFilter, priorityFilter, searchMode]);

  const replace = (updated: Feedback) => {
    setItems((entries) =>
      entries.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
    setSelected((current) =>
      current?.feedback.id === updated.id ? { ...current, feedback: updated } : current,
    );
  };

  const open = async (item: Feedback) => {
    try {
      setSelected(
        await api<FeedbackDetail>(
          `/dashboard/feedback/${item.id}?projectId=${projectId}`,
          credentials,
        ),
      );
    } catch (error) {
      notifyError(errorMessage(error, "Unable to open feedback"));
    }
  };

  const changeStatus = async (item: Feedback, status: FeedbackStatus) => {
    try {
      replace(
        await api<Feedback>(
          `/dashboard/feedback/${item.id}/status?projectId=${projectId}`,
          { ...credentials, method: "POST", body: JSON.stringify({ status }) },
        ),
      );
      notifySuccess("Status updated");
    } catch (error) {
      notifyError(errorMessage(error, "Status update failed"));
    }
  };

  const changePriority = async (item: Feedback, priority: FeedbackPriority) => {
    try {
      replace(
        await api<Feedback>(`/dashboard/feedback/${item.id}?projectId=${projectId}`, {
          ...credentials,
          method: "PATCH",
          body: JSON.stringify({ priority }),
        }),
      );
      notifySuccess("Priority updated");
    } catch (error) {
      notifyError(errorMessage(error, "Priority update failed"));
    }
  };

  const assign = async (id: string, assigneeUserId: string | null) => {
    try {
      replace(
        await api<Feedback>(`/dashboard/feedback/${id}/assign?projectId=${projectId}`, {
          ...credentials,
          method: "POST",
          body: JSON.stringify({ assigneeUserId }),
        }),
      );
      notifySuccess(assigneeUserId ? "Feedback assigned" : "Assignment cleared");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to assign feedback"));
    }
  };

  const merge = async (id: string, targetFeedbackId: string) => {
    try {
      await api(`/dashboard/feedback/${id}/merge?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ targetFeedbackId }),
      });
      setSelected(null);
      await load(true);
      notifySuccess("Feedback merged");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to merge feedback"));
    }
  };

  const reply = async (id: string, body: string, internal: boolean) => {
    try {
      await api(`/dashboard/feedback/${id}/reply?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ body, internal }),
      });
      const item = items.find((entry) => entry.id === id);
      if (item) await open(item);
      notifySuccess(internal ? "Internal note added" : "Reply sent");
    } catch (error) {
      notifyError(errorMessage(error, "Unable to send reply"));
    }
  };

  return {
    items,
    filtered,
    selected,
    analytics,
    usage,
    loading,
    filter,
    typeFilter,
    priorityFilter,
    query,
    searchMode,
    setFilter,
    setTypeFilter,
    setPriorityFilter,
    setQuery,
    setSearchMode,
    setSelected,
    load,
    open,
    changeStatus,
    changePriority,
    assign,
    merge,
    reply,
    reset: () => {
      setSelected(null);
      setFilter("all");
      setTypeFilter("all");
      setPriorityFilter("all");
      setQuery("");
    },
  };
}

export type FeedbackController = ReturnType<typeof useFeedback>;
