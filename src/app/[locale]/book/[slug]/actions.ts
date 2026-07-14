"use server";

import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";
import {
  generateReference,
  holdExpiry,
  checkAvailability,
  type AvailabilityResult,
} from "@/lib/booking";

// === CONFIGURABLE VALUES ===
// Server actions for the booking form: real-time availability + create booking.
// All DB access is at request time; nothing here runs at build.

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseLocalDate(startDateStr: string): Date | null {
  const d = new Date(`${startDateStr}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export type AvailabilityResponse =
  | {ok: true; availability: AvailabilityResult}
  | {ok: false; error: string};

// Real-time availability check used by the client form on date change.
export async function checkAvailabilityAction(
  packageId: string,
  startDateStr: string
): Promise<AvailabilityResponse> {
  const startDate = parseLocalDate(startDateStr);
  if (!startDate) return {ok: false, error: "invalid-date"};
  if (startDate.getTime() < startOfToday()) {
    return {ok: false, error: "past-date"};
  }

  const availability = await checkAvailability(packageId, startDate);
  if (!availability) return {ok: false, error: "package-not-found"};
  return {ok: true, availability};
}

export type CreateBookingResponse =
  | {ok: true; reference: string}
  | {ok: false; error: string};

// Creates a PENDING booking with a 15-minute hold. Returns the reference so the
// client can navigate to the pay/status page.
export async function createBookingAction(
  packageId: string,
  startDateStr: string,
  guests: number
): Promise<CreateBookingResponse> {
  const pkg = await prisma.package.findUnique({where: {id: packageId}});
  if (!pkg) return {ok: false, error: "package-not-found"};

  const startDate = parseLocalDate(startDateStr);
  if (!startDate) return {ok: false, error: "invalid-date"};
  if (startDate.getTime() < startOfToday()) {
    return {ok: false, error: "past-date"};
  }

  const guestsNum = Math.floor(Number(guests));
  if (
    !Number.isFinite(guestsNum) ||
    guestsNum < 1 ||
    guestsNum > pkg.maxGuests
  ) {
    return {ok: false, error: "invalid-guests"};
  }

  const availability = await checkAvailability(packageId, startDate);
  if (availability && availability.soldOut) {
    return {ok: false, error: "sold-out"};
  }
  if (availability && guestsNum > availability.remaining) {
    return {ok: false, error: "not-enough-spots"};
  }

  const user = await getCurrentUser();
  const reference = generateReference();

  await prisma.booking.create({
    data: {
      reference,
      packageId,
      startDate,
      guests: guestsNum,
      status: "PENDING",
      totalCents: pkg.priceInCents * guestsNum,
      currency: pkg.currency,
      userId: user?.id ?? null,
      paymentProvider: "NONE",
      expiresAt: holdExpiry(),
    },
  });

  return {ok: true, reference};
}
