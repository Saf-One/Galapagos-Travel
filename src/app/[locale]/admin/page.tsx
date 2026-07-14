import {setRequestLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {Button} from "@/components/Button";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";

// Dashboard cards: quick counts + paid revenue. Data at request time.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let bookingsCount = 0;
  let packagesCount = 0;
  let leadsCount = 0;
  let revenueCents = 0;
  let currency = "USD";

  try {
    const [bookings, packages, leads, paid] = await Promise.all([
      prisma.booking.count(),
      prisma.package.count(),
      prisma.lead.count(),
      prisma.booking.findMany({
        where: {status: "PAID"},
        select: {totalCents: true, currency: true},
      }),
    ]);
    bookingsCount = bookings;
    packagesCount = packages;
    leadsCount = leads;
    currency = paid[0]?.currency ?? "USD";
    revenueCents = paid.reduce((sum, b) => sum + b.totalCents, 0);
  } catch {
    // DB unavailable (e.g. offline build checks) -> show zeros.
  }

  const cards = [
    {label: t("bookingsCount"), value: bookingsCount, href: "/admin/bookings"},
    {label: t("navPackages"), value: packagesCount, href: "/admin/packages"},
    {label: t("navLeads"), value: leadsCount, href: "/admin/leads"},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-stone/40 bg-white p-5 shadow-sm transition-soft hover:border-gold"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 font-serif text-3xl text-navy">{c.value}</p>
          </Link>
        ))}
        <div className="rounded-2xl border border-gold/50 bg-white p-5 shadow-sm">
          <p className="text-sm text-muted">{t("revenueTotal")}</p>
          <p className="mt-2 font-serif text-3xl text-navy">
            {formatPrice(revenueCents, currency)}
          </p>
          <p className="mt-1 text-xs text-muted">{t("revenueSubtitle")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/bookings">
          <Button variant="primary">{t("navBookings")}</Button>
        </Link>
        <Link href="/admin/packages/new">
          <Button variant="gold">{t("newPackage")}</Button>
        </Link>
        <Link href="/admin/export">
          <Button variant="secondary">{t("exportCsv")}</Button>
        </Link>
      </div>
    </div>
  );
}
