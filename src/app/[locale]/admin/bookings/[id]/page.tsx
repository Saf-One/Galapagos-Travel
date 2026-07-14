import {setRequestLocale, getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {Container} from "@/components/Container";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";
import {StatusBadge} from "../../StatusBadge";
import {BookingActions} from "../BookingActions";
import type {BookingStatus} from "@prisma/client";

// Request-time booking detail with admin status/refund controls.
export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{locale: string; id: string}>;
}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tBooking = await getTranslations("booking");

  let booking:
    | Awaited<
        ReturnType<
          typeof prisma.booking.findUnique<{
            where: {id: string};
            include: {
              package: true;
              user: {select: {email: true; name: true; id: true}};
              invoices: {orderBy: {issuedAt: "desc"}};
            };
          }>
        >
      >
    | null = null;

  try {
    booking = await prisma.booking.findUnique({
      where: {id},
      include: {
        package: true,
        user: {select: {email: true, name: true, id: true}},
        invoices: {orderBy: {issuedAt: "desc"}},
      },
    });
  } catch {
    booking = null;
  }

  if (!booking) notFound();

  const rows: Array<[string, string]> = [
    [t("reference"), booking.reference],
    [t("package"), booking.package.title],
    [t("guest"), booking.user?.email ?? "Guest"],
    [
      t("dates"),
      new Intl.DateTimeFormat(locale, {dateStyle: "long"}).format(
        new Date(booking.startDate)
      ),
    ],
    [t("guests"), String(booking.guests)],
    [t("total"), formatPrice(booking.totalCents, booking.currency)],
    [tBooking("provider"), booking.paymentProvider],
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bookings"
        className="inline-block text-sm text-muted transition-soft hover:text-navy"
      >
        ← {t("navBookings")}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-navy">
              {booking.package.title}
            </h2>
            <StatusBadge
              status={booking.status}
              label={tBooking(`status.${booking.status}`)}
            />
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between border-b border-stone/30 pb-3"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold text-navy">{value}</dd>
              </div>
            ))}
          </dl>

          {booking.invoices.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-navy">
                {tBooking("invoiceNumber")}
              </p>
              <ul className="space-y-1 text-sm text-muted">
                {booking.invoices.map((inv) => (
                  <li key={inv.id} className="flex justify-between">
                    <span className="font-mono text-xs">{inv.number}</span>
                    <span>{inv.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
          <BookingActions id={booking.id} status={booking.status} />
        </div>
      </div>
    </div>
  );
}
