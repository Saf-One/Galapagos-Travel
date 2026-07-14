"use server";

import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";
import type {BookingStatus} from "@prisma/client";

// === CONFIGURABLE VALUES ===
// Admin server actions for booking management: status changes, idempotent
// refunds, and package/invoice bookkeeping. All DB access is request-time.
// When payment clients are unconfigured we only update the DB (no gateway call).

// Statuses an admin is allowed to set manually.
const ALLOWED_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "PAID",
  "CANCELLED",
  "REFUNDED",
];

export type BookingActionResult = {ok: boolean; error?: string};

// Change a booking's status (CONFIRMED/PAID/CANCELLED/REFUNDED).
export async function updateBookingStatusAction(
  id: string,
  status: BookingStatus
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return {ok: false, error: "unauthorized"};
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return {ok: false, error: "invalid-status"};
  }

  try {
    await prisma.booking.update({
      where: {id},
      data: {status},
    });
    revalidatePath(`/admin/bookings`);
    revalidatePath(`/admin/bookings/${id}`);
    return {ok: true};
  } catch {
    return {ok: false, error: "generic"};
  }
}

// Idempotent refund: mark the booking REFUNDED, and mark any related invoice
// REFUNDED. No loyalty points are awarded. When payment clients are not
// configured we just update the DB (no real gateway call).
export async function processRefundAction(
  id: string
): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return {ok: false, error: "unauthorized"};
  }

  try {
    const booking = await prisma.booking.findUnique({where: {id}});
    if (!booking) return {ok: false, error: "not-found"};

    // Already refunded -> idempotent no-op.
    if (booking.status === "REFUNDED") return {ok: true};

    await prisma.$transaction([
      prisma.booking.update({
        where: {id},
        data: {status: "REFUNDED", expiresAt: null},
      }),
      // Mark any existing invoice(s) for this booking as REFUNDED.
      prisma.invoice.updateMany({
        where: {bookingId: id, status: {not: "REFUNDED"}},
        data: {status: "REFUNDED"},
      }),
    ]);

    revalidatePath(`/admin/bookings`);
    revalidatePath(`/admin/bookings/${id}`);
    return {ok: true};
  } catch {
    return {ok: false, error: "generic"};
  }
}
