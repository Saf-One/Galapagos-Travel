import {CONFIG, LOCALES, DEFAULT_LOCALE, type AppLocale} from "./config";

// === SEO URL + hreflang helpers ===
// Builds locale-prefixed absolute URLs and hreflang alternate maps used by
// metadata (layout), sitemap, and JSON-LD. All offline-safe (pure functions).

// Trim any trailing slash from the configured site URL.
export const SITE_URL = CONFIG.siteUrl.replace(/\/$/, "");

// Absolute URL for a given locale + path (path should start with "/" or be "").
export function localeUrl(locale: AppLocale, path = ""): string {
  const clean = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${SITE_URL}/${locale}${clean}`;
}

// hreflang alternates map { en: url, es: url, zh: url } plus x-default.
export function hreflangAlternates(path = ""): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of LOCALES) {
    map[locale] = localeUrl(locale, path);
  }
  map["x-default"] = localeUrl(DEFAULT_LOCALE, path);
  return map;
}
