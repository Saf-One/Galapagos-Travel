import {setRequestLocale, getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {Container} from "@/components/Container";
import {prisma} from "@/lib/prisma";
import {CONFIG} from "@/lib/config";
import {BookingForm} from "./BookingForm";

// Request-time data (DB) -> render dynamically.
export const dynamic = "force-dynamic";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function BookPackagePage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("booking");
  const tc = await getTranslations("common");

  let pkg = null;
  try {
    pkg = await prisma.package.findUnique({
      where: {slug},
      include: {images: {orderBy: {sortOrder: "asc"}}},
    });
  } catch {
    pkg = null;
  }

  if (!pkg) notFound();

  return (
    <div className="py-12">
      <Container>
        <Link
          href={`/packages/${pkg.slug}`}
          className="mb-6 inline-block text-sm text-muted transition-soft hover:text-navy"
        >
          ← {t("backToPackage")}
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Package summary */}
          <div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  pkg.images[0]?.url ||
                  "https://picsum.photos/seed/galapagos/640/480"
                }
                alt={pkg.images[0]?.alt || pkg.title}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="mt-6 font-serif text-3xl text-navy">{pkg.title}</h1>
            <p className="mt-2 text-muted">{pkg.summary}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-stone/40 bg-cream px-4 py-3">
                <dt className="text-muted">{tc("from")}</dt>
                <dd className="font-semibold text-navy">
                  {formatPrice(pkg.priceInCents, pkg.currency)} {tc("perPerson")}
                </dd>
              </div>
              <div className="rounded-lg border border-stone/40 bg-cream px-4 py-3">
                <dt className="text-muted">{tc("days")}</dt>
                <dd className="font-semibold text-navy">
                  {pkg.durationDays} {tc("days")}
                </dd>
              </div>
              <div className="rounded-lg border border-stone/40 bg-cream px-4 py-3">
                <dt className="text-muted">{t("maxGuests")}</dt>
                <dd className="font-semibold text-navy">{pkg.maxGuests}</dd>
              </div>
              <div className="rounded-lg border border-stone/40 bg-cream px-4 py-3">
                <dt className="text-muted">{t("location")}</dt>
                <dd className="font-semibold text-navy">{pkg.location}</dd>
              </div>
            </dl>
          </div>

          {/* Booking form */}
          <div className="rounded-2xl border border-stone/40 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 font-serif text-2xl text-navy">
              {t("title")}
            </h2>
            <p className="mb-6 text-sm text-muted">{CONFIG.siteName}</p>
            <BookingForm
              packageId={pkg.id}
              priceInCents={pkg.priceInCents}
              currency={pkg.currency}
              maxGuests={pkg.maxGuests}
              locale={locale}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
