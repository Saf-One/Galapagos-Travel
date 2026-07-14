import {defineRouting} from "next-intl/routing";

// === CONFIGURABLE VALUES ===
// Supported locales and the default. Keep this in sync with messages/*.json.
export const routing = defineRouting({
  locales: ["en", "es", "zh"],
  defaultLocale: "en",
  // Locale-prefixed routing: /en, /es, /zh
  localePrefix: "always",
});
