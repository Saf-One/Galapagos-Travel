import {NextRequest} from "next/server";
import {CONFIG} from "@/lib/config";
import {confirmPayment} from "@/lib/booking";

// === CONFIGURABLE VALUES ===
// Stripe webhook: verifies the signature ONLY when a real webhook secret is
// configured, then marks the referenced booking PAID (Invoice + LoyaltyPoint).
// In unconfigured (demo) mode it performs no verification and does nothing
// harmful, returning 200 so external pings never break the app.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  const secret = CONFIG.stripe.webhookSecret;

  // Verify the signature only when a real secret is present and a signature
  // header was sent. Otherwise skip (offline / placeholder mode).
  if (secret && secret !== "whsec_placeholder" && sig) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(CONFIG.stripe.secretKey, {
        apiVersion: "2025-02-24.acacia",
      });
      const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as {
          id: string;
          metadata?: {reference?: string};
        };
        const reference = session.metadata?.reference;
        if (reference) {
          await confirmPayment(reference, "STRIPE", session.id);
        }
      }
      return new Response("ok", {status: 200});
    } catch {
      return new Response("Invalid signature", {status: 400});
    }
  }

  // Unconfigured: nothing to verify, nothing to do.
  return new Response("ok", {status: 200});
}
