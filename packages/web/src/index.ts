import type {
  CreateFeedbackInput,
  Feedback,
  FeedbackType,
  WidgetCustomField,
} from "@nitroping/contracts";
export type { WidgetCustomField } from "@nitroping/contracts";

export type WidgetMode =
  "floating" | "modal" | "side-panel" | "inline" | "portal" | "headless";
export type WidgetField =
  "type" | "category" | "title" | "description" | "attachment" | "email";
export type WidgetCategory = { id: string; name: string };
export type WidgetColors = {
  primary?: string;
  background?: string;
  text?: string;
  muted?: string;
};
export type NitroPingPublicConfig = {
  theme: {
    mode?: WidgetMode;
    buttonLabel?: string;
    brandName?: string;
    logoUrl?: string;
    showPoweredBy?: boolean;
    fields?: WidgetField[];
    customFields?: WidgetCustomField[];
    colors?: WidgetColors;
  };
  categories: WidgetCategory[];
  turnstileSiteKey?: string;
};
export type NitroPingOptions = {
  projectKey: string;
  apiBaseUrl?: string;
  mode?: WidgetMode;
  theme?: "light" | "dark" | "system";
  locale?: string;
  target?: string | HTMLElement;
  buttonLabel?: string;
  brandName?: string;
  logoUrl?: string;
  showPoweredBy?: boolean;
  title?: string;
  description?: string;
  fields?: WidgetField[];
  customFields?: WidgetCustomField[];
  categories?: FeedbackType[];
  categoryOptions?: WidgetCategory[];
  colors?: WidgetColors;
  turnstileSiteKey?: string;
};
export type NitroPingClient = {
  feedback: {
    create(input: CreateFeedbackInput, attachments?: File[]): Promise<Feedback>;
  };
  attachments: {
    upload(feedbackId: string, file: File): Promise<{ attachmentId: string }>;
  };
  followUp: {
    request(feedbackId: string, email: string): Promise<{ accepted: boolean }>;
    get(token: string): Promise<{
      feedback: Feedback;
      comments: Array<{ id: string; body: string; createdAt: string }>;
    }>;
    delete(token: string): Promise<{ deleted: boolean; feedbackId: string }>;
  };
  destroy(): void;
};

const defaultFields: WidgetField[] = ["type", "title", "description", "email"];
const base = (options: NitroPingOptions) =>
  options.apiBaseUrl ?? "https://nitroping.dev/api/v1";
const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
const labelFor = (value: string) =>
  escapeHtml(
    value
      .replaceAll("_", " ")
      .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()),
  );
let configured: Partial<NitroPingOptions> = {};

const request = async <T>(
  options: NitroPingOptions,
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("x-nitroping-project-key", options.projectKey);
  if (
    init.body &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof ArrayBuffer)
  )
    headers.set("content-type", "application/json");
  const response = await fetch(`${base(options)}${path}`, { ...init, headers });
  const result = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(result.error?.message ?? "NitroPing request failed");
  return result;
};

export const loadNitroPingConfig = async (
  options: Pick<NitroPingOptions, "projectKey" | "apiBaseUrl">,
): Promise<NitroPingPublicConfig> => {
  const response = await fetch(
    `${options.apiBaseUrl ?? "https://nitroping.dev/api/v1"}/projects/${encodeURIComponent(options.projectKey)}/public/config`,
    { headers: { "x-nitroping-project-key": options.projectKey } },
  );
  const result = (await response
    .json()
    .catch(() => ({}))) as NitroPingPublicConfig & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(
      result.error?.message ?? "NitroPing configuration could not be loaded",
    );
  return {
    theme: result.theme ?? {},
    categories: Array.isArray(result.categories) ? result.categories : [],
    ...(typeof result.turnstileSiteKey === "string"
      ? { turnstileSiteKey: result.turnstileSiteKey }
      : {}),
  };
};

