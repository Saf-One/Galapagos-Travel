import {setRequestLocale, getTranslations} from "next-intl/server";
import {Container} from "@/components/Container";
import {PackagesFilter} from "@/components/package/PackagesFilter";
import {prisma} from "@/lib/prisma";
import type {PackageCardData} from "@/lib/types";

// ISR: re-generate the catalog at most hourly (served from CDN).
export const revalidate = 3600;

// === CONFIGURABLE VALUES ===
// How many packages to show per catalog call. 0 / unset = all.
const CATALOG_LIMIT = 0;

async function getPackages(): Promise<PackageCardData[]> {
  try {
    const rows = await prisma.package.findMany({
      include: {images: {orderBy: {sortOrder: "asc"}}},
      ...(CATALOG_LIMIT > 0 ? {take: CATALOG_LIMIT} : {}),
      orderBy: [{featured: "desc"}, {createdAt: "asc"}],
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      priceInCents: p.priceInCents,
      currency: p.currency,
      durationDays: p.durationDays,
      location: p.location,
      maxGuests: p.maxGuests,
      featured: p.featured,
      images: p.images.map((img) => ({
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder,
      })),
    }));
  } catch {
    // DB unavailable (e.g. build without push) -> empty so UI is not broken.
    return [];
  }
}

export default async function PackagesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const tp = await getTranslations("packages");
  const tc = await getTranslations("common");
  const packages = await getPackages();

  return (
    <div className="pb-12">
      {/* Page header */}
      <section className="relative overflow-hidden bg-navy text-cream">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(https://picsum.photos/seed/galapagos-packages/1920/1080)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <Container className="relative py-20 sm:py-24">
          <p className="mb-3 text-sm uppercase tracking-widest text-gold-light">
            {tc("from")} {tc("perPerson")}
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            {tp("catalogTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-cream/80 sm:text-lg">
            {tp("catalogIntro")}
          </p>
        </Container>
      </section>

      {/* Catalog grid + filters */}
      <section className="py-12">
        <Container>
          <PackagesFilter packages={packages} />
        </Container>
      </section>
    </div>
  );
}
