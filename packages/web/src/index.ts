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
/* What the API accepts: it sniffs magic bytes, so the type has to be honest. */
const attachmentTypes =
  /^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/;
const attachmentAccept =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain";
const maxAttachmentBytes = 10 * 1024 * 1024;
const maxAttachments = 4;
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
const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
const labelFor = (value: string) => escapeHtml(titleCase(value));

const icons = {
  bug: "M8 6a4 4 0 0 1 8 0M6 10h12M7 10v6a5 5 0 0 0 10 0v-6M4 14h3M17 14h3",
  idea: "M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.6.6-1 1.3-1 2.1H9c0-.8-.4-1.5-1-2.1A6 6 0 0 1 12 3z",
  alert:
    "M12 9v4M12 17h.01M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3l-7.8-13.5a2 2 0 0 0-3.4 0z",
  plus: "M12 3v18M3 12h18",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  check: "M20 6 9 17l-5-5",
  close: "M6 6l12 12M18 6L6 18",
  back: "M15 5l-7 7 7 7",
  clip: "M21.4 11.1 12.3 20a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5",
  mail: "M4 5h16v14H4zM4 6l8 6 8-6",
};
const drawing = (path: string, width = 2) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;

/*
 * Every feedback type is one tile on the first step: an icon, a sentence a
 * person would actually say instead of the taxonomy word, and the prompt the
 * writing box opens with once that tile is picked.
 */
type TypeMeta = { label: string; icon: string; prompt: string };
const typeMeta: Record<string, TypeMeta> = {
  bug: {
    label: "Something broke",
    icon: icons.bug,
    prompt: "What happened, and what did you expect?",
  },
  complaint: {
    label: "Something annoys me",
    icon: icons.alert,
    prompt: "What is getting in your way?",
  },
  suggestion: {
    label: "I have an idea",
    icon: icons.idea,
    prompt: "What would make this better?",
  },
  feature_request: {
    label: "Missing feature",
    icon: icons.plus,
    prompt: "What is missing?",
  },
};
/* The ⌘ glyph is missing from most non-Apple font stacks. */
const sendHint = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘↵"
    : "Ctrl ↵";
const metaFor = (value: string): TypeMeta =>
  typeMeta[value] ?? {
    label: titleCase(value),
    icon: icons.message,
    prompt: "Tell us more…",
  };

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
/*
 * Light is the base palette; dark restates the same tokens and nothing else,
 * so a surface only has to be described once. The scheme follows the operating
 * system unless the host pins one with theme: "light" | "dark", which lands on
 * the root as data-np-theme.
 */
