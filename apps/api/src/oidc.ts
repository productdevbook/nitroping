import { sha256 } from "./security";
import type { AccessClaims } from "./access";

export type OidcEnvironment = {
  CACHE: KVNamespace;
  OIDC_ISSUER_URL?: string;
  OIDC_AUDIENCE?: string;
};

type OidcDiscovery = { issuer?: string; jwks_uri?: string };
type OidcKey = JsonWebKey & { kid?: string; alg?: string; use?: string };
type OidcClaims = AccessClaims & {
  aud?: string | string[];
  nbf?: number;
  preferred_username?: string;
};

const decodeBase64Url = (value: string): ArrayBuffer => {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
};

const decodeJson = <T>(value: string): T =>
  JSON.parse(
    new TextDecoder().decode(new Uint8Array(decodeBase64Url(value))),
  ) as T;

const configured = (env: OidcEnvironment) => {
  const issuer = String(env.OIDC_ISSUER_URL ?? "").replace(/\/$/, "");
  const audience = String(env.OIDC_AUDIENCE ?? "");
  return issuer && audience ? { issuer, audience } : null;
};

const discoveryFor = async (
  env: OidcEnvironment,
  issuer: string,
): Promise<OidcDiscovery | null> => {
  const cacheKey = `oidc:discovery:${await sha256(issuer)}`;
  const cached = await env.CACHE.get(cacheKey, "json");
  if (cached && typeof cached === "object") return cached as OidcDiscovery;
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return null;
  const discovery = (await response.json()) as OidcDiscovery;
  if (
    discovery.issuer !== issuer ||
    typeof discovery.jwks_uri !== "string" ||
    !/^https:\/\//i.test(discovery.jwks_uri)
  )
    return null;
  await env.CACHE.put(cacheKey, JSON.stringify(discovery), {
    expirationTtl: 3_600,
  });
  return discovery;
};

const keysFor = async (
  env: OidcEnvironment,
  issuer: string,
  jwksUri: string,
): Promise<OidcKey[] | null> => {
  const cacheKey = `oidc:jwks:${await sha256(issuer)}`;
  const cached = await env.CACHE.get(cacheKey, "json");
  if (cached && typeof cached === "object" && Array.isArray((cached as { keys?: unknown }).keys))
    return (cached as { keys: OidcKey[] }).keys;
  const response = await fetch(jwksUri, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) return null;
  const result = (await response.json()) as { keys?: OidcKey[] };
  if (!Array.isArray(result.keys)) return null;
  await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3_600 });
  return result.keys;
};

const audienceMatches = (audience: string | string[] | undefined, expected: string) =>
  Array.isArray(audience) ? audience.includes(expected) : audience === expected;

/** Verify an OIDC bearer JWT without trusting unverified claims. */
export const verifyOidcJwt = async (
  request: Request,
  env: OidcEnvironment,
): Promise<AccessClaims | null> => {
  const configuration = configured(env);
  if (!configuration) return null;
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson<{ kid?: string; alg?: string }>(parts[0]);
    const claims = decodeJson<OidcClaims>(parts[1]);
    const now = Math.floor(Date.now() / 1_000);
    if (
      header.alg !== "RS256" ||
      !claims.exp ||
      claims.exp <= now ||
      (claims.nbf !== undefined && claims.nbf > now + 30) ||
      claims.iss !== configuration.issuer ||
      !audienceMatches(claims.aud, configuration.audience)
    )
      return null;
    const discovery = await discoveryFor(env, configuration.issuer);
    if (!discovery?.jwks_uri) return null;
    const keys = await keysFor(env, configuration.issuer, discovery.jwks_uri);
    const jwk = keys?.find((key) => key.kid === header.kid && key.alg !== "HS256");
    if (!jwk) return null;
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return null;
    const email = claims.email ?? claims.preferred_username;
    return email ? { ...claims, email } : null;
  } catch {
    return null;
  }
};
