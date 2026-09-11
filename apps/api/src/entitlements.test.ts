import { describe, expect, it } from "vitest";
import { entitlementsFor, hasEntitlement, normalizePlan } from "./entitlements";

describe("entitlements", () => {
  it("normalizes unknown plans to the safe free tier", () => {
    expect(normalizePlan("enterprise")).toBe("free");
    expect(entitlementsFor("enterprise").monthlyFeedback).toBe(100);
    expect(entitlementsFor("free").teamMembers).toBe(1);
  });

  it("keeps feature gates server-side and plan-specific", () => {
    expect(hasEntitlement("free", "webhooks")).toBe(false);
    expect(hasEntitlement("free", "customTheme")).toBe(false);
    expect(hasEntitlement("pro", "customTheme")).toBe(true);
    expect(hasEntitlement("pro", "webhooks")).toBe(true);
    expect(hasEntitlement("business", "customDomains")).toBe(true);
  });
});
