import type { CreateFeedbackInput, Feedback, FeedbackType } from "@nitroping/contracts";

export type WidgetMode = "floating" | "modal" | "side-panel" | "inline" | "portal" | "headless";
export type WidgetField = "type" | "title" | "description" | "attachment" | "email";
export type WidgetColors = { primary?: string; background?: string; text?: string; muted?: string };
export type NitroPingOptions = {
  projectKey: string; apiBaseUrl?: string; mode?: WidgetMode; theme?: "light" | "dark" | "system"; locale?: string;
  target?: string | HTMLElement; buttonLabel?: string; title?: string; description?: string;
  fields?: WidgetField[]; categories?: FeedbackType[]; colors?: WidgetColors;
};
export type NitroPingClient = {
  feedback: { create(input: CreateFeedbackInput, attachments?: File[]): Promise<Feedback> };
  attachments: { upload(feedbackId: string, file: File): Promise<{ attachmentId: string }> };
  followUp: {
    request(feedbackId: string, email: string): Promise<{ accepted: boolean }>;
    get(token: string): Promise<{ feedback: Feedback; comments: Array<{ id: string; body: string; createdAt: string }> }>;
  };
  destroy(): void;
};

const defaultFields: WidgetField[] = ["type", "title", "description", "email"];
const base = (options: NitroPingOptions) => options.apiBaseUrl ?? "https://nitroping.dev/api/v1";
const labelFor = (value: string) => value.replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
let configured: Partial<NitroPingOptions> = {};

const request = async <T>(options: NitroPingOptions, path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers); headers.set("x-nitroping-project-key", options.projectKey);
  if (init.body && !(init.body instanceof Blob) && !(init.body instanceof ArrayBuffer)) headers.set("content-type", "application/json");
  const response = await fetch(`${base(options)}${path}`, { ...init, headers });
  const result = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? "NitroPing request failed");
  return result;
};

const css = `.np-root{all:initial;font-family:system-ui,sans-serif;color:var(--np-text,#181221)}.np-root *{box-sizing:border-box}.np-button{position:fixed;right:20px;bottom:20px;z-index:2147483647;border:0;border-radius:999px;padding:12px 16px;background:var(--np-primary,#7c3aed);color:#fff;font:600 14px system-ui;cursor:pointer;box-shadow:0 8px 30px #0003}.np-inline{width:100%}.np-backdrop{position:fixed;inset:0;z-index:2147483646;background:#120b1b99;display:grid;place-items:center;padding:20px}.np-backdrop.np-side{place-items:stretch;padding:0;background:#120b1b66}.np-card{width:min(100%,520px);max-height:calc(100vh - 40px);overflow:auto;background:var(--np-background,#fff);border-radius:18px;padding:24px;box-shadow:0 20px 80px #0005}.np-side .np-card{width:min(100%,520px);height:100%;max-height:none;margin-left:auto;border-radius:22px 0 0 22px}.np-card h2{margin:0 0 6px;font-size:22px}.np-card p{color:var(--np-muted,#665d70);margin:0 0 18px}.np-grid{display:grid;gap:12px}.np-label{display:grid;gap:6px;font:600 13px system-ui}.np-input,.np-select{font:400 15px system-ui;padding:11px 12px;border:1px solid #ddd5e8;border-radius:10px;background:var(--np-background,#fff);color:var(--np-text,#181221)}.np-textarea{min-height:120px;resize:vertical}.np-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.np-secondary,.np-submit{border:0;border-radius:10px;padding:11px 16px;font:700 14px system-ui;cursor:pointer}.np-secondary{background:#f0ebf6;color:#39284d}.np-submit{background:var(--np-primary,#7c3aed);color:#fff}.np-error{color:#b42318;font-size:13px}.np-success{padding:16px;border-radius:12px;background:#f1ebff;color:#4c1d95;line-height:1.5}.np-close{float:right;border:0;background:transparent;font-size:22px;color:var(--np-muted,#665d70);cursor:pointer}.np-file{font-size:13px}`;

