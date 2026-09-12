import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "np.theme";

const systemPrefersDark = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-color-scheme: dark)").matches;

const readPreference = (): ThemePreference => {
  const stored = localStorage.getItem(storageKey);
  return stored === "light" || stored === "dark" ? stored : "system";
};

const applyPreference = (preference: ThemePreference) => {
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
};

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    applyPreference(preference);
    if (preference === "system") localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "system" || typeof matchMedia !== "function") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyPreference("system");
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, [preference]);

  return { preference, setPreference };
}
