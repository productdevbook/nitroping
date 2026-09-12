/*
 * Public surfaces follow the operating system only: no toggle, no storage.
 * They reuse the same `.dark` token block as the dashboard instead of
 * duplicating the palette behind a media query.
 */
export function followSystemTheme() {
  if (typeof matchMedia !== "function") return;
  const query = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => document.documentElement.classList.toggle("dark", query.matches);
  apply();
  query.addEventListener("change", apply);
}
