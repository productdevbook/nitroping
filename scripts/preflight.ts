import { readFileSync } from "node:fs";

type CheckStatus = "ready" | "optional" | "missing" | "invalid";

export type PreflightCheck = {
  name: string;
  status: CheckStatus;
  message: string;
};

const wranglerConfig = readFileSync("apps/api/wrangler.jsonc", "utf8");
const deploymentVar = (name: string): string | undefined => {
  const match = wranglerConfig.match(
    new RegExp(`"${name}"\\s*:\\s*"([^"\\r\\n]*)"`),
  );
  return match?.[1]?.trim() || undefined;
};
const configured = (name: string): boolean =>
  Boolean(process.env[name]?.trim() || deploymentVar(name));

const strict = Bun.argv.includes("--strict");

// Cloudflare Worker secrets and CI secrets are deliberately unreadable here.
// When only such a value is missing, the integration is reported as configured
// so that publishing the public half of a pair does not fail the default run.
// --strict still requires every value to be present in the environment.
const externalSecrets = new Set([
  "GITHUB_CLIENT_SECRET",
  "TURNSTILE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CUSTOM_HOSTNAME_API_TOKEN",
  "NPM_TOKEN",
  "MAVEN_USERNAME",
  "MAVEN_TOKEN",
]);

const storedOutsideRepository = (missing: string[]): boolean =>
  !strict && missing.every((variable) => externalSecrets.has(variable));

const pairCheck = (
  name: string,
  first: string,
  second: string,
  required: boolean,
): PreflightCheck => {
  const firstSet = configured(first);
  const secondSet = configured(second);
  if (firstSet && secondSet)
    return { name, status: "ready", message: `${first} and ${second} are configured` };
  if (!firstSet && !secondSet)
    return {
      name,
      status: required ? "missing" : "optional",
      message: required
        ? `${first} and ${second} are required`
        : `${first} and ${second} are not configured`,
    };
  const missing = [first, second].filter((variable) => !configured(variable));
  if (storedOutsideRepository(missing))
    return {
      name,
      status: "ready",
      message: `${missing.join(" and ")} is stored as a secret outside this repository`,
    };
  return { name, status: "invalid", message: `${first} and ${second} must be configured together` };
};

const groupCheck = (
  name: string,
  variables: string[],
  required: boolean,
): PreflightCheck => {
  const present = variables.filter(configured);
  if (present.length === variables.length)
    return { name, status: "ready", message: `${variables.length} configuration values are present` };
  if (present.length === 0)
    return {
      name,
      status: required ? "missing" : "optional",
      message: required ? `${variables.join(", ")} are required` : "not configured",
    };
  const missing = variables.filter((variable) => !configured(variable));
  if (storedOutsideRepository(missing))
    return {
      name,
      status: "ready",
      message: `${missing.join(", ")} are stored as secrets outside this repository`,
    };
  return {
    name,
    status: "invalid",
    message: `Incomplete configuration; missing ${missing.join(", ")}`,
  };
};

const cloudflareCheck = (): PreflightCheck => {
  const accountId = configured("CLOUDFLARE_ACCOUNT_ID") || configured("ACCOUNT_ID");
  const token = configured("CLOUDFLARE_API_TOKEN") || configured("ACCOUNT_TOKEN");
  if (accountId && token)
    return { name: "Cloudflare deployment", status: "ready", message: "account and API token are configured" };
  if (!accountId && !token)
    return { name: "Cloudflare deployment", status: "optional", message: "not configured" };
  return {
    name: "Cloudflare deployment",
    status: "invalid",
    message: "an account ID and API token must be configured together",
  };
};

export const evaluatePreflight = (): PreflightCheck[] => [
  cloudflareCheck(),
  pairCheck("Dashboard identity", "ACCESS_TEAM_DOMAIN", "ACCESS_AUDIENCE", true),
  pairCheck("GitHub customer login", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", false),
  pairCheck("OIDC identity adapter", "OIDC_ISSUER_URL", "OIDC_AUDIENCE", false),
  groupCheck(
    "Stripe billing",
    [
      "STRIPE_SECRET_KEY",
      "STRIPE_PRICE_PRO",
      "STRIPE_PRICE_BUSINESS",
      "STRIPE_WEBHOOK_SECRET",
    ],
    false,
  ),
  pairCheck("Turnstile", "TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY", false),
  groupCheck(
    "Cloudflare for SaaS custom domains",
    [
      "CUSTOM_HOSTNAME_API_TOKEN",
      "CUSTOM_HOSTNAME_ZONE_ID",
      "CUSTOM_HOSTNAME_FALLBACK_ORIGIN",
    ],
    false,
  ),
  groupCheck("SDK npm publishing", ["NPM_TOKEN"], false),
  groupCheck("SDK Maven publishing", ["MAVEN_USERNAME", "MAVEN_TOKEN"], false),
  groupCheck("Transactional email", ["EMAIL_FROM"], false),
];

const checks = evaluatePreflight();
const symbols: Record<CheckStatus, string> = {
  ready: "✓",
  optional: "○",
  missing: "!",
  invalid: "×",
};

console.log("NitroPing configuration preflight");
for (const check of checks)
  console.log(`${symbols[check.status]} ${check.name}: ${check.message}`);

const failures = checks.filter(
  (check) => check.status === "invalid" || (strict && check.status === "missing"),
);
if (failures.length) {
  console.error(
    `\nPreflight failed with ${failures.length} issue${failures.length === 1 ? "" : "s"}.`,
  );
  process.exit(1);
}

if (!strict)
  console.log("\nOptional integrations may remain disabled. Use --strict before a production deployment.");
