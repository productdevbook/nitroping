import type { CreateFeedbackInput, Feedback, FeedbackType } from "@nitroping/contracts";

export type WidgetMode = "floating" | "modal" | "side-panel" | "inline" | "portal" | "headless";
export type WidgetField = "type" | "title" | "description" | "attachment" | "email";
export type NitroPingOptions = { projectKey: string; apiBaseUrl?: string; mode?: WidgetMode; theme?: "light" | "dark" | "system"; locale?: string; target?: string | HTMLElement; buttonLabel?: string; fields?: WidgetField[]; categories?: FeedbackType[] };
export type NitroPingClient = { feedback: { create(input: CreateFeedbackInput): Promise<Feedback> }; destroy(): void };

const defaultFields: WidgetField[] = ["type", "title", "description", "email"];
const base = (options: NitroPingOptions) => options.apiBaseUrl ?? "https://nitroping.dev/api/v1";

export const createNitroPingClient = (options: NitroPingOptions): NitroPingClient => ({
  feedback: { async create(input) {
    const response = await fetch(`${base(options)}/projects/${encodeURIComponent(options.projectKey)}/feedback`, { method: "POST", headers: { "content-type": "application/json", "x-nitroping-project-key": options.projectKey, "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(input) });
    const result = await response.json() as Feedback | { error?: { message?: string } };
    if (!response.ok) throw new Error("error" in result ? result.error?.message ?? "NitroPing request failed" : "NitroPing request failed");
    return result as Feedback;
  } },
  destroy() {},
});

const css = `.np-root{all:initial;font-family:system-ui,sans-serif;color:#181221}.np-root *{box-sizing:border-box}.np-button{position:fixed;right:20px;bottom:20px;z-index:2147483647;border:0;border-radius:999px;padding:12px 16px;background:#7c3aed;color:#fff;font:600 14px system-ui;cursor:pointer;box-shadow:0 8px 30px #0003}.np-backdrop{position:fixed;inset:0;z-index:2147483646;background:#120b1b99;display:grid;place-items:center;padding:20px}.np-card{width:min(100%,520px);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 80px #0005}.np-card h2{margin:0 0 6px;font-size:22px}.np-card p{color:#665d70;margin:0 0 18px}.np-grid{display:grid;gap:12px}.np-label{display:grid;gap:6px;font:600 13px system-ui}.np-input,.np-select{font:400 15px system-ui;padding:11px 12px;border:1px solid #ddd5e8;border-radius:10px;background:#fff}.np-textarea{min-height:120px;resize:vertical}.np-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.np-secondary,.np-submit{border:0;border-radius:10px;padding:11px 16px;font:700 14px system-ui;cursor:pointer}.np-secondary{background:#f0ebf6;color:#39284d}.np-submit{background:#7c3aed;color:#fff}.np-error{color:#b42318;font-size:13px}.np-success{padding:16px;border-radius:12px;background:#f1ebff;color:#4c1d95;line-height:1.5}`;

export const NitroPing = {
  init(options: NitroPingOptions) {
    const client = createNitroPingClient(options);
    if (options.mode === "headless" || typeof document === "undefined") return client;
    const host = typeof options.target === "string" ? document.querySelector(options.target) : options.target;
    const root = document.createElement("div"); root.className = "np-root";
    const style = document.createElement("style"); style.textContent = css; root.appendChild(style);
    const button = document.createElement("button"); button.type = "button"; button.className = "np-button"; button.textContent = options.buttonLabel ?? "Geri bildirim";
    const open = () => {
      const backdrop = document.createElement("div"); backdrop.className = "np-backdrop"; backdrop.setAttribute("role", "dialog"); backdrop.setAttribute("aria-modal", "true");
      const card = document.createElement("form"); card.className = "np-card";
      const fields = options.fields ?? defaultFields; const categories = options.categories ?? ["complaint", "bug", "suggestion", "feature_request"];
      card.innerHTML = `<h2>Geri bildiriminiz</h2><p>Ürünü daha iyi yapmak için düşüncelerinizi paylaşın.</p><div class="np-grid"></div><div class="np-actions"><button type="button" class="np-secondary">Vazgeç</button><button class="np-submit">Gönder</button></div>`;
      const grid = card.querySelector(".np-grid")!;
      if (fields.includes("type")) grid.insertAdjacentHTML("beforeend", `<label class="np-label">Tür<select class="np-select" name="type">${categories.map((x) => `<option value="${x}">${x === "feature_request" ? "Özellik önerisi" : x === "bug" ? "Hata" : x === "complaint" ? "Şikâyet" : "Öneri"}</option>`).join("")}</select></label>`);
      if (fields.includes("title")) grid.insertAdjacentHTML("beforeend", `<label class="np-label">Başlık<input class="np-input" name="title" required minlength="3" maxlength="160" /></label>`);
      if (fields.includes("description")) grid.insertAdjacentHTML("beforeend", `<label class="np-label">Açıklama<textarea class="np-input np-textarea" name="body" required minlength="3" maxlength="20000"></textarea></label>`);
      if (fields.includes("email")) grid.insertAdjacentHTML("beforeend", `<label class="np-label">E-posta (opsiyonel)<input class="np-input" type="email" name="email" /></label>`);
      const close = () => backdrop.remove(); card.querySelector(".np-secondary")?.addEventListener("click", close); backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
      card.addEventListener("submit", async (event) => {
        event.preventDefault(); const submit = card.querySelector<HTMLButtonElement>(".np-submit")!; submit.disabled = true; submit.textContent = "Gönderiliyor…";
        const data = Object.fromEntries(new FormData(card).entries());
        try { await client.feedback.create({ type: data.type as FeedbackType, title: String(data.title), body: String(data.body), email: data.email ? String(data.email) : undefined, locale: options.locale ?? navigator.language, platform: "web" }); card.innerHTML = `<div class="np-success"><strong>Teşekkürler!</strong><br />Geri bildiriminiz ekibimize iletildi.</div>`; setTimeout(close, 2600); }
        catch (cause) { card.querySelector(".np-error")?.remove(); const error = document.createElement("div"); error.className = "np-error"; error.textContent = cause instanceof Error ? cause.message : "Gönderim başarısız oldu."; const actions = card.querySelector(".np-actions"); if (actions) card.insertBefore(error, actions); submit.disabled = false; submit.textContent = "Gönder"; }
      });
      backdrop.appendChild(card); root.appendChild(backdrop);
    };
    button.addEventListener("click", open); (host ?? document.body).appendChild(root); if (!host) root.appendChild(button); else host.appendChild(button);
    return { ...client, destroy() { root.remove(); } };
  },
  configure(_options: Partial<NitroPingOptions>) { return this; },
};
