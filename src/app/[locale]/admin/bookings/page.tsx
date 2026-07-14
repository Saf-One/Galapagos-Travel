import {setRequestLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {Container} from "@/components/Container";
import {Button} from "@/components/Button";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";
import type {BookingStatus} from "@prisma/client";
import {StatusBadge} from "../StatusBadge";

// All booking statuses for the filter dropdown.
const ALL_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "CANCELLED",
  "REFUNDED",
];

// Request-time list of all bookings with package + user context.
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{[key: string]: string | string[] | undefined}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tBooking = await getTranslations("booking");

  const sp = await searchParams;
  const statusParam =
    typeof sp.status === "string"
      ? (sp.status.toUpperCase() as BookingStatus)
      : undefined;
  const filter =
    statusParam && ALL_STATUSES.includes(statusParam) ? statusParam : undefined;

  let bookings: Array<{
    id: string;
    reference: string;
    status: BookingStatus;
    startDate: Date;
    guests: number;
    totalCents: number;
    currency: string;
    package: {title: string};
    user: {email: string; name: string | null} | null;
  }> = [];

  try {
    bookings = await prisma.booking.findMany({
      where: filter ? {status: filter} : undefined,
      orderBy: {createdAt: "desc"},
      include: {
        package: {select: {title: true}},
        user: {select: {email: true, name: true}},
      },
    });
  } catch {
    // DB unavailable -> empty list, friendly empty state.
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/export">
          <Button variant="secondary" size="sm">
            {t("exportCsv")}
          </Button>
        </Link>
        <form className="flex items-center gap-2" method="get">
          <label className="text-sm text-muted" htmlFor="status">
            {t("filterStatus")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filter ?? ""}
            onChange={(e) => e.currentTarget.form?.submit()}
            className="rounded-lg border border-stone/50 bg-white px-3 py-1.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            <option value="">{t("all")}</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {tBooking(`status.${s}`)}
              </option>
            ))}
          </select>
        </form>
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-stone/40 bg-white p-8 text-center text-muted">
          {t("noBookings")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone/40 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("reference")}</th>
                <th className="px-4 py-3 font-semibold">{t("package")}</th>
                <th className="px-4 py-3 font-semibold">{t("guest")}</th>
                <th className="px-4 py-3 font-semibold">{t("dates")}</th>
                <th className="px-4 py-3 font-semibold">{t("guests")}</th>
                <th className="px-4 py-3 font-semibold">{t("total")}</th>
                <th className="px-4 py-3 font-semibold">{t("status")}</th>
                <th className="px-4 py-3 font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/30">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-sand/40">
                  <td className="px-4 py-3 font-mono text-xs text-navy">
                    {b.reference}
                  </td>
                  <td className="px-4 py-3 text-navy">{b.package.title}</td>
                  <td className="px-4 py-3 text-navy">
                    {b.user?.email ?? "Guest"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(b.startDate))}
                  </td>
                  <td className="px-4 py-3 text-navy">{b.guests}</td>
                  <td className="px-4 py-3 text-navy">
                    {formatPrice(b.totalCents, b.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} label={tBooking(`status.${b.status}`)} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-sm font-medium text-navy underline-offset-2 hover:text-teal hover:underline"
                    >
                      {t("viewDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
