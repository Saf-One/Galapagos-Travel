"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {cn} from "@/lib/utils";
import type {PackageCardData} from "@/lib/types";
import {PackageCard} from "./PackageCard";

type SortKey = "featured" | "priceAsc" | "priceDesc" | "durationAsc";

// Client-side filter + sort for the packages catalog. Keeps the source list
// immutable and derives a filtered/sorted view. Styling matches the classic
// theme: muted controls, serif-free, generous spacing.
export function PackagesFilter({packages}: {packages: PackageCardData[]}) {
  const tp = useTranslations("packages");
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxGuests, setMaxGuests] = useState<number>(0); // 0 = no filter
  const [maxDuration, setMaxDuration] = useState<number>(0); // 0 = no filter

  const visible = useMemo(() => {
    let list = packages.slice();
    if (maxGuests > 0) {
      list = list.filter((p) => p.maxGuests <= maxGuests);
    }
    if (maxDuration > 0) {
      list = list.filter((p) => p.durationDays <= maxDuration);
    }
    switch (sort) {
      case "priceAsc":
        list.sort((a, b) => a.priceInCents - b.priceInCents);
        break;
      case "priceDesc":
        list.sort((a, b) => b.priceInCents - a.priceInCents);
        break;
      case "durationAsc":
        list.sort((a, b) => a.durationDays - b.durationDays);
        break;
      case "featured":
      default:
        list.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            a.durationDays - b.durationDays
        );
        break;
    }
    return list;
  }, [packages, sort, maxGuests, maxDuration]);

  const selectClass =
    "rounded-full border border-stone/50 bg-cream px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/60";

  return (
    <div className="mb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-stone/40 bg-sand/40 p-5 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-navy">{tp("sort")}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="featured">{tp("featuredFirst")}</option>
            <option value="priceAsc">{tp("sortPriceAsc")}</option>
            <option value="priceDesc">{tp("sortPriceDesc")}</option>
            <option value="durationAsc">{tp("sortDurationAsc")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-navy">{tp("maxGuests")}</span>
          <select
            value={maxGuests}
            onChange={(e) => setMaxGuests(Number(e.target.value))}
            className={selectClass}
          >
            <option value={0}>{tp("any")}</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
            <option value={12}>12</option>
            <option value={14}>14</option>
            <option value={16}>16</option>
            <option value={18}>18</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-navy">{tp("maxDuration")}</span>
          <select
            value={maxDuration}
            onChange={(e) => setMaxDuration(Number(e.target.value))}
            className={selectClass}
          >
            <option value={0}>{tp("any")}</option>
            <option value={5}>5 {tp("daysShort")}</option>
            <option value={6}>6 {tp("daysShort")}</option>
            <option value={7}>7 {tp("daysShort")}</option>
            <option value={8}>8 {tp("daysShort")}</option>
            <option value={10}>10 {tp("daysShort")}</option>
          </select>
        </label>

        {(maxGuests > 0 || maxDuration > 0 || sort !== "featured") && (
          <button
            type="button"
            onClick={() => {
              setSort("featured");
              setMaxGuests(0);
              setMaxDuration(0);
            }}
            className={cn(
              "rounded-full border border-navy px-4 py-2 text-sm font-medium text-navy transition-soft hover:bg-navy hover:text-cream"
            )}
          >
            {tp("reset")}
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-muted">
        {tp("resultsCount", {count: visible.length})}
      </p>

      {visible.length === 0 ? (
        <p className="mt-6 text-center text-muted">{tp("noResults")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}