const css = `
.np-root{all:initial;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--np-text,#1d1b20);--np-surface:var(--np-background,#fff);--np-line:color-mix(in oklab,var(--np-text,#1d1b20) 12%,transparent);--np-soft:color-mix(in oklab,var(--np-text,#1d1b20) 5%,transparent);--np-ring:color-mix(in oklab,var(--np-primary,#7c3aed) 35%,transparent)}
.np-root *{box-sizing:border-box}
.np-button{position:fixed;right:20px;bottom:20px;z-index:2147483647;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:12px 18px;background:var(--np-primary,#7c3aed);color:#fff;font:600 14px/1 inherit;cursor:pointer;box-shadow:0 10px 30px color-mix(in oklab,var(--np-primary,#7c3aed) 35%,transparent);transition:transform .18s cubic-bezier(.2,.8,.3,1),box-shadow .18s ease}
.np-button:hover{transform:translateY(-2px);box-shadow:0 16px 38px color-mix(in oklab,var(--np-primary,#7c3aed) 42%,transparent)}
.np-button:active{transform:translateY(0)}
.np-button:focus-visible{outline:3px solid var(--np-ring);outline-offset:3px}
.np-button svg{width:18px;height:18px}
.np-inline{width:100%}
.np-backdrop{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:20px;background:color-mix(in oklab,#0b0a0f 55%,transparent);backdrop-filter:blur(3px);animation:np-fade .18s ease both}
.np-backdrop.np-side{place-items:stretch;padding:0}
.np-card{width:min(100%,520px);max-height:calc(100vh - 40px);overflow:auto;background:var(--np-surface);border-radius:20px;padding:22px;box-shadow:0 24px 70px #0000002e,0 2px 8px #0000001a;animation:np-pop .22s cubic-bezier(.2,.9,.3,1) both}
.np-side .np-card{width:min(100%,460px);height:100%;max-height:none;margin-left:auto;border-radius:24px 0 0 24px;animation:np-slide .24s cubic-bezier(.2,.9,.3,1) both}
.np-inline .np-card{box-shadow:none;border:1px solid var(--np-line);animation:none}
.np-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px}
.np-titles{flex:1;min-width:0}
.np-logo{display:block;margin-bottom:10px;border-radius:10px;object-fit:contain}
.np-card h2{margin:0;font:600 18px/1.3 inherit;letter-spacing:-.01em}
.np-card p{margin:4px 0 0;color:var(--np-muted,#6b6773);font:400 13px/1.5 inherit}
.np-close{display:grid;place-items:center;width:30px;height:30px;flex:none;border:0;border-radius:999px;background:var(--np-soft);color:var(--np-muted,#6b6773);cursor:pointer;transition:background .15s ease,color .15s ease}
.np-close:hover{background:color-mix(in oklab,var(--np-text,#1d1b20) 10%,transparent);color:var(--np-text,#1d1b20)}
.np-close svg{width:14px;height:14px}
.np-grid{display:grid;gap:14px}
.np-label{display:grid;gap:6px;font:600 12px/1.2 inherit;color:var(--np-muted,#6b6773)}
.np-input,.np-select{width:100%;font:400 14px/1.4 inherit;padding:11px 12px;border:1px solid var(--np-line);border-radius:12px;background:var(--np-surface);color:var(--np-text,#1d1b20);transition:border-color .15s ease,box-shadow .15s ease}
.np-input::placeholder{color:color-mix(in oklab,var(--np-muted,#6b6773) 70%,transparent)}
.np-input:focus,.np-select:focus{outline:0;border-color:var(--np-primary,#7c3aed);box-shadow:0 0 0 4px var(--np-ring)}
.np-textarea{min-height:112px;resize:vertical}
.np-file{padding:9px 12px;font-size:13px;color:var(--np-muted,#6b6773)}
.np-turnstile{margin-top:14px}
.np-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
.np-secondary,.np-submit{border:0;border-radius:12px;padding:11px 16px;font:600 14px/1 inherit;cursor:pointer;transition:transform .15s ease,background .15s ease,opacity .15s ease}
.np-secondary{background:var(--np-soft);color:var(--np-text,#1d1b20)}
.np-secondary:hover{background:color-mix(in oklab,var(--np-text,#1d1b20) 10%,transparent)}
.np-submit{background:var(--np-primary,#7c3aed);color:#fff;box-shadow:0 6px 18px color-mix(in oklab,var(--np-primary,#7c3aed) 30%,transparent)}
.np-submit:hover{transform:translateY(-1px)}
.np-submit:disabled{opacity:.6;cursor:progress;transform:none}
.np-secondary:focus-visible,.np-submit:focus-visible,.np-close:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-error{margin-top:14px;padding:10px 12px;border-radius:12px;background:color-mix(in oklab,#e5484d 12%,transparent);color:#b42318;font:500 13px/1.4 inherit}
.np-success{display:grid;justify-items:center;gap:10px;padding:26px 16px;text-align:center;font:400 14px/1.5 inherit;color:var(--np-text,#1d1b20);animation:np-pop .24s cubic-bezier(.2,.9,.3,1) both}
.np-success-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;background:color-mix(in oklab,var(--np-primary,#7c3aed) 14%,transparent);color:var(--np-primary,#7c3aed)}
.np-success-icon svg{width:22px;height:22px}
.np-success strong{font:600 16px/1.3 inherit}
.np-success small{color:var(--np-muted,#6b6773);font-size:11px}
@keyframes np-fade{from{opacity:0}to{opacity:1}}
@keyframes np-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes np-slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes np-sheet{from{transform:translateY(100%)}to{transform:none}}
@media (max-width:520px){
.np-backdrop{place-items:end stretch;padding:0}
.np-card{width:100%;max-height:88vh;border-radius:22px 22px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom));animation:np-sheet .26s cubic-bezier(.2,.9,.3,1) both}
.np-side .np-card{width:100%;height:auto;margin:0;border-radius:22px 22px 0 0}
.np-button{right:16px;bottom:16px}
.np-actions{flex-direction:column-reverse}
.np-secondary,.np-submit{width:100%;padding:13px 16px}
}
@media (prefers-color-scheme:dark){
.np-root{color:var(--np-text,#f2f0f5);--np-surface:var(--np-background,#17161b);--np-line:color-mix(in oklab,#fff 14%,transparent);--np-soft:color-mix(in oklab,#fff 8%,transparent)}
.np-card p,.np-label,.np-close,.np-success small{color:var(--np-muted,#a6a1ae)}
.np-backdrop{background:color-mix(in oklab,#000 65%,transparent)}
}
@media (prefers-reduced-motion:reduce){
.np-backdrop,.np-card,.np-success{animation:none}
.np-button,.np-submit{transition:none}
}
`;

