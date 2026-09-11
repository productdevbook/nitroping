import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { changeFeedbackStatus, createFeedback, getFeedback, listFeedback, type FeedbackRepository } from "./services";
import type { Feedback } from "@nitroping/contracts";

const sample: Feedback = {
  id: "f_1", organizationId: "org_1", projectId: "project_1", type: "bug", status: "new", priority: "normal",
  title: "Payment screen", body: "It does not open", metadata: {}, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("feedback service boundaries", () => {
  it("passes tenant context through every repository operation", async () => {
    const calls: string[] = [];
    const repository: FeedbackRepository = {
      async create(context, input) { calls.push(`create:${context.organizationId}:${context.projectId}`); return { ...sample, ...input }; },
      async get(context) { calls.push(`get:${context.organizationId}:${context.projectId}`); return sample; },
      async list(context) { calls.push(`list:${context.organizationId}:${context.projectId}`); return { items: [sample] }; },
      async updateStatus(context) { calls.push(`status:${context.organizationId}:${context.projectId}`); return { ...sample, status: "triaged" }; },
    };
    const context = { organizationId: "org_1", projectId: "project_1" };
    await Effect.runPromise(createFeedback(repository, context, { type: "bug", title: "Title", body: "Body" }, "req_1"));
    await Effect.runPromise(getFeedback(repository, context, sample.id));
    await Effect.runPromise(listFeedback(repository, context, { query: "payment" }));
    await Effect.runPromise(changeFeedbackStatus(repository, context, sample.id, "triaged"));
    expect(calls).toEqual(["create:org_1:project_1", "get:org_1:project_1", "list:org_1:project_1", "status:org_1:project_1"]);
  });
});
