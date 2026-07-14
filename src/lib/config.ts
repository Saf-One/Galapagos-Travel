// === CONFIGURABLE VALUES ===
// Central configuration. Every value falls back to a placeholder so the app
// builds and runs WITHOUT any external service configured.
//
// Production note: swap the SQLite DATABASE_URL for a Supabase Postgres
// connection string (postgresql://user:***@host:5432/postgres) and keep the
// same Prisma schema (provider postgresql). No other code changes required.

export const LOCALES = ["en", "es", "zh"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

export const CONFIG = {
  siteName: process.env.SITE_NAME || "Galapagos Voyages",
  contactEmail: process.env.CONTACT_EMAIL || "hello@galapagos.example",
  siteUrl: process.env.SITE_URL || "http://localhost:3000",

  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,

  // Auth
  authSecret:
    process.env.AUTH_SECRET ||
    "dev-insecure-secret-change-me-in-production-please-32chars",
  nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",

  // Payments
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder",
    publishableKey:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || "placeholder",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "placeholder",
    mode: (process.env.PAYPAL_MODE || "sandbox") as "sandbox" | "live",
  },

  // CRM
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY || "",
    portalId: process.env.HUBSPOT_PORTAL_ID || "",
  },

  // Analytics
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",

  // Messaging
  whatsappNumber: process.env.WHATSAPP_NUMBER || "593999999999",
  wechatId: process.env.WECHAT_ID || "galapagos_voyages",
} as const;

// Convenience derived helpers.
export const whatsappLink = `https://wa.me/${CONFIG.whatsappNumber}`;
export const wechatLink = `weixin://contacts/profile/${CONFIG.wechatId}`;
