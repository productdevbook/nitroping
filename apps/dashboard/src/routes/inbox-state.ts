import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FeedbackFilters } from "@/lib/queries";

export type InboxSearch = {
  status: string;
  type: string;
  priority: string;
  q: string;
  mode: FeedbackFilters["mode"];
  id: string;
};

export const defaultInboxSearch: InboxSearch = {
  status: "all",
  type: "all",
  priority: "all",
  q: "",
  mode: "semantic",
  id: "",
};

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

/*
 * Search params arrive from a URL anyone can type, so every field is checked
 * and falls back to its default rather than reaching a query key as junk.
 */
export const validateInboxSearch = (
  input: Record<string, unknown>,
): InboxSearch => ({
  status: text(input.status, defaultInboxSearch.status),
  type: text(input.type, defaultInboxSearch.type),
  priority: text(input.priority, defaultInboxSearch.priority),
  q: text(input.q, defaultInboxSearch.q),
  mode: input.mode === "keyword" ? "keyword" : "semantic",
  id: text(input.id, defaultInboxSearch.id),
});

/* The inbox keeps its filters and its open item in the URL: a link restores
 * both, and Back closes the item it opened. */
export function useInboxState() {
  const search = useSearch({ strict: false }) as Partial<InboxSearch>;
  const navigate = useNavigate();
  const current = validateInboxSearch(search as Record<string, unknown>);

  const update = (next: Partial<InboxSearch>, replace: boolean) =>
    void navigate({
      to: ".",
      search: (previous: Record<string, unknown>) => ({
        ...validateInboxSearch(previous),
        ...next,
      }),
      replace,
    });

  return {
    filters: {
      status: current.status,
      type: current.type,
      priority: current.priority,
      query: current.q,
      mode: current.mode,
    } satisfies FeedbackFilters,
    selectedId: current.id,
    /* Filter changes replace the entry: Back should leave the inbox, not walk
     * through every keystroke. */
    setFilters: (next: Partial<FeedbackFilters>) =>
      update(
        {
          ...(next.status === undefined ? {} : { status: next.status }),
          ...(next.type === undefined ? {} : { type: next.type }),
          ...(next.priority === undefined ? {} : { priority: next.priority }),
          ...(next.query === undefined ? {} : { q: next.query }),
          ...(next.mode === undefined ? {} : { mode: next.mode }),
        },
        true,
      ),
    select: (id: string) => update({ id }, false),
  };
}
