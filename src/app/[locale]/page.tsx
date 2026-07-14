import {setRequestLocale} from "next-intl/server";
import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {Container} from "@/components/Container";
import {Button} from "@/components/Button";
import {prisma} from "@/lib/prisma";
import {CONFIG, whatsappLink} from "@/lib/config";
import {PackageCard} from "@/components/package/PackageCard";
import type {PackageCardData} from "@/lib/types";

// Runtime data (DB) -> render at request time with a safe fallback.
export const dynamic = "force-dynamic";

async function getFeaturedPackages(): Promise<PackageCardData[]> {
  try {
    const rows = await prisma.package.findMany({
      where: {featured: true},
      include: {images: {orderBy: {sortOrder: "asc"}}},
      take: 6,
      orderBy: {createdAt: "asc"},
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

export default async function HomePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const th = await getTranslations("home");
  const tc = await getTranslations("common");
  const packages = await getFeaturedPackages();

  const whyItems = [
    "guides",
    "smallGroups",
    "conservation",
    "flexibility",
  ] as const;

  return (
    <div className="pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-cream">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(https://picsum.photos/seed/galapagos-hero/1920/1080)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <Container className="relative py-24 sm:py-32">
          <p className="mb-3 text-sm uppercase tracking-widest text-gold-light">
            {CONFIG.siteName}
          </p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
            {th("hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-cream/80 sm:text-lg">
            {th("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/packages">
              <Button variant="gold" size="lg">
                {th("hero.cta")}
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="border-cream/40 text-cream hover:bg-cream hover:text-navy">
                {t("nav.contact")}
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Featured packages */}
      <section className="py-16">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl text-navy sm:text-4xl">
              {th("featuredTitle")}
            </h2>
            <p className="mt-2 text-muted">{th("featuredSubtitle")}</p>
          </div>

          {packages.length === 0 ? (
            <p className="text-center text-muted">
              {tc("loading")} {tc("error")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Why travel with us */}
      <section className="bg-sand/50 py-16">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl text-navy sm:text-4xl">
              {th("whyTitle")}
            </h2>
            <p className="mt-2 text-muted">{th("whySubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((key) => (
              <div
                key={key}
                className="rounded-xl border border-stone/40 bg-cream p-6"
              >
                <h3 className="font-serif text-lg text-navy">
                  {th(`why.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {th(`why.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Contact strip */}
      <section className="py-16">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-stone/40 bg-navy px-6 py-12 text-center text-cream sm:px-12">
            <h2 className="font-serif text-2xl sm:text-3xl">
              {th("contactTitle")}
            </h2>
            <p className="max-w-xl text-cream/80">{th("contactSubtitle")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button variant="gold">{t("footer.whatsapp")}</Button>
              </a>
              <Link href="/contact">
                <Button variant="secondary" className="border-cream/40 text-cream hover:bg-cream hover:text-navy">
                  {t("nav.contact")}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
