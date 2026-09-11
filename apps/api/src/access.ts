import { sha256 } from "./security";

export type AccessClaims = { aud?: string[]; email?: string; sub?: string; iss?: string; exp?: number };
type AccessKey = JsonWebKey & { kid?: string; alg?: string; use?: string };

const decode = (value: string): ArrayBuffer => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
};

const jsonPart = <T>(value: string): T => JSON.parse(new TextDecoder().decode(new Uint8Array(decode(value)))) as T;

export const verifyAccessJwt = async (request: Request, env: Env): Promise<AccessClaims | null> => {
  const teamDomain = String(env.ACCESS_TEAM_DOMAIN ?? "").replace(/\/$/, "");
  const audience = String(env.ACCESS_AUDIENCE ?? "");
  if (!teamDomain || !audience) return null;
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = jsonPart<{ kid?: string; alg?: string }>(parts[0]);
    const claims = jsonPart<AccessClaims>(parts[1]);
    if (header.alg !== "RS256" || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000) || claims.iss !== teamDomain) return null;
    const audiences = claims.aud ?? [];
    if (!audiences.includes(audience)) return null;
    const cacheKey = `access-jwks:${await sha256(teamDomain)}`;
    const cached = await env.CACHE.get(cacheKey, "json") as { keys: AccessKey[] } | null;
    const jwks = cached ?? await (async () => {
      const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
      if (!response.ok) return null;
      const result = await response.json() as { keys: AccessKey[] };
      await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
      return result;
    })();
    const jwk = jwks?.keys.find((key) => key.kid === header.kid);
    if (!jwk) return null;
    const cryptoKey = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, decode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return valid ? claims : null;
  } catch {
    return null;
  }
};
