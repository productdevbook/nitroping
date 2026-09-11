import { describe, expect, it } from "vitest";
import { reviewWithWorkersAI } from "./ai-moderation";

describe("Workers AI moderation assistance", () => {
  it("normalizes model output into a bounded human-review suggestion", async () => {
    const ai = {
      run: async () => ({
        response: '```json\n{"suggestedType":"bug","sentiment":"negative","risk":"high","summary":"Payment flow fails","confidence":1.4}\n```',
      }),
    } as unknown as Ai;
    await expect(
      reviewWithWorkersAI(ai, { title: "Checkout", body: "It fails" }),
    ).resolves.toEqual({
      suggestedType: "bug",
      sentiment: "negative",
      risk: "high",
      summary: "Payment flow fails",
      confidence: 1,
    });
  });

  it("falls back safely for malformed model output", async () => {
    const ai = { run: async () => ({ response: "not json" }) } as unknown as Ai;
    await expect(
      reviewWithWorkersAI(ai, { title: "Suggestion", body: "More colors" }),
    ).rejects.toThrow();
  });
});
