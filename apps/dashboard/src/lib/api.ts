export const apiBase = "/api/v1";

export type ApiOptions = RequestInit & { projectKey?: string; serverKey?: string };

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { projectKey, serverKey, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (projectKey) requestHeaders.set("x-nitroping-project-key", projectKey);
  if (serverKey) requestHeaders.set("x-nitroping-server-key", serverKey);
  if (init.body && !requestHeaders.has("content-type"))
    requestHeaders.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: requestHeaders,
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { code?: string; message?: string };
  };
  if (!response.ok)
    throw new ApiError(
      data.error?.message ?? `Request failed (${response.status})`,
      response.status,
      data.error?.code,
    );
  return data;
}

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
