import { describe, expect, it, vi } from "vitest";

vi.mock("./events", () => ({
  ProjectEventStream: class ProjectEventStream {},
}));

import { deliverWebhook } from "./index";

describe("queue side-effect idempotency", () => {
  it("does not resend a webhook that is already marked delivered", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const env = {
      DB: {
        prepare(statement: string) {
          expect(statement).toContain("SELECT status FROM webhook_deliveries");
          return {
            bind: () => ({
              first: async () => ({ status: "delivered" }),
            }),
          };
        },
      },
    } as never;

    await expect(
      deliverWebhook(env, {
        deliveryId: "delivery_1",
        webhookId: "webhook_1",
        sourceEventId: "event_1",
        eventType: "feedback.created",
        feedbackId: "feedback_1",
        organizationId: "org_1",
        projectId: "project_1",
      }),
    ).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
