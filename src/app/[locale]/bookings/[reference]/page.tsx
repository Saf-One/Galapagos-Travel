import {setRequestLocale, getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {Container} from "@/components/Container";
import {Button} from "@/components/Button";
import {prisma} from "@/lib/prisma";
import {isBookingExpired} from "@/lib/booking";
import {confirmPaymentAction} from "./actions";
import {PaymentButtons} from "./PaymentButtons";
import type {PaymentProvider} from "@prisma/client";

// Request-time data (DB) -> render dynamically.
export const dynamic = "force-dynamic";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-stone-200 text-stone-700",
  REFUNDED: "bg-rose-100 text-rose-800",
};

export default async function BookingStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string; reference: string}>;
  searchParams: Promise<{[key: string]: string | string[] | undefined}>;
}) {
  const {locale, reference} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("booking");

  const booking = await prisma.booking.findUnique({
    where: {reference},
    include: {package: true, invoices: {orderBy: {issuedAt: "desc"}}},
  });

  if (!booking) notFound();

  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : undefined;
  const providerParam =
    typeof sp.provider === "string"
      ? (sp.provider.toUpperCase() as PaymentProvider)
      : undefined;

  // If the user returns from a (simulated or real) success redirect, confirm the
  // payment. This is idempotent: already-PAID bookings are skipped.
  let confirmed: Awaited<ReturnType<typeof confirmPaymentAction>> | null = null;
  if (statusParam === "success" && providerParam) {
    confirmed = await confirmPaymentAction(reference, providerParam);
  }

  const isPaid = booking.status === "PAID" || confirmed?.status === "PAID";
  const expired =
    booking.status === "PENDING" && isBookingExpired(booking.expiresAt);

  const invoiceNumber =
    confirmed?.invoiceNumber ?? booking.invoices[0]?.number;
  const points =
    confirmed?.points ?? Math.floor(booking.totalCents / 1000);

  return (
    <div className="py-12">
      <Container className="max-w-3xl">
        <Link
          href={`/packages/${booking.package.slug}`}
          className="mb-6 inline-block text-sm text-muted transition-soft hover:text-navy"
        >
          ← {t("backToPackage")}
        </Link>

        <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm sm:p-8">
          {/* Success banner */}
          {isPaid && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <h2 className="font-serif text-xl text-emerald-800">
                {t("paymentSuccess")}
              </h2>
              {invoiceNumber && (
                <p className="mt-1 text-sm text-emerald-700">
                  {t("invoiceNumber")}:{" "}
                  <span className="font-semibold">{invoiceNumber}</span>
                </p>
              )}
              {booking.userId && points > 0 && (
                <p className="mt-1 text-sm text-emerald-700">
                  {t("loyaltyEarned")}:{" "}
                  <span className="font-semibold">{points}</span>
                </p>
              )}
            </div>
          )}

          {/* Header / status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-serif text-2xl text-navy">{t("title")}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[booking.status] ?? "bg-stone-200 text-stone-700"
              }`}
            >
              {t(`status.${booking.status}`)}
            </span>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-stone/30 pb-3">
              <dt className="text-muted">{t("bookingRef")}</dt>
              <dd className="font-mono font-semibold text-navy">
                {booking.reference}
              </dd>
            </div>
            <div className="flex justify-between border-b border-stone/30 pb-3">
              <dt className="text-muted">{t("package")}</dt>
              <dd className="font-semibold text-navy">
                {booking.package.title}
              </dd>
            </div>
            <div className="flex justify-between border-b border-stone/30 pb-3">
              <dt className="text-muted">{t("startDate")}</dt>
              <dd className="font-semibold text-navy">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "long",
                }).format(new Date(booking.startDate))}
              </dd>
            </div>
            <div className="flex justify-between border-b border-stone/30 pb-3">
              <dt className="text-muted">{t("guests")}</dt>
              <dd className="font-semibold text-navy">{booking.guests}</dd>
            </div>
            <div className="flex justify-between border-b border-stone/30 pb-3">
              <dt className="text-muted">{t("total")}</dt>
              <dd className="font-semibold text-navy">
                {formatPrice(booking.totalCents, booking.currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t("provider")}</dt>
              <dd className="font-semibold text-navy">
                {booking.paymentProvider}
              </dd>
            </div>
          </dl>

          {/* Actions */}
          <div className="mt-8">
            {isPaid ? (
              <Link href={`/packages/${booking.package.slug}`}>
                <Button variant="secondary">{t("backToPackage")}</Button>
              </Link>
            ) : expired ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {t("expired")}
                </p>
                <Link href={`/packages/${booking.package.slug}`}>
                  <Button variant="gold">{t("startNewBooking")}</Button>
                </Link>
              </div>
            ) : booking.status === "PENDING" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted">{t("choosePayment")}</p>
                <PaymentButtons
                  reference={booking.reference}
                  locale={locale}
                  canPay={!isPaid && !expired}
                />
              </div>
            ) : (
              <p className="text-sm text-muted">
                {t(`status.${booking.status}`)}
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
