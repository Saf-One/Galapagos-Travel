// Shared serializable shapes for package data passed between server and client
// components. Prisma model fields that are not needed (createdAt, updatedAt)
// are intentionally omitted so the objects stay plain/JSON-safe.

export type PackageImageData = {
  url: string;
  alt: string;
  sortOrder: number;
};

export type PackageCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  priceInCents: number;
  currency: string;
  durationDays: number;
  location: string;
  maxGuests: number;
  featured: boolean;
  images: PackageImageData[];
};

export type PackageDetailData = PackageCardData & {
  description: string;
};

// Derive short highlight bullets from the description sentences.
// The schema has no dedicated highlights field, so we split the narrative
// into its sentences and surface the first few as a bulleted list.
export function deriveHighlights(description: string, max = 4): string[] {
  return description
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s.length > 0)
    .slice(0, max);
}
