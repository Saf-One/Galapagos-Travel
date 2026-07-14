import {setRequestLocale} from "next-intl/server";
import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {Container} from "@/components/Container";
import {Link} from "@/i18n/navigation";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";
import {formatPrice} from "@/lib/format";
import {LogoutButton} from "./LogoutButton";

// Customer account dashboard reads the DB at request time.
export const dynamic = "force-dynamic";

// Translate a BookingStatus / InvoiceStatus enum value to a stable i18n key.
function bookingStatusKey(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "confirmed";
    case "PAID":
      return "paid";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

function invoiceStatusKey(status: string): string {
  switch (status) {
    case "ISSUED":
      return "issued";
    case "PAID":
      return "paid";
    case "REFUNDED":
      return "refunded";
    default:
      return "draft";
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-sand text-navy",
  confirmed: "bg-teal/15 text-teal",
  paid: "bg-gold/15 text-gold",
  cancelled: "bg-red-50 text-red-700",
  refunded: "bg-stone/30 text-muted",
  draft: "bg-sand text-navy",
  issued: "bg-teal/15 text-teal",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations("account");
  const tc = await getTranslations("common");

  const [bookings, invoices, loyaltyPoints] = await Promise.all([
    prisma.booking.findMany({
      where: {userId: user.id},
      include: {package: true},
      orderBy: {createdAt: "desc"},
    }),
    prisma.invoice.findMany({
      where: {userId: user.id},
      orderBy: {issuedAt: "desc"},
    }),
    prisma.loyaltyPoint.findMany({
      where: {userId: user.id},
      orderBy: {createdAt: "desc"},
    }),
  ]);

  const pointsBalance = loyaltyPoints.reduce((sum, p) => sum + p.points, 0);

  return (
    <Container className="py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 border-b border-stone/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl text-navy sm:text-4xl">
            {t("dashboardTitle")}
          </h1>
          <p className="mt-1 text-muted">
            {user.name ? `${user.name} · ` : ""}
            {user.email}
          </p>
        </div>
        <LogoutButton locale={locale} />
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Bookings */}
        <section>
          <h2 className="mb-4 font-serif text-2xl text-navy">
            {t("myBookings")}
          </h2>
          {bookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone/50 bg-cream/60 p-6 text-center text-muted">
              {t("noBookings")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.reference}`}
                  className="flex flex-col rounded-xl border border-stone/40 bg-white p-5 shadow-sm transition-soft hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-lg text-navy">
                      {b.package.title}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[bookingStatusKey(b.status)]
                      }`}
                    >
                      {t(`status.${bookingStatusKey(b.status)}`)}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm text-muted">
                    <div className="flex justify-between">
                      <dt>{t("bookingRef")}</dt>
                      <dd className="text-ink">{b.reference}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>{t("bookedOn")}</dt>
                      <dd className="text-ink">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(b.createdAt))}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>{t("guests")}</dt>
                      <dd className="text-ink">{b.guests}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>{t("total")}</dt>
                      <dd className="font-semibold text-navy">
                        {formatPrice(b.totalCents, b.currency)}
                      </dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Invoices */}
        <section>
          <h2 className="mb-4 font-serif text-2xl text-navy">
            {t("myInvoices")}
          </h2>
          {invoices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone/50 bg-cream/60 p-6 text-center text-muted">
              {t("noInvoices")}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-stone/40 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-sand/60 text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("invoiceNumber")}</th>
                    <th className="px-4 py-3 font-medium">{tc("from")}</th>
                    <th className="px-4 py-3 font-medium">{t("total")}</th>
                    <th className="px-4 py-3 font-medium">{t("status.lbl")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/30">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="text-ink">
                      <td className="px-4 py-3 font-medium">{inv.number}</td>
                      <td className="px-4 py-3 text-muted">
                        {inv.issuedAt
                          ? new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                            }).format(new Date(inv.issuedAt))
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatPrice(inv.amountCents, inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            STATUS_STYLES[invoiceStatusKey(inv.status)]
                          }`}
                        >
                          {t(`status.${invoiceStatusKey(inv.status)}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Loyalty */}
        <section>
          <h2 className="mb-4 font-serif text-2xl text-navy">{t("loyalty")}</h2>
          <div className="rounded-xl border border-stone/40 bg-navy px-6 py-5 text-cream">
            <p className="text-sm uppercase tracking-widest text-gold-light">
              {t("loyaltyBalance")}
            </p>
            <p className="mt-1 font-serif text-4xl">
              {pointsBalance.toLocaleString(locale)}{" "}
              <span className="text-lg text-cream/70">{t("points")}</span>
            </p>
          </div>

          {loyaltyPoints.length > 0 && (
            <ul className="mt-4 divide-y divide-stone/30 rounded-xl border border-stone/40 bg-white shadow-sm">
              {loyaltyPoints.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="text-ink">{p.reason}</p>
                    <p className="text-xs text-muted">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(p.createdAt))}
                    </p>
                  </div>
                  <span className="font-semibold text-teal">
                    {p.points > 0 ? `+${p.points}` : p.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}
