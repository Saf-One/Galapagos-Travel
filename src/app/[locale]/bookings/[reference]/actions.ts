"use server";

import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {CONFIG} from "@/lib/config";
import {stripeConfig, createStripeCheckoutSession} from "@/lib/payments/stripe";
import {paypalConfig, createPaypalOrder} from "@/lib/payments/paypal";
import {confirmPayment} from "@/lib/booking";
import type {PaymentProvider} from "@prisma/client";

// === CONFIGURABLE VALUES ===
// Server actions for the booking pay/status page: Stripe + PayPal payment
// initiation (with offline fallback) and the idempotent payment confirmation.
// All DB / payment access is at request time, never at build.

function buildUrls(
  locale: string,
  reference: string
): {successUrl: string; cancelUrl: string} {
  const base = `${CONFIG.siteUrl}/${locale}/bookings/${reference}`;
  return {
    successUrl: `${base}?status=success&provider=`,
    cancelUrl: `${base}?status=cancel`,
  };
}

async function getBookingOrThrow(reference: string) {
  const booking = await prisma.booking.findUnique({
    where: {reference},
    include: {package: {select: {title: true}}},
  });
  if (!booking) throw new Error("booking-not-found");
  return booking;
}

// Stripe: create a checkout session. If not configured (placeholder keys),
// we cannot reach Stripe, so we redirect straight to the success URL with the
// provider set, letting the return handler mark the booking PAID (simulated).
export async function payWithStripeAction(
  reference: string,
  locale: string
): Promise<void> {
  const booking = await getBookingOrThrow(reference);
  const {successUrl, cancelUrl} = buildUrls(locale, reference);

  if (!stripeConfig.isConfigured) {
    redirect(`${successUrl}stripe` as `/${string}`);
    return;
  }

  const session = await createStripeCheckoutSession({
    amountCents: booking.totalCents,
    currency: booking.currency,
    reference: booking.reference,
    successUrl: `${successUrl}stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl,
  });

  if (session.url) redirect(session.url as `/${string}`);
  // No URL: fall back to simulated success.
  redirect(`${successUrl}stripe` as `/${string}`);
}

// PayPal: create an order. If not configured, redirect to success URL with the
// provider set so the return handler marks the booking PAID (simulated).
export async function payWithPaypalAction(
  reference: string,
  locale: string
): Promise<void> {
  const booking = await getBookingOrThrow(reference);
  const {successUrl} = buildUrls(locale, reference);

  if (!paypalConfig.isConfigured) {
    redirect(`${successUrl}paypal` as `/${string}`);
    return;
  }

  const order = await createPaypalOrder({
    amountCents: booking.totalCents,
    currency: booking.currency,
    reference: booking.reference,
  });

  // Real PayPal: the approve URL is the source of truth. We redirect there;
  // the webhook + return handler remain authoritative for marking PAID.
  redirect(order.url as `/${string}`);
}

export type ConfirmPaymentResult = {
  ok: boolean;
  status: string;
  alreadyPaid: boolean;
  invoiceNumber?: string;
  points?: number;
};

// Idempotent confirmation invoked from the success return page. Marks PAID,
// issues invoice and loyalty, then returns the result for the page to render.
export async function confirmPaymentAction(
  reference: string,
  provider: PaymentProvider
): Promise<ConfirmPaymentResult> {
  const result = await confirmPayment(reference, provider);
  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      alreadyPaid: result.alreadyPaid,
    };
  }

  const booking = await prisma.booking.findUnique({
    where: {reference},
    include: {invoices: {orderBy: {issuedAt: "desc"}}, package: true},
  });

  const invoiceNumber = booking?.invoices[0]?.number;
  const points = booking ? Math.floor(booking.totalCents / 1000) : 0;

  return {
    ok: true,
    status: result.status,
    alreadyPaid: result.alreadyPaid,
    invoiceNumber,
    points,
  };
}
