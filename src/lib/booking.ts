import {prisma} from "./prisma";
import {randomBytes} from "crypto";
import type {BookingStatus, PaymentProvider} from "@prisma/client";

// === CONFIGURABLE VALUES ===
// Booking domain helpers: reference generation, real-time availability,
// and the idempotent payment-confirmation path (Invoice + LoyaltyPoint).
//
// All functions are designed to run at request time (never at build time) and
// to fail soft so the offline/demo build stays green.

// Booking hold window: a PENDING booking is reserved for this long.
const HOLD_MINUTES = 15;

export function generateReference(): string {
  // Cryptographically random, unguessable reference (e.g. GP-4f9aBc...).
  // Avoids Date.now()-based enumeration of bookings.
  return `GP-${randomBytes(9).toString("base64url")}`;
}

// Loyalty points: 1 point per $10 USD (i.e. per 1000 cents).
export function loyaltyPointsFor(totalCents: number): number {
  return Math.floor(totalCents / 1000);
}

export function holdExpiry(): Date {
  return new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
}

export function isBookingExpired(expiresAt: Date | null, now = new Date()): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= now.getTime();
}

export interface AvailabilityResult {
  maxGuests: number;
  bookedGuests: number;
  remaining: number;
  soldOut: boolean;
}

// Real-time availability for a package + date: sum guests of all non-cancelled
// bookings for that package/date, compare to maxGuests.
export async function checkAvailability(
  packageId: string,
  startDate: Date
): Promise<AvailabilityResult | null> {
  const pkg = await prisma.package.findUnique({
    where: {id: packageId},
    select: {maxGuests: true},
  });
  if (!pkg) return null;

  const dayStart = startOfDay(startDate);
  const dayEnd = endOfDay(startDate);

  const bookings = await prisma.booking.findMany({
    where: {
      packageId,
      startDate: {gte: dayStart, lte: dayEnd},
      status: {in: ["CONFIRMED", "PAID"]},
    },
    select: {guests: true},
  });

  const bookedGuests = bookings.reduce((sum, b) => sum + b.guests, 0);
  const remaining = Math.max(0, pkg.maxGuests - bookedGuests);
  return {
    maxGuests: pkg.maxGuests,
    bookedGuests,
    remaining,
    soldOut: remaining <= 0,
  };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Idempotent payment confirmation. Marks the booking PAID, sets the provider,
// creates an Invoice (status PAID) and awards LoyaltyPoints (1 per $10 USD).
// No-ops safely if the booking is missing or already PAID/REFUNDED/CANCELLED.
export async function confirmPayment(
  reference: string,
  provider: PaymentProvider,
  paymentId?: string | null
): Promise<{ok: boolean; status: BookingStatus; alreadyPaid: boolean}> {
  const booking = await prisma.booking.findUnique({
    where: {reference},
    include: {package: {select: {title: true}}},
  });
  if (!booking) return {ok: false, status: "PENDING", alreadyPaid: false};

  if (booking.status === "PAID") {
    return {ok: true, status: "PAID", alreadyPaid: true};
  }
  // Do not resurrect cancelled/refunded bookings.
  if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
    return {ok: false, status: booking.status, alreadyPaid: false};
  }

  // Loyalty: 1 point per $10 (USD). Other currencies rounded to whole dollars
  // of the cent amount for a sensible demo value.
  const points = loyaltyPointsFor(booking.totalCents);

  await prisma.$transaction([
    prisma.booking.update({
      where: {reference},
      data: {
        status: "PAID",
        paymentProvider: provider,
        paymentId: paymentId ?? booking.paymentId,
        expiresAt: null,
      },
    }),
    prisma.invoice.create({
      data: {
        number: `INV-${reference}`,
        bookingId: booking.id,
        userId: booking.userId ?? "guest",
        amountCents: booking.totalCents,
        currency: booking.currency,
        status: "PAID",
        issuedAt: new Date(),
      },
    }),
    ...(booking.userId
      ? [
          prisma.loyaltyPoint.create({
            data: {
              userId: booking.userId,
              points,
              reason: "booking",
            },
          }),
        ]
      : []),
  ]);

  return {ok: true, status: "PAID", alreadyPaid: false};
}
