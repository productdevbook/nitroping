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
.np-root{all:initial;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",ui-sans-serif,system-ui,"Segoe UI",Roboto,sans-serif;color:var(--np-text,#1c1c1e);-webkit-font-smoothing:antialiased;
--np-surface:var(--np-background,#fff);
--np-fill:color-mix(in oklab,var(--np-text,#1c1c1e) 5%,transparent);
--np-fill-strong:color-mix(in oklab,var(--np-text,#1c1c1e) 9%,transparent);
--np-line:color-mix(in oklab,var(--np-text,#1c1c1e) 9%,transparent);
--np-ring:color-mix(in oklab,var(--np-primary,#7c3aed) 20%,transparent);
--np-spring:cubic-bezier(.32,.72,0,1)}
.np-root *{box-sizing:border-box}
.np-button{position:fixed;right:18px;bottom:18px;z-index:2147483647;display:inline-flex;align-items:center;gap:7px;border:0;border-radius:999px;padding:10px 14px;background:var(--np-primary,#7c3aed);color:#fff;font:590 14px/1 inherit;letter-spacing:-.01em;cursor:pointer;box-shadow:0 6px 18px color-mix(in oklab,var(--np-primary,#7c3aed) 30%,transparent);transition:transform .18s var(--np-spring),opacity .18s ease}
.np-button:hover{transform:translateY(-1px)}
.np-button:active{transform:scale(.96)}
.np-button:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-button svg{width:16px;height:16px}
.np-root:has(.np-backdrop) .np-button{opacity:0;transform:translateY(8px);pointer-events:none}
.np-inline{width:100%}
/* Anchored panel: no scrim, grows out of the launcher it belongs to. */
.np-popover{position:fixed;right:18px;bottom:70px;z-index:2147483647;width:min(340px,calc(100vw - 36px));transform-origin:bottom right;animation:np-grow .3s var(--np-spring) both}
.np-popover .np-card{width:100%;max-height:min(74vh,560px)}
.np-backdrop{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:color-mix(in oklab,#0a0a0c 40%,transparent);backdrop-filter:saturate(180%) blur(16px);animation:np-fade .2s ease both}
.np-backdrop.np-side{place-items:stretch;padding:0}
.np-card{position:relative;width:min(100%,400px);max-height:calc(100vh - 48px);overflow:auto;background:color-mix(in oklab,var(--np-surface) 92%,transparent);backdrop-filter:saturate(180%) blur(20px);border:.5px solid var(--np-line);border-radius:20px;padding:16px;box-shadow:0 18px 48px #00000024,0 2px 6px #0000000f;animation:np-pop .28s var(--np-spring) both}
.np-popover .np-card{animation:none}
.np-side .np-card{width:min(100%,380px);height:100%;max-height:none;margin-left:auto;border-radius:22px 0 0 22px;animation:np-slide .3s var(--np-spring) both}
.np-inline .np-card{backdrop-filter:none;background:var(--np-surface);box-shadow:none;animation:none}
.np-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px}
.np-titles{flex:1;min-width:0}
.np-logo{display:block;margin-bottom:8px;border-radius:9px;object-fit:contain}
.np-card h2{margin:0;font:600 15px/1.3 inherit;letter-spacing:-.01em}
.np-card p{margin:2px 0 0;color:var(--np-muted,#6e6e73);font:400 13px/1.4 inherit}
.np-close{display:grid;place-items:center;width:24px;height:24px;flex:none;border:0;border-radius:999px;background:transparent;color:var(--np-muted,#6e6e73);cursor:pointer;transition:background .16s ease,transform .16s ease}
.np-close:hover{background:var(--np-fill)}
.np-close:active{transform:scale(.9)}
.np-close svg{width:12px;height:12px}
.np-grid{display:grid;gap:12px}
.np-field{display:grid;gap:5px}
.np-field-label{font:510 12px/1.2 inherit;color:var(--np-muted,#6e6e73)}
.np-input,.np-select{width:100%;min-height:38px;font:400 15px/1.35 inherit;letter-spacing:-.01em;padding:9px 11px;border:0;border-radius:11px;background:var(--np-fill);color:var(--np-text,#1c1c1e);appearance:none;transition:box-shadow .16s ease,background .16s ease}
.np-select{background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 16px) 17px,calc(100% - 11px) 17px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:32px}
.np-input::placeholder{color:color-mix(in oklab,var(--np-muted,#6e6e73) 60%,transparent)}
.np-input:focus,.np-select:focus{outline:0;background:var(--np-surface);box-shadow:0 0 0 3px var(--np-ring),0 0 0 1px color-mix(in oklab,var(--np-primary,#7c3aed) 40%,transparent)}
.np-textarea{min-height:84px;resize:vertical;line-height:1.45}
.np-segment{display:flex;gap:2px;padding:2px;border-radius:11px;background:var(--np-fill);overflow-x:auto;scrollbar-width:none}
.np-segment::-webkit-scrollbar{display:none}
.np-seg{position:relative;flex:1 0 auto}
.np-seg input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.np-seg span{display:grid;place-items:center;padding:6px 10px;border-radius:9px;font:510 12px/1.2 inherit;color:var(--np-muted,#6e6e73);white-space:nowrap;transition:background .18s var(--np-spring),color .18s ease}
.np-seg input:checked+span{background:var(--np-surface);color:var(--np-text,#1c1c1e);font-weight:590;box-shadow:0 1px 2px #00000016}
.np-seg input:focus-visible+span{box-shadow:0 0 0 3px var(--np-ring)}
.np-file-drop{display:flex;align-items:center;gap:8px;position:relative;min-height:38px;padding:9px 11px;border-radius:11px;background:var(--np-fill);color:var(--np-muted,#6e6e73);font:400 13px/1.2 inherit;cursor:pointer;transition:background .16s ease}
.np-file-drop:hover{background:var(--np-fill-strong)}
.np-file-drop svg{width:15px;height:15px;flex:none}
.np-file-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.np-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.np-field-inline{grid-template-columns:1fr auto;align-items:center}
.np-switch{appearance:none;width:40px;height:24px;flex:none;position:relative;border:0;border-radius:999px;background:var(--np-fill-strong);cursor:pointer;transition:background .2s ease}
.np-switch::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:999px;background:#fff;box-shadow:0 1px 2px #00000026;transition:transform .22s var(--np-spring)}
.np-switch:checked{background:var(--np-primary,#7c3aed)}
.np-switch:checked::after{transform:translateX(16px)}
.np-switch:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-turnstile{margin-top:12px}
.np-actions{display:flex;align-items:center;gap:8px;margin-top:16px}
.np-submit{flex:1;min-height:38px;border:0;border-radius:11px;background:var(--np-primary,#7c3aed);color:#fff;font:590 14px/1 inherit;letter-spacing:-.01em;cursor:pointer;transition:transform .16s var(--np-spring),opacity .16s ease}
.np-submit:active{transform:scale(.98)}
.np-submit:disabled{opacity:.5;cursor:progress;transform:none}
.np-secondary{min-height:38px;padding:0 12px;border:0;border-radius:11px;background:transparent;color:var(--np-muted,#6e6e73);font:510 14px/1 inherit;cursor:pointer;transition:background .16s ease}
.np-secondary:hover{background:var(--np-fill)}
.np-secondary:focus-visible,.np-submit:focus-visible,.np-close:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-error{margin-top:12px;padding:9px 11px;border-radius:11px;background:color-mix(in oklab,#ff3b30 9%,transparent);color:#c9372c;font:500 13px/1.4 inherit}
.np-success{display:grid;justify-items:center;gap:8px;padding:22px 12px 16px;text-align:center;font:400 13px/1.45 inherit;color:var(--np-muted,#6e6e73)}
.np-success-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:color-mix(in oklab,var(--np-primary,#7c3aed) 12%,transparent);color:var(--np-primary,#7c3aed);animation:np-check .42s cubic-bezier(.32,1.35,.4,1) both}
.np-success-icon svg{width:20px;height:20px}
.np-success strong{font:600 15px/1.3 inherit;color:var(--np-text,#1c1c1e)}
.np-success small{font-size:11px;opacity:.7}
@keyframes np-fade{from{opacity:0}to{opacity:1}}
@keyframes np-grow{from{opacity:0;transform:scale(.94) translateY(6px)}to{opacity:1;transform:none}}
@keyframes np-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes np-slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes np-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes np-check{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
@media (max-width:540px){
.np-popover{right:10px;left:10px;bottom:10px;width:auto;transform-origin:bottom center;animation:np-sheet .3s var(--np-spring) both}
.np-popover .np-card{max-height:min(78vh,560px);border-radius:20px;padding-bottom:calc(16px + env(safe-area-inset-bottom))}
.np-backdrop{place-items:end stretch;padding:0}
.np-backdrop .np-card{width:100%;max-height:88vh;border-radius:22px 22px 0 0;padding:18px 16px calc(16px + env(safe-area-inset-bottom));animation:np-sheet .32s var(--np-spring) both}
.np-side .np-card{width:100%;height:auto;margin:0;border-radius:22px 22px 0 0}
.np-button{right:14px;bottom:14px}
}
@media (prefers-color-scheme:dark){
.np-root{color:var(--np-text,#f5f5f7);
--np-surface:var(--np-background,#1c1c1e);
--np-fill:color-mix(in oklab,#fff 9%,transparent);
--np-fill-strong:color-mix(in oklab,#fff 14%,transparent);
--np-line:color-mix(in oklab,#fff 12%,transparent)}
.np-card p,.np-field-label,.np-close,.np-secondary,.np-success,.np-file-drop{color:var(--np-muted,#98989d)}
.np-backdrop{background:color-mix(in oklab,#000 50%,transparent)}
.np-seg input:checked+span{background:color-mix(in oklab,#fff 16%,transparent);box-shadow:none}
}
@media (prefers-reduced-transparency:reduce){
.np-card{background:var(--np-surface);backdrop-filter:none}
.np-backdrop{backdrop-filter:none}
}
@media (prefers-reduced-motion:reduce){
.np-popover,.np-backdrop,.np-card,.np-success-icon{animation:none}
.np-button,.np-submit,.np-seg span,.np-switch::after{transition:none}
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
  card.innerHTML = `<div class="np-header"><div class="np-titles"><h2></h2><p></p></div><button type="button" class="np-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><div class="np-grid"></div>${options.turnstileSiteKey ? '<div class="np-turnstile" aria-live="polite"></div>' : ""}<div class="np-actions"><button class="np-submit">Send feedback</button><button type="button" class="np-secondary">Cancel</button></div>`;
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
  const field = (label: string, control: string) =>
    `<label class="np-field"><span class="np-field-label">${label}</span>${control}</label>`;
  if (fields.includes("type"))
    add(
      `<div class="np-field"><span class="np-field-label">Type</span><div class="np-segment" role="radiogroup" aria-label="Type">${categories
        .map(
          (value, index) =>
            `<label class="np-seg"><input type="radio" name="type" value="${escapeHtml(value)}"${index === 0 ? " checked" : ""} /><span>${labelFor(value)}</span></label>`,
        )
        .join("")}</div></div>`,
    );
  if (fields.includes("category") && options.categoryOptions?.length)
    add(
      field(
        "Category",
        `<select class="np-select" name="categoryId"><option value="">Select a category</option>${options.categoryOptions
          .map(
            (category) =>
              `<option value="${escapeHtml(category.id)}">${labelFor(category.name)}</option>`,
          )
          .join("")}</select>`,
      ),
    );
  if (fields.includes("title"))
    add(
      field(
        "Title",
        `<input class="np-input" name="title" required minlength="3" maxlength="160" placeholder="A short summary" />`,
      ),
    );
  if (fields.includes("description"))
    add(
      field(
        "Description",
        `<textarea class="np-input np-textarea" name="body" required minlength="3" maxlength="20000" placeholder="What happened, and what did you expect?"></textarea>`,
      ),
    );
  if (fields.includes("email"))
    add(
      field(
        "Email",
        `<input class="np-input" type="email" name="email" placeholder="you@example.com (optional)" />`,
      ),
    );
  if (fields.includes("attachment"))
    add(
      `<label class="np-field"><span class="np-field-label">Attachment</span><span class="np-file-drop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.1 12.3 20a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5"/></svg><span class="np-file-name">Choose a file</span><input type="file" name="attachment" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" /></span></label>`,
    );
  for (const custom of options.customFields ?? []) {
    const required = custom.required ? " required" : "";
    if (custom.type === "textarea")
      add(
        field(
          labelFor(custom.label),
          `<textarea class="np-input np-textarea" name="custom_${escapeHtml(custom.id)}" maxlength="2000"${required}></textarea>`,
        ),
      );
    else if (custom.type === "select")
      add(
        field(
          labelFor(custom.label),
          `<select class="np-select" name="custom_${escapeHtml(custom.id)}"${required}><option value="">Select an option</option>${(custom.options ?? [])
            .map(
              (option) =>
                `<option value="${escapeHtml(option)}">${labelFor(option)}</option>`,
            )
            .join("")}</select>`,
        ),
      );
    else if (custom.type === "boolean")
      add(
        `<label class="np-field np-field-inline"><span class="np-field-label">${labelFor(custom.label)}</span><input class="np-switch" type="checkbox" name="custom_${escapeHtml(custom.id)}" value="true"${required} /></label>`,
      );
    else
      add(
        field(
          labelFor(custom.label),
          `<input class="np-input" type="${custom.type === "number" ? "number" : "text"}" name="custom_${escapeHtml(custom.id)}" maxlength="512"${required} />`,
        ),
      );
  }
  const fileInput = card.querySelector<HTMLInputElement>('input[type="file"]');
  const fileName = card.querySelector<HTMLElement>(".np-file-name");
  fileInput?.addEventListener("change", () => {
    if (fileName)
      fileName.textContent = fileInput.files?.[0]?.name ?? "Choose a file";
  });
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
    let launcher: HTMLButtonElement | null = null;
    let panel: HTMLElement | null = null;
    let detach: (() => void) | null = null;

    const close = () => {
      panel?.remove();
      panel = null;
      detach?.();
      detach = null;
      launcher?.setAttribute("aria-expanded", "false");
      launcher?.focus();
    };

    /*
     * The floating mode opens a panel anchored to its own button instead of a
     * modal: the page stays readable and usable, and the surface grows out of
     * the control that summoned it.
     */
    const openPanel = () => {
      const popover = document.createElement("div");
      popover.className = "np-popover";
      popover.setAttribute("role", "dialog");
      popover.setAttribute(
        "aria-label",
        merged.title ?? merged.brandName ?? "Feedback",
      );
      buildForm(merged, client, popover, close);
      root.appendChild(popover);
      panel = popover;
      const onPointerDown = (event: Event) => {
        const target = event.target as Node;
        if (popover.contains(target)) return;
        if (launcher && (target === launcher || launcher.contains(target))) return;
        close();
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") close();
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown);
      detach = () => {
        document.removeEventListener("pointerdown", onPointerDown, true);
        document.removeEventListener("keydown", onKeyDown);
      };
      popover
        .querySelector<HTMLElement>("input, textarea, select")
        ?.focus({ preventScroll: true });
    };

    const openOverlay = () => {
      const backdrop = document.createElement("div");
      backdrop.className = `np-backdrop ${mode === "side-panel" ? "np-side" : ""}`;
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      buildForm(merged, client, backdrop, close);
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop && mode !== "side-panel") close();
      });
      root.appendChild(backdrop);
      panel = backdrop;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") close();
      };
      document.addEventListener("keydown", onKeyDown);
      detach = () => document.removeEventListener("keydown", onKeyDown);
    };

    const toggle = () => {
      if (panel) {
        close();
        return;
      }
      if (mode === "floating") openPanel();
      else openOverlay();
    };

    if (mode === "inline" || mode === "portal") {
      const inlineRoot = document.createElement("div");
      inlineRoot.className = "np-inline";
      buildForm(merged, client, inlineRoot, () => inlineRoot.remove());
      root.appendChild(inlineRoot);
      (host ?? document.body).appendChild(root);
    } else {
      const button = document.createElement("button");
      launcher = button;
      button.type = "button";
      button.className = "np-button";
      const label = merged.buttonLabel ?? "Give feedback";
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span></span>`;
      (button.querySelector("span") as HTMLElement).textContent = label;
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => {
        button.setAttribute("aria-expanded", panel ? "false" : "true");
        toggle();
      });
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
