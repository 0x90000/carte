"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Infinity as InfinityIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LifetimeBillingProps = {
  hasLifetimeAccess: boolean;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
};

export function LifetimeBilling({ hasLifetimeAccess, dailyLimit, usedToday, remainingToday }: LifetimeBillingProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.billing");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");

  async function buyLifetimeAccess() {
    setIsRedirecting(true);
    setError("");
    try {
      const response = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: "lifetime" }),
      });
      const payload = (await response.json()) as {
        data?: { checkoutUrl?: string };
        error?: { code?: string; message?: string };
      };
      if (payload.error?.code === "LIFETIME_ALREADY_ACTIVE") {
        router.refresh();
        return;
      }
      if (!response.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.code === "CHECKOUT_NOT_CONFIGURED" ? t("notConfigured") : t("checkoutError"));
      }
      window.location.assign(payload.data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : t("checkoutError"));
      setIsRedirecting(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="billing-heading">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
          <InfinityIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="billing-heading" className="text-base font-semibold">{hasLifetimeAccess ? t("activeTitle") : t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasLifetimeAccess
              ? t("usage", { remaining: remainingToday, limit: dailyLimit, used: usedToday })
              : t("description")}
          </p>
          {error ? <p className="mt-2 text-sm text-destructive" role="alert">{error}</p> : null}
        </div>
      </div>
      {hasLifetimeAccess ? (
        <span className="shrink-0 text-sm font-medium">{t("activeBadge")}</span>
      ) : (
        <Button className="shrink-0" onClick={() => void buyLifetimeAccess()} disabled={isRedirecting}>
          {isRedirecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <InfinityIcon className="h-4 w-4" aria-hidden="true" />}
          {isRedirecting ? t("redirecting") : t("buy")}
        </Button>
      )}
    </section>
  );
}
