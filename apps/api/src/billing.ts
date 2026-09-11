import { hmacSha256 } from "./security";

export type BillingPlan = "pro" | "business";
export type CheckoutRequest = { organizationId: string; plan: BillingPlan; customerId?: string; successUrl: string; cancelUrl: string };
export type CheckoutResult = { id: string; url: string | null };

export interface BillingProvider {
  createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResult>;
  verifyWebhook(payload: string, signature: string, toleranceSeconds?: number): Promise<boolean>;
}

export class StripeBillingProvider implements BillingProvider {
  constructor(private readonly secretKey: string, private readonly prices: Record<BillingPlan, string>, private readonly webhookSecret = "") {}

  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResult> {
    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", this.prices[request.plan]);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", request.successUrl);
    form.set("cancel_url", request.cancelUrl);
    form.set("client_reference_id", request.organizationId);
    form.set("metadata[organizationId]", request.organizationId);
    form.set("metadata[plan]", request.plan);
    form.set("subscription_data[metadata][organizationId]", request.organizationId);
    form.set("subscription_data[metadata][plan]", request.plan);
    if (request.customerId) form.set("customer", request.customerId);
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${this.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
    const data = await response.json() as { id?: string; url?: string | null; error?: { message?: string } };
    if (!response.ok || !data.id) throw new Error(data.error?.message ?? "Stripe checkout session creation failed");
    return { id: data.id, url: data.url ?? null };
  }

  async verifyWebhook(payload: string, signature: string, toleranceSeconds = 300): Promise<boolean> {
    if (!this.webhookSecret) return false;
    const values = new Map(signature.split(",").map((part) => part.split("=", 2) as [string, string]));
    const timestamp = Number(values.get("t")); const expected = values.get("v1");
    if (!Number.isFinite(timestamp) || !expected || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
    const actual = await hmacSha256(this.webhookSecret, `${timestamp}.${payload}`);
    return actual === expected;
  }
}
