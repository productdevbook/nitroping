import "./main.css";

// The marketing page follows the operating system and reuses the product's
// `.dark` token block rather than declaring a second palette.
if (typeof matchMedia === "function") {
  const query = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => document.documentElement.classList.toggle("dark", query.matches);
  apply();
  query.addEventListener("change", apply);
}

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
