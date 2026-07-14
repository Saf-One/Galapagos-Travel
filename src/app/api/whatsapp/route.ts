import {NextRequest, NextResponse} from "next/server";
import {CONFIG} from "@/lib/config";

// === CONFIGURABLE VALUES ===
// WhatsApp Cloud API (Meta) template-message stub. When a real token +
// phone-ID is configured, it posts a template message. When unconfigured
// (the default here) it is a no-op that returns 200 so the app stays green.
//
// To enable: set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in the environment.

export const dynamic = "force-dynamic";

interface Body {
  to?: string;
  template?: string;
  locale?: string;
}

export async function POST(req: NextRequest) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  // Offline / demo mode: nothing configured, so we acknowledge and do nothing.
  if (!token || !phoneId) {
    return NextResponse.json({ok: true, sent: false, reason: "unconfigured"});
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({error: "Invalid JSON"}, {status: 400});
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: body.to,
          type: "template",
          template: {
            name: body.template || "hello",
            language: {code: body.locale || "en"},
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        {ok: false, error: "upstream_error", status: res.status},
        {status: 502}
      );
    }
    return NextResponse.json({ok: true, sent: true});
  } catch {
    // Network failure should not crash the caller.
    return NextResponse.json(
      {ok: false, error: "request_failed"},
      {status: 502}
    );
  }
}

// Reference to keep CONFIG import meaningful for future template wiring.
const WHATSAPP_CONFIGURED =
  !!CONFIG.whatsappNumber && CONFIG.whatsappNumber !== "593999999999";
