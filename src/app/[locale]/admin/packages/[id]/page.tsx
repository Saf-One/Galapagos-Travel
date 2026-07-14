import {setRequestLocale, getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";
import {
  updatePackageAction,
  updatePriceAction,
  addPackageImageAction,
} from "../actions";
import {PackageForm} from "../PackageForm";
import {AddImageForm} from "../AddImageForm";

// Edit package: full form + image gallery + price update.
export const dynamic = "force-dynamic";

export default async function AdminEditPackagePage({
  params,
}: {
  params: Promise<{locale: string; id: string}>;
}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  let pkg:
    | Awaited<
        ReturnType<
          typeof prisma.package.findUnique<{
            where: {id: string};
            include: {images: {orderBy: {sortOrder: "asc"}}};
          }>
        >
      >
    | null = null;

  try {
    pkg = await prisma.package.findUnique({
      where: {id},
      include: {images: {orderBy: {sortOrder: "asc"}}},
    });
  } catch {
    pkg = null;
  }

  if (!pkg) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/packages"
        className="inline-block text-sm text-muted transition-soft hover:text-navy"
      >
        ← {t("navPackages")}
      </Link>

      <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-xl text-navy">
          {t("editPackage")}
        </h2>
        <PackageForm
          action={updatePackageAction.bind(null, id)}
          initial={{
            title: pkg.title,
            slug: pkg.slug,
            summary: pkg.summary,
            description: pkg.description,
            priceInCents: pkg.priceInCents,
            currency: pkg.currency,
            durationDays: pkg.durationDays,
            location: pkg.location,
            maxGuests: pkg.maxGuests,
            featured: pkg.featured,
          }}
        />
      </div>

      {/* Quick price update */}
      <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-serif text-lg text-navy">
          {t("updatePrice")}
        </h3>
        <p className="mb-3 text-sm text-muted">
          {formatPrice(pkg.priceInCents, pkg.currency)}
        </p>
        <form
          action={async (formData) => {
            "use server";
            await updatePriceAction(id, formData);
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label
              className="block text-sm font-medium text-navy"
              htmlFor="priceInCents"
            >
              {t("price")} (cents)
            </label>
            <input
              id="priceInCents"
              name="priceInCents"
              type="number"
              min={0}
              step={1}
              defaultValue={pkg.priceInCents}
              className="mt-1 w-40 rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-cream transition-soft hover:bg-teal"
          >
            {t("save")}
          </button>
        </form>
      </div>

      {/* Image gallery */}
      <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm">
        <h3 className="mb-3 font-serif text-lg text-navy">
          {t("imageUrl")}
        </h3>
        {pkg.images.length > 0 ? (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pkg.images.map((img: {id: string; url: string; alt: string}) => (
              <div key={img.id} className="overflow-hidden rounded-lg border border-stone/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt}
                  className="h-28 w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-5 text-sm text-muted">{t("noPackages")}</p>
        )}
        <AddImageForm
          action={addPackageImageAction.bind(null, id)}
          urlLabel={t("imageUrl")}
          altLabel={t("imageAlt")}
          submitLabel={t("addImage")}
        />
      </div>
    </div>
  );
}