type TurnstileWidget = {
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

const loadTurnstile = async (): Promise<TurnstileWidget | null> => {
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
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
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

export const createNitroPingClient = (
  options: NitroPingOptions,
): NitroPingClient => {
  const upload = async (feedbackId: string, file: File) => {
    if (file.size < 1 || file.size > 10 * 1024 * 1024)
      throw new Error("Attachments cannot exceed 10 MB");
    const initiated = await request<{
      uploadUrl: string;
      attachmentId: string;
    }>(
      options,
      `/projects/${encodeURIComponent(options.projectKey)}/uploads/initiate`,
      {
        method: "POST",
        body: JSON.stringify({
          feedbackId,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      },
    );
    const uploadUrl = initiated.uploadUrl.startsWith("http")
      ? initiated.uploadUrl
      : `${base(options).replace(/\/api\/v1\/?$/, "")}${initiated.uploadUrl}`;
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "content-type": file.type || "application/octet-stream",
        "x-nitroping-project-key": options.projectKey,
      },
      body: file,
    });
    if (!response.ok) throw new Error("Attachment upload failed");
    return { attachmentId: initiated.attachmentId };
  };
  return {
    feedback: {
      async create(input, attachments = []) {
        const created = await request<Feedback>(
          options,
          `/projects/${encodeURIComponent(options.projectKey)}/feedback`,
          {
            method: "POST",
            headers: { "idempotency-key": crypto.randomUUID() },
            body: JSON.stringify(input),
          },
        );
        for (const attachment of attachments)
          await upload(created.id, attachment);
        return created;
      },
    },
    attachments: { upload },
    destroy() {},
    followUp: {
      request: (feedbackId, email) =>
        request<{ accepted: boolean }>(
          options,
          `/projects/${encodeURIComponent(options.projectKey)}/follow-up/request`,
          { method: "POST", body: JSON.stringify({ feedbackId, email }) },
        ),
      get: (token) =>
        request<{
          feedback: Feedback;
          comments: Array<{ id: string; body: string; createdAt: string }>;
        }>(options, `/follow-up/${encodeURIComponent(token)}`),
      delete: (token) =>
        request<{ deleted: boolean; feedbackId: string }>(
          options,
          `/follow-up/${encodeURIComponent(token)}`,
          { method: "DELETE" },
        ),
    },
  };
};

const buildForm = (
  options: NitroPingOptions,
  client: NitroPingClient,
  root: HTMLElement,
  close: () => void,
) => {
  const fields = options.fields ?? defaultFields;
  const categories = options.categories ?? [
    "complaint",
    "bug",
    "suggestion",
    "feature_request",
  ];
  const card = document.createElement("form");
  card.className = "np-card";
  card.innerHTML = `<div class="np-header"><div class="np-titles"><h2></h2><p></p></div><button type="button" class="np-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="np-grid"></div>${options.turnstileSiteKey ? '<div class="np-turnstile" aria-live="polite"></div>' : ""}<div class="np-actions"><button type="button" class="np-secondary">Cancel</button><button class="np-submit">Submit</button></div>`;
  (card.querySelector("h2") as HTMLElement).textContent =
    options.title ?? options.brandName ?? "Your feedback";
  (card.querySelector("p") as HTMLElement).textContent =
    options.description ?? "Tell us what would make this product better.";
  if (options.logoUrl) {
    const logo = document.createElement("img");
    logo.src = options.logoUrl;
    logo.alt = options.brandName ?? "";
    logo.width = 32;
    logo.height = 32;
    logo.className = "np-logo";
    card.querySelector(".np-titles")?.insertAdjacentElement("afterbegin", logo);
  }
  const grid = card.querySelector(".np-grid")!;
  const add = (html: string) => grid.insertAdjacentHTML("beforeend", html);
  if (fields.includes("type"))
    add(
      `<label class="np-label">Type<select class="np-select" name="type">${categories.map((value) => `<option value="${value}">${labelFor(value)}</option>`).join("")}</select></label>`,
    );
  if (fields.includes("category") && options.categoryOptions?.length)
    add(
      `<label class="np-label">Category<select class="np-select" name="categoryId"><option value="">Select a category</option>${options.categoryOptions.map((category) => `<option value="${escapeHtml(category.id)}">${labelFor(category.name)}</option>`).join("")}</select></label>`,
    );
  if (fields.includes("title"))
    add(
      `<label class="np-label">Title<input class="np-input" name="title" required minlength="3" maxlength="160" /></label>`,
    );
  if (fields.includes("description"))
    add(
      `<label class="np-label">Description<textarea class="np-input np-textarea" name="body" required minlength="3" maxlength="20000"></textarea></label>`,
    );
  if (fields.includes("email"))
    add(
      `<label class="np-label">Email (optional)<input class="np-input" type="email" name="email" /></label>`,
    );
  if (fields.includes("attachment"))
    add(
      `<label class="np-label">Attachment<input class="np-input np-file" type="file" name="attachment" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" /></label>`,
    );
  for (const field of options.customFields ?? []) {
    const required = field.required ? " required" : "";
    if (field.type === "textarea")
      add(
        `<label class="np-label">${labelFor(field.label)}<textarea class="np-input np-textarea" name="custom_${escapeHtml(field.id)}" maxlength="2000"${required}></textarea></label>`,
      );
    else if (field.type === "select")
      add(
        `<label class="np-label">${labelFor(field.label)}<select class="np-select" name="custom_${escapeHtml(field.id)}"${required}><option value="">Select an option</option>${(field.options ?? []).map((option) => `<option value="${escapeHtml(option)}">${labelFor(option)}</option>`).join("")}</select></label>`,
      );
    else if (field.type === "boolean")
      add(
        `<label class="np-label"><span>${labelFor(field.label)}</span><input class="np-input" type="checkbox" name="custom_${escapeHtml(field.id)}" value="true"${required} /></label>`,
      );
    else
      add(
        `<label class="np-label">${labelFor(field.label)}<input class="np-input" type="${field.type === "number" ? "number" : "text"}" name="custom_${escapeHtml(field.id)}" maxlength="512"${required} /></label>`,
      );
  }
  let turnstileToken: string | undefined;
  if (options.turnstileSiteKey) {
    const container = card.querySelector<HTMLElement>(".np-turnstile");
    if (container)
      void loadTurnstile()
        .then((turnstile) => {
          if (!turnstile) throw new Error("Turnstile is unavailable");
          turnstile.render(container, {
            sitekey: options.turnstileSiteKey!,
            action: "feedback",
            callback: (token) => {
              turnstileToken = token;
            },
            "expired-callback": () => {
              turnstileToken = undefined;
            },
            "error-callback": () => {
              turnstileToken = undefined;
            },
          });
        })
        .catch(() => {
          turnstileToken = undefined;
        });
  }
  card.querySelector(".np-close")?.addEventListener("click", close);
  card.querySelector(".np-secondary")?.addEventListener("click", close);
  card.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = card.querySelector<HTMLButtonElement>(".np-submit")!;
    submit.disabled = true;
    submit.textContent = "Submitting…";
    const data = Object.fromEntries(new FormData(card).entries());
    const file = (card.querySelector<HTMLInputElement>("input[type=file]")
      ?.files ?? [])[0];
    try {
      const customMetadata = Object.fromEntries(
        (options.customFields ?? [])
          .filter((field) => data[`custom_${field.id}`] !== undefined)
          .map((field) => [
            field.id,
            field.type === "boolean"
              ? data[`custom_${field.id}`] === "true"
              : field.type === "number"
                ? Number(data[`custom_${field.id}`])
                : String(data[`custom_${field.id}`]),
          ]),
      );
      await client.feedback.create(
        {
          type: String(data.type || "suggestion") as FeedbackType,
          categoryId: data.categoryId ? String(data.categoryId) : undefined,
          title: String(data.title || "Feedback"),
          body: String(data.body || ""),
          email: data.email ? String(data.email) : undefined,
          locale: options.locale ?? navigator.language,
          platform: "web",
          metadata: customMetadata,
          turnstileToken,
        },
        file ? [file] : [],
      );
      card.innerHTML = `<div class="np-success"><span class="np-success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span><strong>Thank you!</strong><span>Your feedback has been sent to the team.</span>${options.showPoweredBy === false ? "" : "<small>Powered by NitroPing</small>"}</div>`;
      setTimeout(close, 2600);
    } catch (cause) {
      card.querySelector(".np-error")?.remove();
      const message = document.createElement("div");
      message.className = "np-error";
      message.textContent =
        cause instanceof Error ? cause.message : "Submission failed.";
      const actions = card.querySelector(".np-actions");
      if (actions) card.insertBefore(message, actions);
      submit.disabled = false;
      submit.textContent = "Submit";
    }
  });
  root.appendChild(card);
};

