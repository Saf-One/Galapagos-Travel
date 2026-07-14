// Supported locales, shared by the switcher and config consumers.
export const LOCALES = ["en", "es", "zh"] as const;

// Shared locale metadata (kept in one place to avoid import cycles).
export const LOCALS_LABELS: Record<(typeof LOCALES)[number], string> = {
  en: "EN",
  es: "ES",
  zh: "中文",
};