.np-root{all:initial;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",ui-sans-serif,system-ui,"Segoe UI",Roboto,sans-serif;color:var(--np-fg);-webkit-font-smoothing:antialiased;
--np-fg:var(--np-text,#1c1c1e);
--np-dim:var(--np-muted,#6e6e73);
--np-soft:var(--np-muted,#48484a);
--np-faint:var(--np-muted,#a1a1a6);
--np-accent:var(--np-primary,#1c1c1e);
--np-on-accent:#fff;
--np-surface:var(--np-background,#fff);
--np-fill:color-mix(in oklab,var(--np-fg) 5%,transparent);
--np-fill-strong:color-mix(in oklab,var(--np-fg) 9%,transparent);
--np-line:color-mix(in oklab,var(--np-fg) 9%,transparent);
--np-tint:color-mix(in oklab,var(--np-accent) 10%,transparent);
--np-edge:color-mix(in oklab,var(--np-accent) 34%,transparent);
--np-ring:color-mix(in oklab,var(--np-accent) 20%,transparent);
--np-scrim:color-mix(in oklab,#0a0a0c 40%,transparent);
--np-danger:color-mix(in oklab,#ff3b30 9%,transparent);
--np-on-danger:#c9372c;
--np-shadow:0 18px 48px #0000001a,0 2px 6px #0000000d;
--np-lift:0 4px 14px #00000014,0 1px 2px #0000000f;
--np-spring:cubic-bezier(.32,.72,0,1)}
.np-root *{box-sizing:border-box}
.np-root [hidden]{display:none!important}
/* Launcher: a quiet circle. The accent only reaches the glyph inside it. */
.np-button{position:fixed;right:18px;bottom:18px;z-index:2147483647;display:grid;place-items:center;width:40px;height:40px;padding:0;border:.5px solid var(--np-line);border-radius:999px;background:var(--np-surface);color:var(--np-accent);cursor:pointer;box-shadow:var(--np-lift);transition:transform .18s var(--np-spring),box-shadow .18s ease,opacity .18s ease}
.np-button:hover{transform:translateY(-1px);box-shadow:0 8px 20px #0000001f}
.np-button:active{transform:scale(.94)}
.np-button:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-button svg{width:17px;height:17px}
.np-root:has(.np-backdrop) .np-button{opacity:0;transform:translateY(8px);pointer-events:none}
.np-inline{width:100%}
/* Anchored panel: no scrim, grows out of the launcher it belongs to. */
.np-popover{position:fixed;right:18px;bottom:70px;z-index:2147483647;width:min(340px,calc(100vw - 36px));transform-origin:bottom right;animation:np-grow .3s var(--np-spring) both}
.np-popover .np-card{width:100%}
.np-backdrop{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:var(--np-scrim);backdrop-filter:saturate(180%) blur(16px);animation:np-fade .2s ease both}
.np-backdrop.np-side{place-items:stretch;padding:0}
.np-card{position:relative;width:min(100%,340px);max-height:min(78vh,620px);overflow:auto;background:var(--np-surface);border:.5px solid var(--np-line);border-radius:20px;padding:14px;box-shadow:var(--np-shadow)}
.np-backdrop .np-card{animation:np-pop .28s var(--np-spring) both}
.np-side .np-card{width:min(100%,360px);height:100%;max-height:none;margin-left:auto;border-radius:22px 0 0 22px;animation:np-slide .3s var(--np-spring) both}
.np-inline .np-card{box-shadow:none}
.np-step{display:flex;flex-direction:column;gap:14px;animation:np-step .26s var(--np-spring) both}
.np-compose{gap:12px}
.np-bar{display:flex;align-items:center;justify-content:space-between;gap:10px}
.np-bar-l{display:flex;align-items:center;gap:8px;min-width:0}
.np-dots{display:flex;align-items:center;gap:5px}
.np-dot{display:block;width:6px;height:3px;border-radius:999px;background:var(--np-fill-strong)}
.np-dot-on{width:14px;background:var(--np-accent)}
.np-x,.np-back{display:grid;place-items:center;width:22px;height:22px;flex:none;padding:0;border:0;border-radius:999px;background:transparent;color:var(--np-dim);cursor:pointer;transition:background .16s ease,transform .16s ease}
.np-x:hover,.np-back:hover{background:var(--np-fill)}
.np-x:active,.np-back:active{transform:scale(.9)}
.np-x svg{width:11px;height:11px}
.np-back svg{width:12px;height:12px}
.np-logo{display:block;width:20px;height:20px;flex:none;border-radius:6px;object-fit:contain}
.np-ask{margin:0;font:600 17px/1.25 inherit;letter-spacing:-.02em;color:var(--np-fg)}
.np-ask-sm{font-size:15px;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.np-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.np-tile{display:flex;flex-direction:column;justify-content:space-between;gap:14px;min-height:84px;padding:12px;border:1.5px solid transparent;border-radius:16px;background:var(--np-fill);color:var(--np-soft);font:510 14px/1.2 inherit;letter-spacing:-.01em;text-align:left;cursor:pointer;transition:background .18s var(--np-spring),color .18s ease,border-color .18s ease,transform .18s var(--np-spring)}
.np-tile svg{width:20px;height:20px}
.np-tile:hover{background:var(--np-fill-strong)}
.np-tile:active{transform:scale(.98)}
.np-tile[aria-checked="true"]{background:var(--np-tint);border-color:var(--np-edge);color:var(--np-accent);font-weight:590}
.np-tile:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-hint{margin:0;font:400 11px/1.4 inherit;color:var(--np-faint)}
.np-chip{display:inline-flex;align-items:center;gap:6px;min-width:0;padding:4px 9px 4px 7px;border-radius:999px;background:var(--np-tint);color:var(--np-accent);font:590 12px/1.2 inherit}
.np-chip svg{width:13px;height:13px;flex:none}
.np-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.np-box{width:100%;min-height:132px;resize:none;border:0;border-radius:14px;padding:11px 12px;background:var(--np-fill);color:var(--np-fg);font:400 15px/1.5 inherit;letter-spacing:-.01em;transition:box-shadow .16s ease,background .16s ease}
.np-box::placeholder{color:color-mix(in oklab,var(--np-dim) 80%,transparent)}
.np-box:focus{outline:0;box-shadow:0 0 0 3px var(--np-ring)}
.np-mail{display:flex;align-items:center;gap:8px;min-height:36px;padding:0 12px;border-radius:14px;background:var(--np-fill);color:var(--np-faint);transition:box-shadow .16s ease}
.np-mail:focus-within{box-shadow:0 0 0 3px var(--np-ring)}
.np-mail svg{width:14px;height:14px;flex:none}
.np-mail input{flex:1;min-width:0;padding:8px 0;border:0;background:transparent;color:var(--np-fg);font:400 14px/1.2 inherit;letter-spacing:-.01em}
.np-mail input:focus{outline:0}
.np-mail input::placeholder{color:currentColor}
.np-extra{display:grid;gap:8px}
.np-field{display:grid;gap:5px}
.np-field-label{font:510 12px/1.2 inherit;color:var(--np-dim)}
.np-input,.np-select{width:100%;min-height:36px;padding:8px 11px;border:0;border-radius:12px;background:var(--np-fill);color:var(--np-fg);font:400 14px/1.35 inherit;letter-spacing:-.01em;appearance:none;transition:box-shadow .16s ease}
.np-select{background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 16px) 16px,calc(100% - 11px) 16px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:32px}
.np-input:focus,.np-select:focus{outline:0;box-shadow:0 0 0 3px var(--np-ring)}
.np-textarea{min-height:72px;resize:vertical;line-height:1.45}
.np-field-inline{grid-template-columns:1fr auto;align-items:center}
.np-switch{appearance:none;width:40px;height:24px;flex:none;position:relative;border:0;border-radius:999px;background:var(--np-fill-strong);cursor:pointer;transition:background .2s ease}
.np-switch::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:999px;background:#fff;box-shadow:0 1px 2px #00000026;transition:transform .22s var(--np-spring)}
.np-switch:checked{background:var(--np-accent)}
.np-switch:checked::after{transform:translateX(16px)}
.np-switch:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-tray{display:flex;flex-wrap:wrap;gap:6px}
.np-thumb{position:relative;display:grid;place-items:center;width:44px;height:44px;flex:none;border-radius:12px;overflow:hidden;background:var(--np-fill);color:var(--np-dim);font:590 10px/1 inherit;letter-spacing:.02em;text-transform:uppercase}
.np-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.np-thumb-x{position:absolute;top:2px;right:2px;display:grid;place-items:center;width:16px;height:16px;padding:0;border:0;border-radius:999px;background:color-mix(in oklab,#0a0a0c 62%,transparent);color:#fff;cursor:pointer;opacity:0;transition:opacity .16s ease}
.np-thumb:hover .np-thumb-x,.np-thumb-x:focus-visible{opacity:1}
.np-thumb-x svg{width:8px;height:8px}
@media (hover:none){.np-thumb-x{opacity:1}}
/* Anywhere on the panel is a drop target while a file is over it. */
.np-drop{position:absolute;inset:6px;z-index:2;display:none;place-items:center;align-content:center;gap:8px;border:1.5px dashed var(--np-edge);border-radius:16px;background:color-mix(in oklab,var(--np-surface) 90%,transparent);color:var(--np-accent);font:590 13px/1.2 inherit;text-align:center}
.np-drop svg{width:20px;height:20px}
.np-card[data-dropping] .np-drop{display:grid}
.np-turnstile{display:flex;justify-content:center}
.np-foot{display:flex;align-items:center;justify-content:space-between;gap:8px}
.np-tools{display:flex;align-items:center;gap:2px}
.np-tool{position:relative;display:grid;place-items:center;width:30px;height:30px;border-radius:10px;color:var(--np-dim);cursor:pointer;transition:background .16s ease,color .16s ease}
.np-tool:hover{background:var(--np-fill);color:var(--np-fg)}
.np-tool:focus-within{outline:3px solid var(--np-ring);outline-offset:2px}
.np-tool svg{width:15px;height:15px}
.np-tool input{position:absolute;inset:0;opacity:0;cursor:pointer}
.np-actions{display:flex;align-items:center;gap:10px}
.np-kbd{font:400 11px/1 inherit;color:var(--np-faint)}
.np-send{min-height:34px;padding:0 16px;border:0;border-radius:12px;background:var(--np-accent);color:var(--np-on-accent);font:590 14px/1 inherit;letter-spacing:-.01em;cursor:pointer;transition:transform .16s var(--np-spring),opacity .16s ease}
.np-send:active{transform:scale(.97)}
.np-send:disabled{opacity:.5;cursor:progress;transform:none}
.np-send:focus-visible{outline:3px solid var(--np-ring);outline-offset:2px}
.np-error{padding:9px 11px;border-radius:12px;background:var(--np-danger);color:var(--np-on-danger);font:500 13px/1.4 inherit}
.np-sent{display:grid;justify-items:center;gap:8px;padding:12px 2px 6px;text-align:center;font:400 13px/1.45 inherit;color:var(--np-dim);animation:np-step .26s var(--np-spring) both}
.np-sent-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:var(--np-tint);color:var(--np-accent);animation:np-check .42s cubic-bezier(.32,1.35,.4,1) both}
.np-sent-icon svg{width:20px;height:20px}
.np-sent strong{font:600 15px/1.3 inherit;letter-spacing:-.01em;color:var(--np-fg)}
.np-sent small{margin-top:4px;font-size:11px;color:var(--np-faint)}
@keyframes np-fade{from{opacity:0}to{opacity:1}}
@keyframes np-grow{from{opacity:0;transform:scale(.94) translateY(6px)}to{opacity:1;transform:none}}
@keyframes np-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes np-slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes np-sheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes np-step{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes np-check{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
@media (max-width:540px){
.np-popover{right:10px;left:10px;bottom:10px;width:auto;transform-origin:bottom center;animation:np-sheet .3s var(--np-spring) both}
.np-popover .np-card{max-height:min(80vh,620px);padding-bottom:calc(14px + env(safe-area-inset-bottom))}
.np-backdrop{place-items:end stretch;padding:0}
.np-backdrop .np-card{width:100%;max-height:88vh;border-radius:22px 22px 0 0;padding:16px 14px calc(14px + env(safe-area-inset-bottom));animation:np-sheet .32s var(--np-spring) both}
.np-side .np-card{width:100%;height:auto;margin:0;border-radius:22px 22px 0 0}
.np-button{right:14px;bottom:14px}
}
/* The scheme follows the system unless the host pinned one. */
@media (prefers-color-scheme:dark){
.np-root:not([data-np-theme="light"]){
--np-fg:var(--np-text,#f5f5f7);
--np-dim:var(--np-muted,#98989d);
--np-soft:var(--np-muted,#c7c7cc);
--np-faint:var(--np-muted,#8e8e93);
--np-accent:var(--np-primary,#f5f5f7);
--np-on-accent:#1c1c1e;
--np-surface:var(--np-background,#1c1c1e);
--np-fill:color-mix(in oklab,#fff 9%,transparent);
--np-fill-strong:color-mix(in oklab,#fff 14%,transparent);
--np-line:color-mix(in oklab,#fff 12%,transparent);
--np-scrim:color-mix(in oklab,#000 55%,transparent);
--np-danger:color-mix(in oklab,#ff453a 16%,transparent);
--np-on-danger:#ff9f98;
--np-shadow:0 18px 48px #00000073,0 0 0 .5px #ffffff14;
--np-lift:0 4px 14px #0000004d,0 0 0 .5px #ffffff14}
}
.np-root[data-np-theme="dark"]{
--np-fg:var(--np-text,#f5f5f7);
--np-dim:var(--np-muted,#98989d);
--np-soft:var(--np-muted,#c7c7cc);
--np-faint:var(--np-muted,#8e8e93);
--np-accent:var(--np-primary,#f5f5f7);
--np-on-accent:#1c1c1e;
--np-surface:var(--np-background,#1c1c1e);
--np-fill:color-mix(in oklab,#fff 9%,transparent);
--np-fill-strong:color-mix(in oklab,#fff 14%,transparent);
--np-line:color-mix(in oklab,#fff 12%,transparent);
--np-scrim:color-mix(in oklab,#000 55%,transparent);
--np-danger:color-mix(in oklab,#ff453a 16%,transparent);
--np-on-danger:#ff9f98;
--np-shadow:0 18px 48px #00000073,0 0 0 .5px #ffffff14;
--np-lift:0 4px 14px #0000004d,0 0 0 .5px #ffffff14}
@media (prefers-reduced-motion:reduce){
.np-popover,.np-backdrop,.np-card,.np-step,.np-sent,.np-sent-icon{animation:none}
.np-button,.np-send,.np-tile,.np-switch::after{transition:none}
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

/*
 * Two steps, two taps: pick what the message is about, then write it in a
 * single box. The first line of that box becomes the title, so nobody is asked
 * to summarise their own sentence.
 */
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
  const picks =
    fields.includes("type") && categories.length > 1 ? categories : [];
  const canAttach = fields.includes("attachment");
  const heading = options.title ?? "What's up?";
  const initialType = picks[0] ?? categories[0] ?? "suggestion";
  const logo = options.logoUrl
    ? `<img class="np-logo" src="${escapeHtml(options.logoUrl)}" alt="${escapeHtml(options.brandName ?? "")}" width="20" height="20" />`
    : "";

  const fieldRow = (label: string, control: string) =>
    `<label class="np-field"><span class="np-field-label">${label}</span>${control}</label>`;
  const extras: string[] = [];
  if (fields.includes("category") && options.categoryOptions?.length)
    extras.push(
      fieldRow(
        "Category",
        `<select class="np-select" name="categoryId"><option value="">Select a category</option>${options.categoryOptions
          .map(
            (category) =>
              `<option value="${escapeHtml(category.id)}">${labelFor(category.name)}</option>`,
          )
          .join("")}</select>`,
      ),
    );
  for (const custom of options.customFields ?? []) {
    const required = custom.required ? " required" : "";
    const name = `custom_${escapeHtml(custom.id)}`;
    if (custom.type === "textarea")
      extras.push(
        fieldRow(
          labelFor(custom.label),
          `<textarea class="np-input np-textarea" name="${name}" maxlength="2000"${required}></textarea>`,
        ),
      );
    else if (custom.type === "select")
      extras.push(
        fieldRow(
          labelFor(custom.label),
          `<select class="np-select" name="${name}"${required}><option value="">Select an option</option>${(
            custom.options ?? []
          )
            .map(
              (option) =>
                `<option value="${escapeHtml(option)}">${labelFor(option)}</option>`,
            )
            .join("")}</select>`,
        ),
      );
    else if (custom.type === "boolean")
      extras.push(
        `<label class="np-field np-field-inline"><span class="np-field-label">${labelFor(custom.label)}</span><input class="np-switch" type="checkbox" name="${name}" value="true"${required} /></label>`,
      );
    else
      extras.push(
        fieldRow(
          labelFor(custom.label),
          `<input class="np-input" type="${custom.type === "number" ? "number" : "text"}" name="${name}" maxlength="512"${required} />`,
        ),
      );
  }

  const card = document.createElement("form");
  card.className = "np-card";
  card.innerHTML =
    `<section class="np-step np-pick"${picks.length ? "" : " hidden"}>` +
    `<div class="np-bar"><div class="np-bar-l">${logo}<span class="np-dots"><i class="np-dot np-dot-on"></i><i class="np-dot"></i></span></div>` +
    `<button type="button" class="np-x" aria-label="Close">${drawing(icons.close, 2.3)}</button></div>` +
    `<h2 class="np-ask">${escapeHtml(heading)}</h2>` +
    `<div class="np-tiles" role="radiogroup" aria-label="Feedback type">${picks
      .map((value) => {
        const meta = metaFor(value);
        return `<button type="button" class="np-tile" role="radio" aria-checked="false" data-value="${escapeHtml(value)}">${drawing(meta.icon, 1.7)}<span>${escapeHtml(meta.label)}</span></button>`;
      })
      .join("")}</div>` +
    `<p class="np-hint">${escapeHtml(options.description ?? "Pick one — the next step is a single box.")}</p>` +
    `</section>` +
    `<section class="np-step np-compose"${picks.length ? " hidden" : ""}>` +
    `<div class="np-bar"><div class="np-bar-l">` +
    (picks.length
      ? `<button type="button" class="np-back" aria-label="Back">${drawing(icons.back, 2.1)}</button><span class="np-chip">${drawing(icons.message, 1.9)}<span></span></span>`
      : `${logo}<h2 class="np-ask np-ask-sm">${escapeHtml(heading)}</h2>`) +
    `</div><button type="button" class="np-x" aria-label="Close">${drawing(icons.close, 2.3)}</button></div>` +
    `<textarea class="np-box" name="body" required minlength="3" maxlength="20000"></textarea>` +
    (extras.length ? `<div class="np-extra">${extras.join("")}</div>` : "") +
    (fields.includes("email")
      ? `<label class="np-mail">${drawing(icons.mail, 1.8)}<input type="email" name="email" placeholder="Email for updates (optional)" /></label>`
      : "") +
    (canAttach ? `<div class="np-tray" hidden></div>` : "") +
    (options.turnstileSiteKey
      ? `<div class="np-turnstile" aria-live="polite"></div>`
      : "") +
    `<div class="np-foot"><div class="np-tools">` +
    (canAttach
      ? `<label class="np-tool" title="Attach an image — or paste one" aria-label="Attach an image">${drawing(icons.clip, 1.8)}<input type="file" name="attachment" multiple accept="${attachmentAccept}" /></label>`
      : "") +
    `</div><div class="np-actions"><span class="np-kbd" aria-hidden="true">${sendHint()}</span><button class="np-send">Send</button></div></div>` +
    `<input type="hidden" name="type" value="${escapeHtml(initialType)}" />` +
    `</section>` +
    (canAttach
      ? `<div class="np-drop" aria-hidden="true">${drawing(icons.clip, 1.8)}Drop to attach</div>`
      : "");

  const pick = card.querySelector<HTMLElement>(".np-pick")!;
  const compose = card.querySelector<HTMLElement>(".np-compose")!;
  const box = card.querySelector<HTMLTextAreaElement>(".np-box")!;
  const typeInput = card.querySelector<HTMLInputElement>('input[name="type"]')!;
  const chip = compose.querySelector<HTMLElement>(".np-chip");
  const tiles = [...card.querySelectorAll<HTMLElement>(".np-tile")];

  const show = (step: HTMLElement, other: HTMLElement) => {
    other.hidden = true;
    step.hidden = false;
    step.style.animation = "none";
    void step.offsetWidth;
    step.style.animation = "";
  };
  /* Nothing is pre-selected on the first step: the tiles are the question. */
  const choose = (value: string, mark = true) => {
    const meta = metaFor(value);
    typeInput.value = value;
    if (mark)
      for (const tile of tiles)
        tile.setAttribute("aria-checked", String(tile.dataset.value === value));
    if (chip) {
      chip.querySelector("path")?.setAttribute("d", meta.icon);
      (chip.querySelector("span") as HTMLElement).textContent = meta.label;
    }
    box.placeholder = meta.prompt;
  };
  choose(initialType, false);
  for (const tile of tiles)
    tile.addEventListener("click", () => {
      choose(String(tile.dataset.value));
      show(compose, pick);
      box.focus({ preventScroll: true });
    });
  card.querySelector(".np-back")?.addEventListener("click", () => {
    show(pick, compose);
  });
  for (const dismiss of card.querySelectorAll(".np-x"))
    dismiss.addEventListener("click", close);

  const showError = (message: string) => {
    card.querySelector(".np-error")?.remove();
    const note = document.createElement("div");
    note.className = "np-error";
    note.textContent = message;
    compose.insertBefore(note, compose.querySelector(".np-foot"));
  };

  /*
   * A screenshot arrives three ways — the paperclip, a paste, or dropped onto
   * the panel — and they all land in the same tray.
   */
  const fileInput = card.querySelector<HTMLInputElement>('input[type="file"]');
  const tray = card.querySelector<HTMLElement>(".np-tray");
  const attachments: Array<{ file: File; preview?: string }> = [];
  const renderTray = () => {
    if (!tray) return;
    tray.textContent = "";
    tray.hidden = attachments.length === 0;
    for (const [index, entry] of attachments.entries()) {
      const thumb = document.createElement("span");
      thumb.className = "np-thumb";
      thumb.title = entry.file.name;
      thumb.innerHTML = entry.preview
        ? `<img src="${entry.preview}" alt="" />`
        : escapeHtml(
            (entry.file.name.split(".").pop() ?? "file").slice(0, 4),
          );
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "np-thumb-x";
      remove.setAttribute("aria-label", `Remove ${entry.file.name}`);
      remove.innerHTML = drawing(icons.close, 3);
      remove.addEventListener("click", () => {
        if (entry.preview) URL.revokeObjectURL(entry.preview);
        attachments.splice(index, 1);
        renderTray();
      });
      thumb.appendChild(remove);
      tray.appendChild(thumb);
    }
  };
  const addFiles = (incoming: Iterable<File> | null | undefined) => {
    if (!canAttach || !incoming) return;
    for (const file of incoming) {
      if (attachments.length >= maxAttachments) {
        showError(`Up to ${maxAttachments} files.`);
        break;
      }
      if (!attachmentTypes.test(file.type)) {
        showError("PNG, JPEG, WebP, GIF, PDF or plain text only.");
        continue;
      }
      if (file.size < 1 || file.size > maxAttachmentBytes) {
        showError("Each file has to stay under 10 MB.");
        continue;
      }
      attachments.push({
        file,
        ...(file.type.startsWith("image/")
          ? { preview: URL.createObjectURL(file) }
          : {}),
      });
      card.querySelector(".np-error")?.remove();
    }
    renderTray();
  };
  fileInput?.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
  });
  if (canAttach) {
    card.addEventListener("paste", (event) => {
      const pasted = (event as ClipboardEvent).clipboardData?.files;
      if (!pasted?.length) return;
      event.preventDefault();
      addFiles(pasted);
    });
    const carriesFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");
    card.addEventListener("dragover", (event) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      card.dataset.dropping = "true";
    });
    card.addEventListener("dragleave", (event) => {
      if (!card.contains(event.relatedTarget as Node | null))
        delete card.dataset.dropping;
    });
    card.addEventListener("drop", (event) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      delete card.dataset.dropping;
      addFiles(event.dataTransfer?.files);
    });
    /* Object URLs outlive the panel unless the close path clears them. */
    root.addEventListener("np-close", () => {
      for (const entry of attachments)
        if (entry.preview) URL.revokeObjectURL(entry.preview);
    });
  }
  box.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      card.requestSubmit();
    }
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

  card.addEventListener("submit", async (event) => {
    event.preventDefault();
    const send = card.querySelector<HTMLButtonElement>(".np-send")!;
    send.disabled = true;
    send.textContent = "Sending…";
    const data = Object.fromEntries(new FormData(card).entries());
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
      const body = String(data.body ?? "").trim();
      const opening = body.split("\n")[0]?.trim() ?? "";
      const title = opening
        ? opening.length > 160
          ? `${opening.slice(0, 157)}…`
          : opening
        : "Feedback";
      await client.feedback.create(
        {
          type: String(data.type || "suggestion") as FeedbackType,
          categoryId: data.categoryId ? String(data.categoryId) : undefined,
          title,
          body,
          email: data.email ? String(data.email) : undefined,
          locale: options.locale ?? navigator.language,
          platform: "web",
          metadata: customMetadata,
          turnstileToken,
        },
        attachments.map((entry) => entry.file),
      );
      for (const entry of attachments)
        if (entry.preview) URL.revokeObjectURL(entry.preview);
      card.innerHTML = `<div class="np-sent"><span class="np-sent-icon">${drawing(icons.check, 2.4)}</span><strong>Got it — thank you</strong><span>We read every message. If you left an email, we'll reply there.</span>${options.showPoweredBy === false ? "" : "<small>Powered by NitroPing</small>"}</div>`;
      setTimeout(close, 2600);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Submission failed.");
      send.disabled = false;
      send.textContent = "Send";
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
    /*
     * The stock accent is ink, which flips to a light ink in dark mode; a brand
     * colour keeps white text in both.
     */
    if (merged.colors?.primary) root.style.setProperty("--np-on-accent", "#fff");
    /*
     * Hosts that run their own light/dark switch pin the scheme; the default
     * follows the operating system.
     */
    if (merged.theme === "light" || merged.theme === "dark")
      root.dataset.npTheme = merged.theme;
    const mode = merged.mode ?? "floating";
    let launcher: HTMLButtonElement | null = null;
    let panel: HTMLElement | null = null;
    let detach: (() => void) | null = null;

    const close = () => {
      panel?.dispatchEvent(new CustomEvent("np-close"));
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
        if (launcher && (target === launcher || launcher.contains(target)))
          return;
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
        .querySelector<HTMLElement>(".np-tile, .np-box")
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
      button.innerHTML = drawing(icons.message, 1.8);
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
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
