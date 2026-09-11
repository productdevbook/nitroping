import { clientIp } from "./security";

export type TurnstileEnvironment = {
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
};

export const verifyTurnstile = async (
  env: TurnstileEnvironment,
  request: Request,
  token: unknown,
): Promise<boolean> => {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || token.length < 1 || token.length > 2048)
    return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: clientIp(request),
          idempotency_key: crypto.randomUUID(),
        }),
      },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
    };
    return (
      result.success === true &&
      (result.action === undefined || result.action === "feedback")
    );
  } catch {
    return false;
  }
};
