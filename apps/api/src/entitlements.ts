export type BillingPlan = "free" | "pro" | "business";

export type Entitlements = {
  organizations: number;
  projects: number;
  teamMembers: number;
  monthlyFeedback: number;
  attachmentBytes: number;
  customDomains: boolean;
  webhooks: boolean;
  roadmap: boolean;
  customTheme: boolean;
  advancedRoles: boolean;
};

export type EntitlementFeature =
  | "customDomains"
  | "webhooks"
  | "roadmap"
  | "customTheme"
  | "advancedRoles";

export const entitlements: Record<BillingPlan, Entitlements> = {
  free: {
    organizations: 1,
    projects: 1,
    teamMembers: 1,
    monthlyFeedback: 100,
    attachmentBytes: 25 * 1024 * 1024,
    customDomains: false,
    webhooks: false,
    roadmap: false,
    customTheme: false,
    advancedRoles: false,
  },
  pro: {
    organizations: 20,
    projects: 20,
    teamMembers: 10,
    monthlyFeedback: 5_000,
    attachmentBytes: 5 * 1024 * 1024 * 1024,
    customDomains: false,
    webhooks: true,
    roadmap: true,
    customTheme: true,
    advancedRoles: false,
  },
  business: {
    organizations: 1_000,
    projects: 1_000,
    teamMembers: 1_000,
    monthlyFeedback: 50_000,
    attachmentBytes: 50 * 1024 * 1024 * 1024,
    customDomains: true,
    webhooks: true,
    roadmap: true,
    customTheme: true,
    advancedRoles: true,
  },
};

export const normalizePlan = (value: string | null | undefined): BillingPlan =>
  value === "pro" || value === "business" ? value : "free";

export const entitlementsFor = (
  value: string | null | undefined,
): Entitlements => entitlements[normalizePlan(value)];

export const hasEntitlement = (
  value: string | null | undefined,
  feature: EntitlementFeature,
): boolean => Boolean(entitlementsFor(value)[feature]);
