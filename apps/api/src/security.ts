const encoder = new TextEncoder();

export const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const randomToken = (prefix: string): string => `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;

export const clientIp = (request: Request): string => request.headers.get("CF-Connecting-IP") ?? "unknown";

export const timingSafeEqual = (left: string, right: string): boolean => {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a[index] ^ b[index];
  return result === 0;
};
