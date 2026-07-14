"use client";

import {useState, useTransition} from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/Button";
import {payWithStripeAction, payWithPaypalAction} from "./actions";

// Payment buttons: Stripe + PayPal. Each triggers a server action that either
// redirects to the real provider (when configured) or to the simulated success
// URL (when unconfigured). The return handler is the source of truth.
export function PaymentButtons({
  reference,
  locale,
  canPay,
}: {
  reference: string;
  locale: string;
  canPay: boolean;
}) {
  const t = useTranslations("booking");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"stripe" | "paypal" | null>(null);

  function pay(provider: "stripe" | "paypal") {
    setBusy(provider);
    startTransition(async () => {
      if (provider === "stripe") {
        await payWithStripeAction(reference, locale);
      } else {
        await payWithPaypalAction(reference, locale);
      }
      // On error (action throws), reset so the user can retry.
      setBusy(null);
    });
  }

  if (!canPay) {
    return (
      <p className="text-sm font-medium text-muted">{t("paymentUnavailable")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        variant="primary"
        size="lg"
        disabled={pending}
        onClick={() => pay("stripe")}
      >
        {busy === "stripe" ? t("processing") : t("payWithStripe")}
      </Button>
      <Button
        variant="gold"
        size="lg"
        disabled={pending}
        onClick={() => pay("paypal")}
      >
        {busy === "paypal" ? t("processing") : t("payWithPaypal")}
      </Button>
    </div>
  );
}
