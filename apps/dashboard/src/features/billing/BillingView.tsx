import { useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { api, errorMessage } from "@/lib/api";
import type { ApiOptions } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { notifyError, notifyInfo } from "@/lib/notify";
import type { Billing } from "@/lib/types";

const plans = [
  {
    id: "pro" as const,
    name: "Pro",
    price: "$29/mo",
    detail:
      "Multiple projects, roadmap, changelog, webhooks, custom themes, and longer retention.",
  },
  {
    id: "business" as const,
    name: "Business",
    price: "Custom",
    detail:
      "Advanced roles, SSO adapter, audit export, custom domains, retention controls, and SLA support.",
  },
];

export function BillingView({
  billing,
  credentials,
  projectId,
  onRefresh,
}: {
  billing: Billing | null;
  credentials: ApiOptions;
  projectId: string;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const checkout = async (plan: "pro" | "business") => {
    setBusy(plan);
    try {
      const result = await api<{ url: string | null }>(
        `/dashboard/billing/checkout?projectId=${encodeURIComponent(projectId)}`,
        { ...credentials, method: "POST", body: JSON.stringify({ plan }) },
      );
      if (result.url) location.assign(result.url);
      else notifyInfo("Billing checkout is unavailable.");
    } catch (error) {
      notifyError(errorMessage(error, "Billing checkout is unavailable."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Billing & usage"
        description="Manage your subscription and understand the limits applied to this workspace."
        action={
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCwIcon />
            Refresh
          </Button>
        }
      />

      <section className="max-w-[720px]">
        <SectionHeader
          title="Current subscription"
          description="Billing state is synchronized from the provider webhook."
        />
        <dl className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="py-3 pr-3">
            <dt className="text-[11px] text-muted-foreground">Plan</dt>
            <dd className="mt-0.5 text-lg font-medium capitalize">
              {billing?.plan ?? "free"}
            </dd>
          </div>
          <div className="py-3 pl-3">
            <dt className="text-[11px] text-muted-foreground">Status</dt>
            <dd className="mt-0.5 text-lg font-medium capitalize">
              {billing?.status ?? "active"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {billing?.currentPeriodEnd
            ? `Current period ends ${formatDate(billing.currentPeriodEnd)}`
            : "No paid subscription is active."}{" "}
          {billing?.providerSubscriptionId
            ? "Subscription is linked to Stripe."
            : "Upgrade to unlock higher limits and team features."}
        </p>
      </section>

      <section className="mt-8 max-w-[720px]">
        <SectionHeader title="Plans" description="Feedback and attachment limits are enforced server-side for every API request." />
        <div className="divide-y divide-border">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium">
                  {plan.name} <span className="text-muted-foreground">{plan.price}</span>
                </p>
                <p className="mt-0.5 max-w-[60ch] text-xs text-muted-foreground">
                  {plan.detail}
                </p>
              </div>
              <Button
                variant={plan.id === "pro" ? "default" : "outline"}
                disabled={busy !== null || billing?.plan === plan.id}
                onClick={() => void checkout(plan.id)}
              >
                {busy === plan.id
                  ? "Opening checkout…"
                  : billing?.plan === plan.id
                    ? "Current plan"
                    : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
