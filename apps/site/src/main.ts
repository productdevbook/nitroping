import "./main.css";

// The marketing page follows the operating system and reuses the product's
// `.dark` token block rather than declaring a second palette.
if (typeof matchMedia === "function") {
  const query = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => document.documentElement.classList.toggle("dark", query.matches);
  apply();
  query.addEventListener("change", apply);
}

/*
 * NitroPing collects its own feedback with the Web SDK it ships. The widget
 * only loads when a project key is provided at build time
 * (VITE_NITROPING_PROJECT_KEY), so a fork or a preview build stays inert.
 */
const projectKey = import.meta.env.VITE_NITROPING_PROJECT_KEY;
if (projectKey)
  void import("@nitroping/web")
    .then(({ NitroPing }) => NitroPing.initAsync({ projectKey, mode: "floating" }))
    .catch(() => {
      // A missing or misconfigured project must never break the page.
    });

/*
 * The roadmap section is NitroPing reading its own public roadmap endpoint —
 * the same one any customer's portal uses. It is additive: if the request
 * fails or the roadmap is empty, the section stays hidden and the static page
 * is unaffected.
 */
type RoadmapItem = { id: string; title: string; body?: string; status: string };
const roadmapColumns: Array<[status: string, label: string]> = [
  ["planned", "Planned"],
  ["in_progress", "In progress"],
  ["completed", "Shipped"],
];

const renderRoadmap = (items: RoadmapItem[]) => {
  const section = document.querySelector<HTMLElement>("[data-roadmap]");
  const columns = document.querySelector<HTMLElement>("[data-roadmap-columns]");
  if (!section || !columns || items.length === 0) return;
  for (const [status, label] of roadmapColumns) {
    const group = items.filter((item) => item.status === status);
    const column = document.createElement("div");
    const heading = document.createElement("h3");
    heading.className = "text-base font-medium";
    heading.textContent = label;
    const count = document.createElement("span");
    count.className = "ml-2 font-mono text-xs text-muted-foreground tabular-nums";
    count.textContent = String(group.length);
    heading.appendChild(count);
    column.appendChild(heading);
    const list = document.createElement("ul");
    list.className = "mt-3 divide-y divide-border border-t border-border";
    for (const item of group) {
      const row = document.createElement("li");
      row.className = "py-3";
      const title = document.createElement("p");
      title.className = "text-sm";
      title.textContent = item.title;
      row.appendChild(title);
      if (item.body) {
        const body = document.createElement("p");
        body.className = "mt-1 text-sm text-muted-foreground";
        body.textContent = item.body;
        row.appendChild(body);
      }
      list.appendChild(row);
    }
    if (group.length === 0) {
      const empty = document.createElement("li");
      empty.className = "py-3 text-sm text-muted-foreground";
      empty.textContent = "Nothing here yet.";
      list.appendChild(empty);
    }
    column.appendChild(list);
    columns.appendChild(column);
  }
  section.hidden = false;
};

if (projectKey)
  void fetch(
    `/api/v1/projects/${encodeURIComponent(projectKey)}/public/roadmap`,
    { headers: { "x-nitroping-project-key": projectKey } },
  )
    .then((response) => (response.ok ? response.json() : null))
    .then((payload: { items?: RoadmapItem[] } | null) => {
      if (Array.isArray(payload?.items)) renderRoadmap(payload.items);
    })
    .catch(() => {
      // A roadmap that cannot be loaded is simply not shown.
    });

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  const label = button.querySelector<HTMLElement>("[data-copy-label]");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy ?? "");
      if (label) label.textContent = "Copied";
    } catch {
      if (label) label.textContent = "Copy failed";
    }
    window.setTimeout(() => {
      if (label) label.textContent = "Copy";
    }, 1600);
  });
}
