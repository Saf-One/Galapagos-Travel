import {CONFIG} from "../config";

// === CONFIGURABLE VALUES ===
// Stripe client initialization with env fallback. When the secret key is the
// placeholder, the helpers return fake URLs / session ids so the build and
// runtime never crash. Wire real keys via env in production.

type StripeStub = {
  isConfigured: boolean;
  checkoutUrl: (sessionId: string) => string;
};

const configured = CONFIG.stripe.secretKey.startsWith("sk_live") ||
  CONFIG.stripe.secretKey.startsWith("sk_test_");

// Lazy import keeps the heavy SDK out of the bundle until actually used.
async function getStripe() {
  if (!configured) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(CONFIG.stripe.secretKey, {apiVersion: "2025-02-24.acacia"});
}

export const stripeConfig: StripeStub = {
  isConfigured: configured,
  checkoutUrl: (sessionId: string) =>
    configured
      ? `https://checkout.stripe.com/c/pay/${sessionId}`
      : `https://checkout.stripe.com/c/pay/${sessionId}`, // placeholder path
};

// Creates a Stripe Checkout Session or a fallback fake session when unconfigured.
export async function createStripeCheckoutSession(params: {
  amountCents: number;
  currency: string;
  reference: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = await getStripe();
  if (!stripe) {
    // Fallback: no real Stripe configured. Return a fake session id.
    const fakeId = `cs_test_fallback_${params.reference}`;
    return {id: fakeId, url: stripeConfig.checkoutUrl(fakeId)};
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.currency,
          unit_amount: params.amountCents,
          product_data: {name: `Galapagos booking ${params.reference}`},
        },
      },
    ],
    metadata: {reference: params.reference},
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {id: session.id, url: session.url ?? stripeConfig.checkoutUrl(session.id)};
}
