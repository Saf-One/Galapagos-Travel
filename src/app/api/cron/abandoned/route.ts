import {NextResponse} from "next/server";
import {runAbandonedFollowUp} from "@/lib/abandoned";

// GET /api/cron/abandoned  (admin-secret guarded)
// Runs abandoned-booking detection and seeds follow-up leads.
// Guard: header "x-admin-secret" or ?secret= must match ADMIN_CRON_SECRET.
// When ADMIN_CRON_SECRET is unset, the endpoint is disabled (returns 404-like
// 403) so it is safe by default in offline/demo environments.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = process.env.ADMIN_CRON_SECRET || "";
  if (!expected) {
    return NextResponse.json({ok: false, error: "disabled"}, {status: 403});
  }

  const url = new URL(req.url);
  const provided =
    req.headers.get("x-admin-secret") || url.searchParams.get("secret") || "";
  if (provided !== expected) {
    return NextResponse.json({ok: false, error: "unauthorized"}, {status: 401});
  }

  try {
    const result = await runAbandonedFollowUp();
    return NextResponse.json({ok: true, ...result});
  } catch (err) {
    console.error("[api/cron/abandoned] failed", err);
    return NextResponse.json({ok: false, error: "server"}, {status: 500});
  }
}
