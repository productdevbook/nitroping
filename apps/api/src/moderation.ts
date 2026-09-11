export type ModerationCandidate = {
  title: string;
  body: string;
  email?: string | null;
};

export type ModerationFlag =
  | "excessive_links"
  | "repeated_content"
  | "spam_language"
  | "empty_content"
  | "suspicious_email"
  | "duplicate_feedback";

export type ModerationAnalysis = {
  version: 1;
  decision: "review" | "clear";
  flags: ModerationFlag[];
  score: number;
};

const spamLanguage = /(?:buy\s+now|free\s+money|crypto\s+offer|click\s+here|viagra|casino|seo\s+service)/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalize = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .trim();

export const analyzeModeration = (
  candidate: ModerationCandidate,
): ModerationAnalysis => {
  const title = normalize(candidate.title);
  const body = normalize(candidate.body);
  const combined = `${title} ${body}`.trim();
  const flags: ModerationFlag[] = [];

  if (!combined) flags.push("empty_content");
  if ((combined.match(/https?:\/\//g) ?? []).length >= 3)
    flags.push("excessive_links");
  if (combined.length >= 80 && new Set(combined.replace(/\s/g, "")).size <= 4)
    flags.push("repeated_content");
  if (spamLanguage.test(combined)) flags.push("spam_language");
  if (candidate.email && !emailPattern.test(candidate.email.trim()))
    flags.push("suspicious_email");

  const score = Math.min(1, flags.length * 0.2 + (flags.includes("spam_language") ? 0.3 : 0));
  return {
    version: 1,
    decision: flags.length > 0 ? "review" : "clear",
    flags,
    score,
  };
};
