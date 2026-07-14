"use client";

import {useTranslations} from "next-intl";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {formatPrice} from "@/lib/format";
import type {PackageCardData} from "@/lib/types";

// Reusable package card (used by catalog + home grid). Client component so it
// can be rendered inside interactive client grids. Styling matches the classic
// ocean/sand theme: serif headings, bordered cards, restrained motion.
export function PackageCard({pkg}: {pkg: PackageCardData}) {
  const tc = useTranslations("common");
  const tp = useTranslations("packages");

  return (
    <Link
      href={`/packages/${pkg.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone/40 bg-white shadow-sm transition-soft hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <Image
          src={pkg.images[0]?.url || "https://picsum.photos/seed/galapagos/640/480"}
          alt={pkg.images[0]?.alt || pkg.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-soft group-hover:scale-105"
        />
        {pkg.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-medium text-cream">
            {tp("featured")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl text-navy">{pkg.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{pkg.summary}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <span>
            {tc("from")}{" "}
            <span className="font-semibold text-navy">
              {formatPrice(pkg.priceInCents, pkg.currency)}
            </span>{" "}
            {tc("perPerson")}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-muted">
          <span>
            {pkg.durationDays} {tc("days")} · {pkg.location}
          </span>
        </div>
        <span className="mt-4 inline-flex w-fit items-center justify-center rounded-full bg-teal px-5 py-2 text-sm font-medium text-cream transition-soft hover:bg-navy">
          {tp("viewDetails")}
        </span>
      </div>
    </Link>
  );
}
