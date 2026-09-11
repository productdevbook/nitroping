export type AiModerationReview = {
  suggestedType: "complaint" | "bug" | "suggestion" | "feature_request";
  sentiment: "negative" | "neutral" | "positive";
  risk: "low" | "medium" | "high";
  summary: string;
  confidence: number;
};

type Candidate = { title: string; body: string; email?: string | null };

const allowedTypes = new Set<AiModerationReview["suggestedType"]>([
  "complaint",
  "bug",
  "suggestion",
  "feature_request",
]);
const allowedSentiments = new Set<AiModerationReview["sentiment"]>([
  "negative",
  "neutral",
  "positive",
]);
const allowedRisks = new Set<AiModerationReview["risk"]>([
  "low",
  "medium",
  "high",
]);

const parseResponse = (value: unknown): Record<string, unknown> => {
  const text =
    value && typeof value === "object" && "response" in value
      ? String((value as { response?: unknown }).response ?? "")
      : String(value ?? "");
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
};

export const reviewWithWorkersAI = async (
  ai: Ai,
  candidate: Candidate,
): Promise<AiModerationReview> => {
  const result = await ai.run(
    "@cf/meta/llama-3.1-8b-instruct-fast" as never,
    {
      prompt: `You assist a human moderation team. Analyze this user feedback and return ONLY valid JSON with exactly these keys: suggestedType (complaint|bug|suggestion|feature_request), sentiment (negative|neutral|positive), risk (low|medium|high), summary (max 240 characters), confidence (number 0 to 1). Never recommend deletion or banning.\n\nTitle: ${candidate.title}\nBody: ${candidate.body}\nEmail present: ${Boolean(candidate.email)}`,
      max_tokens: 220,
      temperature: 0,
      response_format: { type: "json_object" },
    } as never,
  );
  const parsed = parseResponse(result);
  const suggestedType = allowedTypes.has(parsed.suggestedType as never)
    ? (parsed.suggestedType as AiModerationReview["suggestedType"])
    : "suggestion";
  const sentiment = allowedSentiments.has(parsed.sentiment as never)
    ? (parsed.sentiment as AiModerationReview["sentiment"])
    : "neutral";
  const risk = allowedRisks.has(parsed.risk as never)
    ? (parsed.risk as AiModerationReview["risk"])
    : "low";
  const confidence = Number(parsed.confidence);
  return {
    suggestedType,
    sentiment,
    risk,
    summary: String(parsed.summary ?? "").slice(0, 240),
    confidence: Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : 0,
  };
};
