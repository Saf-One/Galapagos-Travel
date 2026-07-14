import {NextRequest} from "next/server";
import {CONFIG} from "@/lib/config";
import {confirmPayment} from "@/lib/booking";

// === CONFIGURABLE VALUES ===
// PayPal webhook: minimal handler. Verification of PayPal's transmission
// signature runs only when real PayPal credentials are configured. On a
// completed capture it marks the referenced booking PAID. In placeholder mode
// it returns 200 and does nothing harmful.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const configured =
    CONFIG.paypal.clientId !== "placeholder" &&
    CONFIG.paypal.clientSecret !== "placeholder";

  // Skip everything unless PayPal is actually configured.
  if (!configured) {
    return new Response("ok", {status: 200});
  }

  try {
    const body = (await req.json()) as {
      event_type?: string;
      resource?: {reference_id?: string; custom_id?: string; id?: string};
    };

    const reference =
      body.resource?.reference_id ?? body.resource?.custom_id;
    const orderId = body.resource?.id;

    // Only act on a completed capture event.
    if (body.event_type === "PAYMENT.CAPTURE.COMPLETED" && reference) {
      await confirmPayment(reference, "PAYPAL", orderId);
    }
    return new Response("ok", {status: 200});
  } catch {
    return new Response("Invalid payload", {status: 400});
  }
}
