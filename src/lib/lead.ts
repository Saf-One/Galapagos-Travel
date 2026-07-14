import {prisma} from "./prisma";
import {createHubspotContact} from "./hubspot";

// === Lead capture + HubSpot sync helpers ===
// All functions are offline-safe: DB or HubSpot failures never throw to the
// caller (they log and return a sensible result), so builds and requests never
// crash when nothing is configured.

export interface LeadInput {
  email: string;
  name?: string;
  source?: string;
  payload?: Record<string, unknown>;
}

export interface CreateLeadResult {
  ok: boolean;
  synced: boolean;
}

// Very small email sanity check (avoids a dependency).
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Creates a Lead row (syncedToHubspot=false) then attempts an immediate
// HubSpot sync. If HubSpot is not configured, createHubspotContact no-ops and
// the row stays unsynced for a later syncLeadsToHubspot() pass.
export async function createLead(input: LeadInput): Promise<CreateLeadResult> {
  const {email, name, source = "website", payload = {}} = input;

  try {
    const lead = await prisma.lead.create({
      data: {
        email,
        name: name || null,
        source,
        payload: JSON.stringify(payload),
        syncedToHubspot: false,
      },
    });

    // Best-effort immediate sync (no-ops when HubSpot key absent).
    let synced = false;
    try {
      const res = await createHubspotContact(email, name, {
        lead_source: source,
      });
      if (res.ok && res.created) {
        await prisma.lead.update({
          where: {id: lead.id},
          data: {syncedToHubspot: true},
        });
        synced = true;
      }
    } catch (err) {
      console.error("[lead] immediate hubspot sync failed", err);
    }

    return {ok: true, synced};
  } catch (err) {
    console.error("[lead] create failed", err);
    return {ok: false, synced: false};
  }
}

// Idempotent batch sync: finds unsynced leads, pushes each to HubSpot, marks
// synced only on success. Safe to run repeatedly (a manual/admin trigger).
export async function syncLeadsToHubspot(): Promise<{
  processed: number;
  synced: number;
}> {
  let processed = 0;
  let synced = 0;

  try {
    const pending = await prisma.lead.findMany({
      where: {syncedToHubspot: false},
      take: 100,
      orderBy: {createdAt: "asc"},
    });

    for (const lead of pending) {
      processed += 1;
      try {
        const res = await createHubspotContact(
          lead.email,
          lead.name || undefined,
          {lead_source: lead.source || "website"}
        );
        if (res.ok && res.created) {
          await prisma.lead.update({
            where: {id: lead.id},
            data: {syncedToHubspot: true},
          });
          synced += 1;
        }
      } catch (err) {
        console.error(`[lead] sync failed for ${lead.id}`, err);
      }
    }
  } catch (err) {
    console.error("[lead] batch sync query failed", err);
  }

  return {processed, synced};
}
