import type { CreateFeedbackInput, Feedback } from "@nitroping/contracts";

export type WidgetMode = "floating" | "modal" | "side-panel" | "inline" | "portal" | "headless";
export type NitroPingOptions = { projectKey: string; apiBaseUrl?: string; mode?: WidgetMode; theme?: "light" | "dark" | "system"; locale?: string };

export type NitroPingClient = {
  feedback: { create(input: CreateFeedbackInput): Promise<Feedback> };
};

const base = (options: NitroPingOptions) => options.apiBaseUrl ?? "https://api.nitroping.com/api/v1";

export const createNitroPingClient = (options: NitroPingOptions): NitroPingClient => ({
  feedback: {
    async create(input) {
      const response = await fetch(`${base(options)}/projects/${encodeURIComponent(options.projectKey)}/feedback`, {
        method: "POST", headers: { "content-type": "application/json", "x-nitroping-project-key": options.projectKey }, body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error((await response.json() as { error?: { message?: string } }).error?.message ?? "NitroPing request failed");
      return await response.json() as Feedback;
    },
  },
});

export const NitroPing = {
  init(options: NitroPingOptions) {
    const client = createNitroPingClient(options);
    if (options.mode !== "headless" && typeof document !== "undefined") {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Geri bildirim";
      button.dataset.nitroping = "trigger";
      button.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;border:0;border-radius:999px;padding:12px 16px;background:#7c3aed;color:#fff;font:600 14px system-ui;cursor:pointer";
      button.addEventListener("click", () => window.dispatchEvent(new CustomEvent("nitroping:open")));
      document.body.appendChild(button);
    }
    return client;
  },
  configure(_options: Partial<NitroPingOptions>) { return this; },
};
