import { describe, expect, it, vi } from "vitest";

vi.mock("./events", () => ({
  ProjectEventStream: class ProjectEventStream {},
}));
import {
  allowsDevelopmentFallback,
  contextFrom,
  isPrivateWebhookHost,
  requestId,
} from "./index";

describe("public environment authorization policy", () => {
  it("does not treat staging as a local fixture environment", () => {
    expect(allowsDevelopmentFallback("staging")).toBe(false);
    expect(allowsDevelopmentFallback("production")).toBe(false);
  });

  it("allows only explicit local environments to use fixture context", () => {
    expect(allowsDevelopmentFallback("development")).toBe(true);
    expect(allowsDevelopmentFallback("test")).toBe(true);
  });

  it("derives the project id from the versioned API path", () => {
    const context = contextFrom(
      new URL("https://localhost/api/v1/projects/project_123/feedback"),
    );
    expect(context.projectId).toBe("project_123");
  });

  it("accepts bounded request IDs and replaces unsafe values", () => {
    expect(
      requestId(new Request("https://localhost", { headers: { "x-request-id": "client_123" } })),
    ).toBe("client_123");
    expect(
      requestId(new Request("https://localhost", { headers: { "x-request-id": "request id" } })),
    ).toMatch(/^req_/);
  });

  it("rejects private, reserved, and documentation-only webhook addresses", () => {
    for (const host of [
      "10.0.0.1",
      "100.64.0.1",
      "172.16.0.1",
      "192.0.2.1",
      "198.18.0.1",
      "203.0.113.10",
      "127.0.0.1",
      "[::1]",
      "[::ffff:7f00:1]",
      "[::ffff:a00:1]",
      "fd00::1",
      "2001:db8::1",
    ])
      expect(isPrivateWebhookHost(host), host).toBe(true);
    expect(isPrivateWebhookHost("example.com")).toBe(false);
  });
});
