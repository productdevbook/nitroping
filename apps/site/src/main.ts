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
