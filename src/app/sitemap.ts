import type {MetadataRoute} from "next";
import {LOCALES} from "@/lib/config";
import {localeUrl, hreflangAlternates, SITE_URL} from "@/lib/seo";
import {prisma} from "@/lib/prisma";

// Sitemap with per-locale entries and hreflang alternates for every static
// route plus each package detail page. Offline-safe: package slugs are read
// inside try/catch so a missing DB never breaks the build.

// Static routes (relative to the locale prefix) to include for every locale.
const STATIC_PATHS = [
  "",
  "/packages",
  "/contact",
  "/account/login",
  "/account/register",
] as const;

async function getPackageSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.package.findMany({
      select: {slug: true},
      take: 500,
    });
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static routes x locales.
  for (const path of STATIC_PATHS) {
    const languages = hreflangAlternates(path);
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(locale, path),
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {languages},
      });
    }
  }

  // Package detail pages x locales.
  const slugs = await getPackageSlugs();
  for (const slug of slugs) {
    const path = `/packages/${slug}`;
    const languages = hreflangAlternates(path);
    for (const locale of LOCALES) {
      entries.push({
        url: localeUrl(locale, path),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {languages},
      });
    }
  }

  // Root URL fallback (redirects to default locale).
  entries.push({
    url: SITE_URL,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  });

  return entries;
}
