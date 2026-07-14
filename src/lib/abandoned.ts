import {prisma} from "./prisma";
import {createLead} from "./lead";

// === Abandoned booking detection ===
// A booking is "abandoned" when it is still PENDING, its hold window has
// elapsed (expiresAt in the past, or created long ago with no expiry), and it
// never produced an Invoice. This is the trigger source for CRM follow-up.
//
// Offline-safe: no SMTP/ESP dependency. Detection returns rows; the follow-up
// hook logs and (optionally) seeds a Lead so HubSpot/CRM can nurture the
// customer. Wire a real ESP where noted by the TODO.

// === CONFIGURABLE VALUES ===
// Grace period after which a still-pending booking counts as abandoned.
const ABANDON_GRACE_MS = 60 * 60 * 1000; // 1 hour

export interface AbandonedBooking {
  id: string;
  reference: string;
  packageId: string;
  email: string | null;
  name: string | null;
  startDate: Date;
  guests: number;
  totalCents: number;
  currency: string;
}

// Finds PENDING bookings past their grace window with no invoice attached.
export async function findAbandonedBookings(
  now: Date = new Date()
): Promise<AbandonedBooking[]> {
  const cutoff = new Date(now.getTime() - ABANDON_GRACE_MS);

  try {
    const rows = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        invoices: {none: {}},
        OR: [
          {expiresAt: {lt: now}},
          {expiresAt: null, createdAt: {lt: cutoff}},
        ],
      },
      include: {user: true},
      take: 200,
      orderBy: {createdAt: "asc"},
    });

    return rows.map((b) => ({
      id: b.id,
      reference: b.reference,
      packageId: b.packageId,
      email: b.user?.email ?? null,
      name: b.user?.name ?? null,
      startDate: b.startDate,
      guests: b.guests,
      totalCents: b.totalCents,
      currency: b.currency,
    }));
  } catch (err) {
    console.error("[abandoned] query failed", err);
    return [];
  }
}

export interface FollowUpResult {
  found: number;
  leadsCreated: number;
}

// Detection + follow-up hook. For each abandoned booking with a known email we
// seed a Lead (so HubSpot/CRM can nurture) and log an intent to email.
// TODO: swap the console.log for a real ESP send (Resend/SendGrid/etc).
export async function runAbandonedFollowUp(
  now: Date = new Date()
): Promise<FollowUpResult> {
  const abandoned = await findAbandonedBookings(now);
  let leadsCreated = 0;

  for (const b of abandoned) {
    console.log(
      `[abandoned] booking ${b.reference} (pkg ${b.packageId}) abandoned; ` +
        `TODO send follow-up email to ${b.email ?? "unknown"}`
    );

    if (b.email) {
      const res = await createLead({
        email: b.email,
        name: b.name ?? undefined,
        source: "abandoned-booking",
        payload: {
          bookingReference: b.reference,
          packageId: b.packageId,
          guests: b.guests,
          totalCents: b.totalCents,
          currency: b.currency,
        },
      });
      if (res.ok) leadsCreated += 1;
    }
  }

  return {found: abandoned.length, leadsCreated};
}