export const createNitroPingClient = (options: NitroPingOptions): NitroPingClient => {
  const upload = async (feedbackId: string, file: File) => {
    if (file.size < 1 || file.size > 10 * 1024 * 1024) throw new Error("Attachments cannot exceed 10 MB");
    const initiated = await request<{ uploadUrl: string; attachmentId: string }>(options, `/projects/${encodeURIComponent(options.projectKey)}/uploads/initiate`, { method: "POST", body: JSON.stringify({ feedbackId, contentType: file.type || "application/octet-stream", size: file.size }) });
    const uploadUrl = initiated.uploadUrl.startsWith("http") ? initiated.uploadUrl : `${base(options).replace(/\/api\/v1\/?$/, "")}${initiated.uploadUrl}`;
    const response = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type || "application/octet-stream", "x-nitroping-project-key": options.projectKey }, body: file });
    if (!response.ok) throw new Error("Attachment upload failed");
    return { attachmentId: initiated.attachmentId };
  };
  return {
    feedback: { async create(input, attachments = []) {
      const created = await request<Feedback>(options, `/projects/${encodeURIComponent(options.projectKey)}/feedback`, { method: "POST", headers: { "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(input) });
      for (const attachment of attachments) await upload(created.id, attachment);
      return created;
    } },
    attachments: { upload }, destroy() {},
    followUp: {
      request: (feedbackId, email) => request<{ accepted: boolean }>(options, `/projects/${encodeURIComponent(options.projectKey)}/follow-up/request`, { method: "POST", body: JSON.stringify({ feedbackId, email }) }),
      get: (token) => request<{ feedback: Feedback; comments: Array<{ id: string; body: string; createdAt: string }> }>(options, `/follow-up/${encodeURIComponent(token)}`),
    },
  };
};

const buildForm = (options: NitroPingOptions, client: NitroPingClient, root: HTMLElement, close: () => void) => {
  const fields = options.fields ?? defaultFields; const categories = options.categories ?? ["complaint", "bug", "suggestion", "feature_request"];
  const card = document.createElement("form"); card.className = "np-card";
  card.innerHTML = `<button type="button" class="np-close" aria-label="Close">×</button><h2></h2><p></p><div class="np-grid"></div><div class="np-actions"><button type="button" class="np-secondary">Cancel</button><button class="np-submit">Submit</button></div>`;
  (card.querySelector("h2") as HTMLElement).textContent = options.title ?? "Your feedback";
  (card.querySelector("p") as HTMLElement).textContent = options.description ?? "Tell us what would make this product better.";
  const grid = card.querySelector(".np-grid")!; const add = (html: string) => grid.insertAdjacentHTML("beforeend", html);
  if (fields.includes("type")) add(`<label class="np-label">Type<select class="np-select" name="type">${categories.map((value) => `<option value="${value}">${labelFor(value)}</option>`).join("")}</select></label>`);
  if (fields.includes("title")) add(`<label class="np-label">Title<input class="np-input" name="title" required minlength="3" maxlength="160" /></label>`);
  if (fields.includes("description")) add(`<label class="np-label">Description<textarea class="np-input np-textarea" name="body" required minlength="3" maxlength="20000"></textarea></label>`);
  if (fields.includes("email")) add(`<label class="np-label">Email (optional)<input class="np-input" type="email" name="email" /></label>`);
  if (fields.includes("attachment")) add(`<label class="np-label">Attachment<input class="np-input np-file" type="file" name="attachment" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" /></label>`);
  card.querySelector(".np-close")?.addEventListener("click", close); card.querySelector(".np-secondary")?.addEventListener("click", close);
  card.addEventListener("submit", async (event) => {
    event.preventDefault(); const submit = card.querySelector<HTMLButtonElement>(".np-submit")!; submit.disabled = true; submit.textContent = "Submitting…";
    const data = Object.fromEntries(new FormData(card).entries()); const file = (card.querySelector<HTMLInputElement>("input[type=file]")?.files ?? [])[0];
    try {
      await client.feedback.create({ type: String(data.type || "suggestion") as FeedbackType, title: String(data.title || "Feedback"), body: String(data.body || ""), email: data.email ? String(data.email) : undefined, locale: options.locale ?? navigator.language, platform: "web" }, file ? [file] : []);
      card.innerHTML = `<div class="np-success"><strong>Thank you!</strong><br />Your feedback has been sent to the team.</div>`; setTimeout(close, 2600);
    } catch (cause) {
      card.querySelector(".np-error")?.remove(); const message = document.createElement("div"); message.className = "np-error"; message.textContent = cause instanceof Error ? cause.message : "Submission failed."; const actions = card.querySelector(".np-actions"); if (actions) card.insertBefore(message, actions); submit.disabled = false; submit.textContent = "Submit";
    }
  });
  root.appendChild(card);
};

export const NitroPing = {
  init(options: NitroPingOptions): NitroPingClient {
    const merged: NitroPingOptions = { ...configured, ...options, colors: { ...configured.colors, ...options.colors } } as NitroPingOptions;
    const client = createNitroPingClient(merged); if (merged.mode === "headless" || typeof document === "undefined") return client;
    const host = typeof merged.target === "string" ? document.querySelector(merged.target) : merged.target; const root = document.createElement("div"); root.className = "np-root";
    const style = document.createElement("style"); style.textContent = css; root.appendChild(style); if (merged.colors) for (const [key, value] of Object.entries(merged.colors)) if (value) root.style.setProperty(`--np-${key}`, value);
    const mode = merged.mode ?? "floating";
    const open = () => { const backdrop = document.createElement("div"); backdrop.className = `np-backdrop ${mode === "side-panel" ? "np-side" : ""}`; backdrop.setAttribute("role", "dialog"); backdrop.setAttribute("aria-modal", "true"); const close = () => backdrop.remove(); buildForm(merged, client, backdrop, close); backdrop.addEventListener("click", (event) => { if (event.target === backdrop && mode !== "side-panel") close(); }); root.appendChild(backdrop); };
    if (mode === "inline" || mode === "portal") { const inlineRoot = document.createElement("div"); inlineRoot.className = "np-inline"; buildForm(merged, client, inlineRoot, () => inlineRoot.remove()); root.appendChild(inlineRoot); (host ?? document.body).appendChild(root); }
    else { const button = document.createElement("button"); button.type = "button"; button.className = "np-button"; button.textContent = merged.buttonLabel ?? "Give feedback"; button.addEventListener("click", open); (host ?? document.body).appendChild(root); if (host) host.appendChild(button); else root.appendChild(button); }
    return { ...client, destroy() { root.remove(); } };
  },
  configure(options: Partial<NitroPingOptions>) { configured = { ...configured, ...options, colors: { ...configured.colors, ...options.colors } }; return this; },
};
