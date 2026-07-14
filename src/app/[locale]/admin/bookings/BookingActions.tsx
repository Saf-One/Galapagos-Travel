"use client";

import {useTransition} from "react";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {Button} from "@/components/Button";
import type {BookingStatus} from "@prisma/client";
import {
  updateBookingStatusAction,
  processRefundAction,
} from "./actions";

// Client form controls for a single booking: status change + refund.
export function BookingActions({
  id,
  status,
}: {
  id: string;
  status: BookingStatus;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ok: boolean; error?: string}>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        router.refresh();
      } else {
        // Surfaced via console for operators; UI stays functional.
        console.error(res.error ?? t("errorGeneric"));
      }
    });
  };

  const statuses: BookingStatus[] = [
    "CONFIRMED",
    "PAID",
    "CANCELLED",
    "REFUNDED",
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-navy">{t("status")}</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={status === s ? "gold" : "secondary"}
              size="sm"
              disabled={pending || status === s}
              onClick={() => run(() => updateBookingStatusAction(id, s))}
            >
              {t(`status.${s}`)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        {status !== "REFUNDED" && (
          <Button
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (confirm(t("confirmRefund"))) {
                run(() => processRefundAction(id));
              }
            }}
          >
            {t("refund")}
          </Button>
        )}
      </div>
    </div>
  );
}
