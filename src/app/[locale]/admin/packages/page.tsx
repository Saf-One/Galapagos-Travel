import {setRequestLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {Button} from "@/components/Button";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";
import {DeletePackageButton} from "./DeletePackageButton";

// Request-time list of all packages with quick actions.
export const dynamic = "force-dynamic";

export default async function AdminPackagesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let packages: Array<{
    id: string;
    title: string;
    slug: string;
    priceInCents: number;
    currency: string;
    durationDays: number;
    location: string;
    maxGuests: number;
    featured: boolean;
    _count: {bookings: number};
  }> = [];

  try {
    packages = await prisma.package.findMany({
      orderBy: {createdAt: "desc"},
      include: {_count: {select: {bookings: true}}},
    });
  } catch {
    // DB offline -> empty list.
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-navy">{t("navPackages")}</h2>
        <Link href="/admin/packages/new">
          <Button variant="gold" size="sm">
            {t("newPackage")}
          </Button>
        </Link>
      </div>

      {packages.length === 0 ? (
        <p className="rounded-2xl border border-stone/40 bg-white p-8 text-center text-muted">
          {t("noPackages")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone/40 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("packageTitle")}</th>
                <th className="px-4 py-3 font-semibold">{t("location")}</th>
                <th className="px-4 py-3 font-semibold">{t("priceUsd")}</th>
                <th className="px-4 py-3 font-semibold">{t("durationDays")}</th>
                <th className="px-4 py-3 font-semibold">{t("maxGuests")}</th>
                <th className="px-4 py-3 font-semibold">{t("featured")}</th>
                <th className="px-4 py-3 font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/30">
              {packages.map((p) => (
                <tr key={p.id} className="hover:bg-sand/40">
                  <td className="px-4 py-3 font-semibold text-navy">
                    <Link
                      href={`/admin/packages/${p.id}`}
                      className="hover:text-teal hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.location}</td>
                  <td className="px-4 py-3 text-navy">
                    {formatPrice(p.priceInCents, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-navy">{p.durationDays}</td>
                  <td className="px-4 py-3 text-navy">{p.maxGuests}</td>
                  <td className="px-4 py-3 text-navy">
                    {p.featured ? "★" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/packages/${p.id}`}
                        className="text-sm font-medium text-navy hover:text-teal hover:underline"
                      >
                        {t("edit")}
                      </Link>
                      <DeletePackageButton id={p.id} label={t("confirmDelete")} />
                    </div>
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
