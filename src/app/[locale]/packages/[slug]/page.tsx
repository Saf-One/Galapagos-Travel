import {setRequestLocale, getTranslations} from "next-intl/server";
import type {Metadata} from "next";
import Image from "next/image";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {Container} from "@/components/Container";
import {Button} from "@/components/Button";
import {JsonLd} from "@/components/seo/JsonLd";
import {prisma} from "@/lib/prisma";
import {formatPrice} from "@/lib/format";
import {deriveHighlights} from "@/lib/types";
import {localeUrl, hreflangAlternates} from "@/lib/seo";
import type {AppLocale} from "@/lib/config";

// ISR: re-generate the package detail at most hourly (served from CDN).
export const revalidate = 3600;

// === CONFIGURABLE VALUES ===
// Maximum promo discount applied (guard). 0 = no cap.
const MAX_DISCOUNT_PERCENT = 0;

async function getPackageBySlug(slug: string) {
  try {
    return await prisma.package.findUnique({
      where: {slug},
      include: {
        images: {orderBy: {sortOrder: "asc"}},
      },
    });
  } catch {
    return null;
  }
}

async function getActivePromotions() {
  const now = new Date();
  try {
    return await prisma.promotion.findMany({
      where: {
        active: true,
        startDate: {lte: now},
        endDate: {gte: now},
      },
    });
  } catch {
    return [];
  }
}

function discountedCents(priceInCents: number, discountPercent: number): number {
  const pct =
    MAX_DISCOUNT_PERCENT > 0
      ? Math.min(discountPercent, MAX_DISCOUNT_PERCENT)
      : discountPercent;
  return Math.round(priceInCents * (1 - pct / 100));
}

export async function generateStaticParams() {
  // Optional pre-render hints. The page is force-dynamic, so this is a no-op
  // safety net and DB failures here do not break the build.
  try {
    const rows = await prisma.package.findMany({
      select: {slug: true},
      take: 50,
    });
    return rows.map((r) => ({slug: r.slug}));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const pkg = await getPackageBySlug(slug);
  const path = `/packages/${slug}`;
  if (!pkg) {
    return {
      alternates: {
        canonical: localeUrl(locale as AppLocale, path),
        languages: hreflangAlternates(path),
      },
    };
  }
  return {
    title: pkg.title,
    description: pkg.summary,
    alternates: {
      canonical: localeUrl(locale as AppLocale, path),
      languages: hreflangAlternates(path),
    },
    openGraph: {
      title: pkg.title,
      description: pkg.summary,
      url: localeUrl(locale as AppLocale, path),
      type: "website",
      images: pkg.images[0]?.url
        ? [{url: pkg.images[0].url}]
        : undefined,
    },
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);

  const [pkg, promotions] = await Promise.all([
    getPackageBySlug(slug),
    getActivePromotions(),
  ]);

  if (!pkg) {
    notFound();
  }

  const tp = await getTranslations("packages");
  const tc = await getTranslations("common");

  const images = pkg.images.length
    ? pkg.images
    : [
        {
          url: "https://picsum.photos/seed/galapagos/640/480",
          alt: pkg.title,
          sortOrder: 0,
        },
      ];

  const highlights = deriveHighlights(pkg.description);

  const bestPromo = promotions
    .map((promo) => ({
      ...promo,
      discounted: discountedCents(pkg.priceInCents, promo.discountPercent),
    }))
    .sort((a, b) => b.discountPercent - a.discountPercent)[0];

  const finalCents = bestPromo ? bestPromo.discounted : pkg.priceInCents;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.title,
    description: pkg.summary,
    image: images.map((img) => img.url),
    url: localeUrl(locale as AppLocale, `/packages/${pkg.slug}`),
    brand: {"@type": "Brand", name: "Galapagos Voyages"},
    offers: {
      "@type": "Offer",
      price: (finalCents / 100).toFixed(2),
      priceCurrency: pkg.currency,
      availability: "https://schema.org/InStock",
      url: localeUrl(locale as AppLocale, `/book/${pkg.slug}`),
    },
  };

  return (
    <div className="pb-12">
      <JsonLd data={productJsonLd} />
      {/* Breadcrumb */}
      <Container className="pt-6">
        <nav className="text-sm text-muted">
          <Link
            href="/packages"
            className="transition-soft hover:text-navy"
          >
            {tp("backToPackages")}
          </Link>
        </nav>
      </Container>

      {/* Header */}
      <Container className="pt-4">
        <div className="flex flex-col gap-3">
          {pkg.featured && (
            <span className="w-fit rounded-full bg-gold px-3 py-1 text-xs font-medium text-cream">
              {tp("featured")}
            </span>
          )}
          <h1 className="font-serif text-3xl text-navy sm:text-4xl">
            {pkg.title}
          </h1>
          <p className="max-w-2xl text-muted">{pkg.summary}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            <span>
              {pkg.durationDays} {tc("days")}
            </span>
            <span>{pkg.location}</span>
            <span>
              {tc("maxGuests", {count: pkg.maxGuests})}
            </span>
          </div>
        </div>
      </Container>

      {/* Gallery */}
      <Container className="mt-8">
        <section aria-label={tp("gallery")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2 md:row-span-2">
              <Image
                src={images[0].url}
                alt={images[0].alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-72 w-full rounded-2xl object-cover md:h-full"
              />
            </div>
            {images.slice(1, 5).map((img) => (
              <div key={img.url} className="relative hidden md:block h-36">
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="25vw"
                  className="h-36 w-full rounded-2xl object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* Body + booking aside */}
      <Container className="mt-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Description + highlights */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl text-navy">
              {tp("detailsTitle")}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-ink/90">
              {pkg.description.split(/(?<=\.)\s+/).map((sentence, i) => (
                <p key={i}>{sentence}</p>
              ))}
            </div>

            <h3 className="mt-8 font-serif text-xl text-navy">
              {tp("highlights")}
            </h3>
            <ul className="mt-3 space-y-2">
              {highlights.map((h) => (
                <li key={h} className="flex gap-2 text-muted">
                  <span className="mt-1 text-gold">&#9670;</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Booking aside */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-stone/40 bg-cream p-6 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-muted">
                {tp("fromPrice")}
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-serif text-3xl text-navy">
                  {formatPrice(finalCents, pkg.currency)}
                </span>
                {bestPromo && (
                  <>
                    <span className="text-sm text-muted line-through">
                      {formatPrice(pkg.priceInCents, pkg.currency)}
                    </span>
                    <span className="rounded-full bg-teal px-2 py-1 text-xs font-medium text-cream">
                      {tp("discountBadge", {pct: bestPromo.discountPercent})}
                    </span>
                  </>
                )}
              </div>
              {bestPromo && (
                <p className="mt-2 text-sm text-teal">
                  {bestPromo.label}
                </p>
              )}

              <dl className="mt-5 space-y-2 text-sm text-muted">
                <div className="flex justify-between">
                  <dt>{tc("days")}</dt>
                  <dd className="text-navy">{pkg.durationDays}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{tp("locationLabel")}</dt>
                  <dd className="text-navy">{pkg.location}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{tp("maxGuestsLabel")}</dt>
                  <dd className="text-navy">{pkg.maxGuests}</dd>
                </div>
              </dl>

              <Link
                href={`/book/${pkg.slug}`}
                className="mt-6 block"
              >
                <Button variant="gold" size="lg" className="w-full">
                  {tp("bookNow")}
                </Button>
              </Link>
              <p className="mt-3 text-center text-xs text-muted">
                {tp("bookNote")}
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
