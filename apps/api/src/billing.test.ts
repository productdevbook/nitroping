import { describe, expect, it } from "vitest";
import { StripeBillingProvider } from "./billing";
import { hmacSha256 } from "./security";

describe("StripeBillingProvider", () => {
  it("accepts a valid, fresh signature", async () => {
    const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
    const timestamp = Math.floor(Date.now() / 1000);
    const secret = "whsec_test";
    const signature = await hmacSha256(secret, `${timestamp}.${payload}`);
    const provider = new StripeBillingProvider("unused", { pro: "", business: "" }, secret);

    await expect(provider.verifyWebhook(payload, `t=${timestamp},v1=${signature}`)).resolves.toBe(true);
  });

  it("rejects malformed and stale signatures", async () => {
    const provider = new StripeBillingProvider("unused", { pro: "", business: "" }, "whsec_test");

    await expect(provider.verifyWebhook("{}", "not-a-signature")).resolves.toBe(false);
    await expect(provider.verifyWebhook("{}", "t=1,v1=deadbeef")).resolves.toBe(false);
  });
});
