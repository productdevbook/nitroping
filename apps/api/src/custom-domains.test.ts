import { describe, expect, it, vi } from "vitest";
import {
  CloudflareCustomHostnameProvider,
  normalizeCustomHostname,
  validateCustomHostname,
} from "./custom-domains";

describe("custom domain validation", () => {
  it("normalizes DNS hostnames", () => {
    expect(normalizeCustomHostname(" Feedback.Example.COM. ")).toBe(
      "feedback.example.com",
    );
  });

  it("rejects provider-owned, local, IP, and malformed hostnames", () => {
    for (const hostname of [
      "nitroping.dev",
      "app.nitroping.dev",
      "localhost",
      "app.localhost",
      "127.0.0.1",
      "bad_label.example.com",
    ])
      expect(validateCustomHostname(hostname)).not.toBeNull();
    expect(validateCustomHostname("feedback.example.com")).toBeNull();
  });
});

describe("Cloudflare custom hostname provider", () => {
  it("creates and maps a custom hostname", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, __?: RequestInit) =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            result: {
              id: "ch_123",
              hostname: "feedback.example.com",
              status: "pending_validation",
              ssl: {
                status: "pending_validation",
                validation_records: [
                  { type: " CNAME ", name: "_acme", value: "target" },
                ],
              },
            },
          }),
          { status: 200 },
        ),
      ),
    );
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      const result = await new CloudflareCustomHostnameProvider(
        "token",
        "zone",
        "https://origin.nitroping.dev",
      ).create("feedback.example.com", {
        organizationId: "org_1",
        projectId: "project_1",
      });
      expect(result.id).toBe("ch_123");
      expect(result.validationRecords).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const request = fetchMock.mock.calls[0]?.[1] as unknown as RequestInit;
      expect(JSON.parse(String(request.body))).toMatchObject({
        hostname: "feedback.example.com",
        custom_metadata: { organization_id: "org_1", project_id: "project_1" },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
