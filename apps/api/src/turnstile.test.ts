import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

const request = new Request("https://nitroping.dev/api/v1/projects/p/feedback", {
  headers: { "CF-Connecting-IP": "203.0.113.10" },
});

describe("Turnstile validation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("allows deployments where Turnstile is not configured", async () => {
    await expect(
      verifyTurnstile({} as never, request, undefined),
    ).resolves.toBe(true);
  });

  it("requires a successful feedback action when configured", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, action: "feedback" }), {
          status: 200,
        }),
      );

    await expect(
      verifyTurnstile(
        { TURNSTILE_SECRET_KEY: "secret" } as never,
        request,
        "token",
      ),
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects failed or wrong-action verification", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, action: "login" }), {
        status: 200,
      }),
    );
    await expect(
      verifyTurnstile(
        { TURNSTILE_SECRET_KEY: "secret" } as never,
        request,
        "token",
      ),
    ).resolves.toBe(false);
  });
});
