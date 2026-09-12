export type PortalCustomField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "boolean";
  required?: boolean;
  options?: string[];
};

export type PortalConfig = {
  theme?: {
    buttonLabel?: string;
    colors?: { primary?: string };
    customFields?: PortalCustomField[];
  };
  categories?: Array<{ id: string; name: string; slug: string }>;
  turnstileSiteKey?: string;
};

export type TurnstileWidget = {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  reset(widgetId?: string): void;
};

export const apiBase = "/api/v1";

const params = new URLSearchParams(location.search);
export const projectId = params.get("projectId") ?? "";
export const projectKey = params.get("projectKey") ?? "";

const headers = { "x-nitroping-project-key": projectKey };

export const request = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body as T;
};

export const relativeTime = (value: string) =>
  new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((new Date(value).getTime() - Date.now()) / 86_400_000),
    "day",
  );

export const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export const loadTurnstile = async (): Promise<TurnstileWidget | null> => {
  if (typeof window === "undefined") return null;
  const globalWindow = window as Window & { turnstile?: TurnstileWidget };
  if (globalWindow.turnstile) return globalWindow.turnstile;
  await new Promise<void>((resolve, reject) => {
    const current = document.querySelector<HTMLScriptElement>(
      "script[data-nitroping-turnstile]",
    );
    if (current) {
      current.addEventListener("load", () => resolve(), { once: true });
      current.addEventListener(
        "error",
        () => reject(new Error("Turnstile failed to load")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.nitropingTurnstile = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Turnstile failed to load")),
      { once: true },
    );
    document.head.appendChild(script);
  });
  return globalWindow.turnstile ?? null;
};
