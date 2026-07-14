import {setRequestLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {Button} from "@/components/Button";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";

// Export hub: link to the streaming CSV endpoint, plus a live preview count.
export const dynamic = "force-dynamic";

export default async function AdminExportPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let count = 0;
  let revenueCents = 0;
  let currency = "USD";
  try {
    const [agg] = await Promise.all([
      prisma.booking.findMany({
        where: {status: "PAID"},
        select: {totalCents: true, currency: true},
      }),
    ]);
    count = await prisma.booking.count();
    currency = agg[0]?.currency ?? "USD";
    revenueCents = agg.reduce((s, b) => s + b.totalCents, 0);
  } catch {
    // DB offline -> show neutral values.
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-navy">{t("navExport")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("bookingsCount")}: <span className="font-semibold text-navy">{count}</span>
          {" · "}
          {t("revenueTotal")}:{" "}
          <span className="font-semibold text-navy">
            {formatPrice(revenueCents, currency)}
          </span>
        </p>
        <div className="mt-5">
          <Link href="/api/admin/bookings/export">
            <Button variant="primary">{t("exportCsv")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
