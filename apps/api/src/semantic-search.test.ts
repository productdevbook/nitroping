import { describe, expect, it, vi } from "vitest";
import {
  deleteFeedbackEmbedding,
  embedFeedbackText,
  queryFeedbackEmbeddings,
  upsertFeedbackEmbedding,
} from "./semantic-search";

const ai = {
  run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3]] }),
} as unknown as Ai;

const index = {
  upsert: vi.fn().mockResolvedValue({ mutationId: "mutation_1" }),
  deleteByIds: vi.fn().mockResolvedValue({ mutationId: "mutation_2" }),
  query: vi.fn().mockResolvedValue({
    matches: [
      { id: "feedback_1", score: 0.91, metadata: { feedbackId: "feedback_1" } },
      { id: "feedback_2", score: 0.82, metadata: { feedbackId: "feedback_2" } },
    ],
  }),
} as unknown as {
  upsert(vectors: VectorizeVector[]): Promise<unknown>;
  query(vector: VectorFloatArray | number[], options?: VectorizeQueryOptions): Promise<{
    matches: Array<{ metadata?: Record<string, unknown>; score?: number }>;
  }>;
  deleteByIds(ids: string[]): Promise<unknown>;
};

describe("semantic feedback search", () => {
  it("embeds and upserts with a project namespace", async () => {
    await upsertFeedbackEmbedding(index, ai, {
      feedbackId: "feedback_1",
      organizationId: "org_1",
      projectId: "project_1",
      title: "Payment fails",
      body: "The checkout page errors",
    });
  });

  it("returns only metadata-backed feedback matches", async () => {
    const matches = await queryFeedbackEmbeddings(
      index,
      ai,
      "checkout error",
      "org_1",
      "project_1",
      10,
    );
    expect(matches).toEqual([
      { feedbackId: "feedback_1", score: 0.91 },
      { feedbackId: "feedback_2", score: 0.82 },
    ]);
    expect(index.query).toHaveBeenCalledWith([0.1, 0.2, 0.3], {
      namespace: "project_1",
      topK: 10,
      returnMetadata: "all",
      filter: { organizationId: { $eq: "org_1" } },
    });
  });

  it("deletes by globally unique feedback id", async () => {
    await deleteFeedbackEmbedding(index, "feedback_1");
    expect(index.deleteByIds).toHaveBeenCalledWith(["feedback_1"]);
  });

  it("rejects malformed embedding output", async () => {
    const invalidAi = { run: vi.fn().mockResolvedValue({ data: [[]] }) } as unknown as Ai;
    await expect(embedFeedbackText(invalidAi, { title: "x", body: "y" })).rejects.toThrow(
      "invalid feedback embedding",
    );
  });
});
