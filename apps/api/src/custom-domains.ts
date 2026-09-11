export type CustomDomainValidationRecord = {
  type?: string;
  name?: string;
  value?: string;
  status?: string;
};

export type CloudflareCustomHostname = {
  id: string;
  hostname: string;
  status: string;
  sslStatus: string | null;
  validationRecords: CustomDomainValidationRecord[];
};

export const normalizeCustomHostname = (value: string): string =>
  value.trim().toLowerCase().replace(/\.$/, "");

export const validateCustomHostname = (
  value: string,
  providerZone = "nitroping.dev",
): string | null => {
  const hostname = normalizeCustomHostname(value);
  if (
    hostname.length < 4 ||
    hostname.length > 253 ||
    hostname === providerZone ||
    hostname.endsWith(`.${providerZone}`) ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  )
    return "Custom hostname is not allowed";
  const labels = hostname.split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length < 1 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    )
  )
    return "Custom hostname must be a valid DNS hostname";
  return null;
};

type CloudflareResponse = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: {
    id?: string;
    hostname?: string;
    status?: string;
    ssl?: {
      status?: string;
      validation_records?: CustomDomainValidationRecord[];
    };
  };
};

export class CloudflareCustomHostnameProvider {
  constructor(
    private readonly apiToken: string,
    private readonly zoneId: string,
    private readonly fallbackOrigin: string,
  ) {}

  private async call(
    path: string,
    init: RequestInit = {},
  ): Promise<CloudflareResponse> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(this.zoneId)}/custom_hostnames${path}`,
      {
        ...init,
        headers: {
          authorization: `Bearer ${this.apiToken}`,
          "content-type": "application/json",
          ...(init.headers ?? {}),
        },
      },
    );
    const result = (await response.json().catch(() => ({}))) as CloudflareResponse;
    if (!response.ok || result.success === false)
      throw new Error(
        result.errors?.[0]?.message ??
          `Cloudflare custom hostname request failed (${response.status})`,
      );
    return result;
  }

  async create(
    hostname: string,
    metadata: { organizationId: string; projectId: string },
  ): Promise<CloudflareCustomHostname> {
    const result = await this.call("", {
      method: "POST",
      body: JSON.stringify({
        hostname,
        custom_origin_server: this.fallbackOrigin || undefined,
        ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } },
        custom_metadata: {
          organization_id: metadata.organizationId,
          project_id: metadata.projectId,
        },
      }),
    });
    return this.map(result.result, hostname);
  }

  async get(id: string): Promise<CloudflareCustomHostname> {
    const result = await this.call(`/${encodeURIComponent(id)}`);
    return this.map(result.result, "");
  }

  async remove(id: string): Promise<void> {
    await this.call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  private map(
    result: CloudflareResponse["result"],
    fallbackHostname: string,
  ): CloudflareCustomHostname {
    if (!result?.id)
      throw new Error("Cloudflare did not return a custom hostname id");
    return {
      id: result.id,
      hostname: result.hostname ?? fallbackHostname,
      status: result.status ?? "pending_validation",
      sslStatus: result.ssl?.status ?? null,
      validationRecords: result.ssl?.validation_records ?? [],
    };
  }
}
