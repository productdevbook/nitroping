export const FEEDBACK_EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5" as const;

type EmbeddingResult = {
  data?: number[][];
};

export type SemanticFeedbackDocument = {
  feedbackId: string;
  organizationId: string;
  projectId: string;
  title: string;
  body: string;
};

export type SemanticFeedbackMatch = {
  feedbackId: string;
  score: number;
};

type FeedbackVectorIndex = {
  upsert(vectors: VectorizeVector[]): Promise<unknown>;
  query(
    vector: VectorFloatArray | number[],
    options?: VectorizeQueryOptions,
  ): Promise<{ matches: Array<{ metadata?: Record<string, unknown>; score?: number }> }>;
  deleteByIds(ids: string[]): Promise<unknown>;
};

const embeddingInput = (document: Pick<SemanticFeedbackDocument, "title" | "body">) =>
  `${document.title}\n\n${document.body}`.slice(0, 4_000);

export const embedFeedbackText = async (
  ai: Ai,
  document: Pick<SemanticFeedbackDocument, "title" | "body">,
): Promise<number[]> => {
  const result = (await ai.run(FEEDBACK_EMBEDDING_MODEL, {
    text: [embeddingInput(document)],
  })) as EmbeddingResult;
  const vector = result.data?.[0];
  if (!vector?.length || vector.some((value) => !Number.isFinite(value)))
    throw new Error("Workers AI returned an invalid feedback embedding");
  return vector;
};

export const upsertFeedbackEmbedding = async (
  index: FeedbackVectorIndex,
  ai: Ai,
  document: SemanticFeedbackDocument,
): Promise<void> => {
  const values = await embedFeedbackText(ai, document);
  await index.upsert([
    {
      id: document.feedbackId,
      namespace: document.projectId,
      values,
      metadata: {
        organizationId: document.organizationId,
        projectId: document.projectId,
        feedbackId: document.feedbackId,
      },
    },
  ]);
};

export const deleteFeedbackEmbedding = async (
  index: FeedbackVectorIndex,
  feedbackId: string,
): Promise<void> => {
  await index.deleteByIds([feedbackId]);
};

export const queryFeedbackEmbeddings = async (
  index: FeedbackVectorIndex,
  ai: Ai,
  query: string,
  organizationId: string,
  projectId: string,
  limit: number,
): Promise<SemanticFeedbackMatch[]> => {
  const vector = await embedFeedbackText(ai, { title: query, body: "" });
  const result = await index.query(vector, {
    namespace: projectId,
    topK: limit,
    returnMetadata: "all",
    filter: { organizationId: { $eq: organizationId } },
  });
  return result.matches.flatMap((match) => {
    const feedbackId = match.metadata?.feedbackId;
    return typeof feedbackId === "string"
      ? [{ feedbackId, score: Number(match.score ?? 0) }]
      : [];
  });
};
