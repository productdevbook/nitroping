import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Feedback, FeedbackStatus } from "@nitroping/contracts";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  analyticsQuery,
  feedbackDetailQuery,
  feedbackListQuery,
  keys,
  usageQuery,
} from "@/lib/queries";
import type { FeedbackFilters } from "@/lib/queries";
import type { FeedbackDetail, FeedbackPriority } from "@/lib/types";

export type SearchMode = FeedbackFilters["mode"];

/*
 * The inbox reads its filters and its open item from the URL, so a link
 * reproduces exactly what the sender was looking at. This controller only
 * translates between that URL state and the query cache; it holds no state of
 * its own.
 */
export function useFeedbackController({
  projectId,
  credentials,
  filters,
  onFilters,
  selectedId,
  onSelect,
}: {
  projectId: string;
  credentials: ApiOptions;
  filters: FeedbackFilters;
  onFilters: (next: Partial<FeedbackFilters>) => void;
  selectedId: string;
  onSelect: (feedbackId: string) => void;
}) {
  const queryClient = useQueryClient();
  const list = useQuery(feedbackListQuery(projectId, credentials, filters));
  const analytics = useQuery(analyticsQuery(projectId, credentials));
  const usage = useQuery(usageQuery(projectId, credentials));
  const detail = useQuery(
    feedbackDetailQuery(projectId, credentials, selectedId),
  );

  const items = list.data ?? [];
  /*
   * Keyword mode filters in the browser as well, so typing narrows the list
   * without waiting for a round trip. Semantic mode is ranked by the server and
   * must not be re-filtered here.
   */
  const filtered = useMemo(
    () =>
      filters.mode === "semantic"
        ? items
        : items.filter((item) =>
            `${item.title} ${item.body} ${item.type}`
              .toLowerCase()
              .includes(filters.query.toLowerCase()),
          ),
    [items, filters.mode, filters.query],
  );

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: keys.project(projectId) });

  const useAction = <Input>(
    run: (input: Input) => Promise<unknown>,
    success: string,
    failure: string,
  ) =>
    useMutation({
      mutationFn: run,
      onSuccess: async () => {
        await refresh();
        notifySuccess(success);
      },
      onError: (error) => notifyError(errorMessage(error, failure)),
    });

  const status = useAction<{ item: Feedback; status: FeedbackStatus }>(
    ({ item, status: next }) =>
      api<Feedback>(
        `/dashboard/feedback/${item.id}/status?projectId=${projectId}`,
        { ...credentials, method: "POST", body: JSON.stringify({ status: next }) },
      ),
    "Status updated",
    "Status update failed",
  );
  const priority = useAction<{ item: Feedback; priority: FeedbackPriority }>(
    ({ item, priority: next }) =>
      api<Feedback>(`/dashboard/feedback/${item.id}?projectId=${projectId}`, {
        ...credentials,
        method: "PATCH",
        body: JSON.stringify({ priority: next }),
      }),
    "Priority updated",
    "Priority update failed",
  );
  const assign = useAction<{ id: string; assigneeUserId: string | null }>(
    ({ id, assigneeUserId }) =>
      api(`/dashboard/feedback/${id}/assign?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ assigneeUserId }),
      }),
    "Assignment updated",
    "Unable to assign feedback",
  );
  const merge = useAction<{ id: string; targetFeedbackId: string }>(
    ({ id, targetFeedbackId }) =>
      api(`/dashboard/feedback/${id}/merge?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ targetFeedbackId }),
      }),
    "Feedback merged",
    "Unable to merge feedback",
  );
  const reply = useAction<{ id: string; body: string; internal: boolean }>(
    ({ id, body, internal }) =>
      api(`/dashboard/feedback/${id}/reply?projectId=${projectId}`, {
        ...credentials,
        method: "POST",
        body: JSON.stringify({ body, internal }),
      }),
    "Reply sent",
    "Unable to send reply",
  );

  return {
    items,
    filtered,
    selected: detail.data ?? null,
    analytics: analytics.data ?? null,
    usage: usage.data ?? null,
    loading: list.isFetching || detail.isFetching,
    filter: filters.status,
    typeFilter: filters.type,
    priorityFilter: filters.priority,
    query: filters.query,
    searchMode: filters.mode,
    setFilter: (status: string) => onFilters({ status }),
    setTypeFilter: (type: string) => onFilters({ type }),
    setPriorityFilter: (value: string) => onFilters({ priority: value }),
    setQuery: (query: string) => onFilters({ query }),
    setSearchMode: (mode: SearchMode) => onFilters({ mode }),
    setSelected: (next: FeedbackDetail | null) =>
      onSelect(next?.feedback.id ?? ""),
    load: () => refresh(),
    open: (item: Feedback) => onSelect(item.id),
    changeStatus: async (item: Feedback, next: FeedbackStatus) => {
      await status.mutateAsync({ item, status: next });
    },
    changePriority: async (item: Feedback, next: FeedbackPriority) => {
      await priority.mutateAsync({ item, priority: next });
    },
    assign: async (id: string, assigneeUserId: string | null) => {
      await assign.mutateAsync({ id, assigneeUserId });
    },
    merge: async (id: string, targetFeedbackId: string) => {
      await merge.mutateAsync({ id, targetFeedbackId });
      onSelect("");
    },
    reply: async (id: string, body: string, internal: boolean) => {
      await reply.mutateAsync({ id, body, internal });
    },
  };
}

export type FeedbackController = ReturnType<typeof useFeedbackController>;
