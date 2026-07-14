import {NextResponse} from "next/server";
import {createLead, isValidEmail} from "@/lib/lead";

// POST /api/lead  { email, name?, source?, payload? }
// Creates a Lead row and attempts a HubSpot sync. Never throws to the client.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      source?: string;
      payload?: Record<string, unknown>;
    };

    const email = (body.email || "").trim();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {ok: false, error: "invalid_email"},
        {status: 400}
      );
    }

    const result = await createLead({
      email,
      name: body.name?.trim() || undefined,
      source: body.source?.trim() || "website",
      payload: body.payload || {},
    });

    if (!result.ok) {
      return NextResponse.json({ok: false, error: "server"}, {status: 500});
    }

    return NextResponse.json({ok: true, synced: result.synced});
  } catch (err) {
    console.error("[api/lead] unexpected", err);
    return NextResponse.json({ok: false, error: "server"}, {status: 500});
  }
}