export const NitroPing = {
  init(options: NitroPingOptions): NitroPingClient {
    const merged: NitroPingOptions = {
      ...configured,
      ...options,
      colors: { ...configured.colors, ...options.colors },
    } as NitroPingOptions;
    const client = createNitroPingClient(merged);
    if (merged.mode === "headless" || typeof document === "undefined")
      return client;
    const host =
      typeof merged.target === "string"
        ? document.querySelector(merged.target)
        : merged.target;
    const root = document.createElement("div");
    root.className = "np-root";
    const style = document.createElement("style");
    style.textContent = css;
    root.appendChild(style);
    if (merged.colors)
      for (const [key, value] of Object.entries(merged.colors))
        if (value) root.style.setProperty(`--np-${key}`, value);
    const mode = merged.mode ?? "floating";
    const open = () => {
      const backdrop = document.createElement("div");
      backdrop.className = `np-backdrop ${mode === "side-panel" ? "np-side" : ""}`;
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      const close = () => backdrop.remove();
      buildForm(merged, client, backdrop, close);
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop && mode !== "side-panel") close();
      });
      root.appendChild(backdrop);
    };
    if (mode === "inline" || mode === "portal") {
      const inlineRoot = document.createElement("div");
      inlineRoot.className = "np-inline";
      buildForm(merged, client, inlineRoot, () => inlineRoot.remove());
      root.appendChild(inlineRoot);
      (host ?? document.body).appendChild(root);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "np-button";
      const label = merged.buttonLabel ?? "Give feedback";
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span></span>`;
      (button.querySelector("span") as HTMLElement).textContent = label;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", open);
      (host ?? document.body).appendChild(root);
      if (host) host.appendChild(button);
      else root.appendChild(button);
    }
    return {
      ...client,
      destroy() {
        root.remove();
      },
    };
  },
  async initAsync(options: NitroPingOptions): Promise<NitroPingClient> {
    const remote = await loadNitroPingConfig(options);
    const theme = remote.theme;
    return this.init({
      ...theme,
      ...options,
      mode: options.mode ?? theme.mode,
      buttonLabel: options.buttonLabel ?? theme.buttonLabel,
      fields: options.fields ?? theme.fields,
      customFields: options.customFields ?? theme.customFields,
      categoryOptions: options.categoryOptions ?? remote.categories,
      colors: { ...theme.colors, ...options.colors },
      turnstileSiteKey: options.turnstileSiteKey ?? remote.turnstileSiteKey,
    });
  },
  configure(options: Partial<NitroPingOptions>) {
    configured = {
      ...configured,
      ...options,
      colors: { ...configured.colors, ...options.colors },
    };
    return this;
  },
};
