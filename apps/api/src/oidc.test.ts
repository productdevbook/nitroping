import { describe, expect, it, vi } from "vitest";
import { verifyOidcJwt, type OidcEnvironment } from "./oidc";

const encode = (value: unknown) =>
  btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");

const cache = (): KVNamespace => {
  const values = new Map<string, string>();
  return {
    get: vi.fn(async (key: string, type?: string) => {
      const value = values.get(key);
      return value === undefined
        ? null
        : type === "json"
          ? JSON.parse(value)
          : value;
    }),
    put: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  } as unknown as KVNamespace;
};

describe("OIDC identity verification", () => {
  it("rejects requests when OIDC is not configured", async () => {
    const result = await verifyOidcJwt(
      new Request("https://example.test", {
        headers: { authorization: "Bearer malformed" },
      }),
      { CACHE: cache() },
    );
    expect(result).toBeNull();
  });

  it("verifies issuer, audience, JWKS signature, and email claims", async () => {
    const issuer = "https://id.example.test";
    const keyPair = (await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2_048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    const jwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey;
    const header = encode({ alg: "RS256", kid: "test-key", typ: "JWT" });
    const payload = encode({
      iss: issuer,
      aud: "nitroping",
      sub: "user-1",
      email: "user@example.com",
      exp: Math.floor(Date.now() / 1_000) + 300,
    });
    const signingInput = `${header}.${payload}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      keyPair.privateKey,
      new TextEncoder().encode(signingInput),
    );
    const token = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, "")}`;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("openid-configuration")
        ? new Response(JSON.stringify({ issuer, jwks_uri: `${issuer}/jwks` }))
        : new Response(JSON.stringify({ keys: [{ ...jwk, kid: "test-key", alg: "RS256" }] })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const env: OidcEnvironment = {
      CACHE: cache(),
      OIDC_ISSUER_URL: issuer,
      OIDC_AUDIENCE: "nitroping",
    };
    const result = await verifyOidcJwt(
      new Request("https://example.test", {
        headers: { authorization: `Bearer ${token}` },
      }),
      env,
    );
    expect(result?.email).toBe("user@example.com");
    vi.unstubAllGlobals();
  });
});
