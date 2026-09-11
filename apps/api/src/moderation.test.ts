import { describe, expect, it } from "vitest";
import { analyzeModeration } from "./moderation";

describe("analyzeModeration", () => {
  it("keeps normal feedback clear", () => {
    expect(
      analyzeModeration({
        title: "Checkout is slow",
        body: "The payment screen takes several seconds to load on mobile.",
        email: "user@example.com",
      }),
    ).toEqual({ version: 1, decision: "clear", flags: [], score: 0 });
  });

  it("returns explainable flags for human review", () => {
    const result = analyzeModeration({
      title: "Buy now",
      body: "Buy now https://a.test https://b.test https://c.test",
      email: "not-an-email",
    });
    expect(result.decision).toBe("review");
    expect(result.flags).toEqual([
      "excessive_links",
      "spam_language",
      "suspicious_email",
    ]);
  });

  it("never makes an enforcement decision", () => {
    expect(analyzeModeration({ title: "", body: "" }).decision).toBe("review");
  });
});
