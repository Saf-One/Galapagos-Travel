import {cn} from "@/lib/utils";
import type {BookingStatus} from "@prisma/client";

// Shared booking-status pill, reused across admin booking views.
const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-700",
  REFUNDED: "bg-rose-100 text-rose-800",
};

export function StatusBadge({
  status,
  label,
}: {
  status: BookingStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-stone-200 text-stone-700"
      )}
    >
      {label}
    </span>
  );
}
