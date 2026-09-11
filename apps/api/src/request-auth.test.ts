import { describe, expect, it, vi } from "vitest";

vi.mock("./events", () => ({
  ProjectEventStream: class ProjectEventStream {},
}));
import { allowsDevelopmentFallback } from "./index";

describe("public environment authorization policy", () => {
  it("does not treat staging as a local fixture environment", () => {
    expect(allowsDevelopmentFallback("staging")).toBe(false);
    expect(allowsDevelopmentFallback("production")).toBe(false);
  });

  it("allows only explicit local environments to use fixture context", () => {
    expect(allowsDevelopmentFallback("development")).toBe(true);
    expect(allowsDevelopmentFallback("test")).toBe(true);
  });
});
