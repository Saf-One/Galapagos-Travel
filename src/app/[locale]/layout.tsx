import {Inter, Playfair_Display} from "next/font/google";
import type {ReactNode} from "react";
import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale, getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import {Header} from "@/components/Header";
import {Footer} from "@/components/Footer";
import {ChatWidget} from "@/components/chat/ChatWidget";
import {GoogleAnalytics} from "@next/third-parties/google";
import {GA_MEASUREMENT_ID} from "@/lib/analytics";
import {CONFIG, type AppLocale} from "@/lib/config";
import {SITE_URL, localeUrl, hreflangAlternates} from "@/lib/seo";

// Per-locale SEO metadata with hreflang alternates. Falls back gracefully when
// translations are missing so the build never fails offline.
export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "seo"});
  const title = t("metaTitleHome");
  const description = t("metaDescHome");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${CONFIG.siteName}`,
    },
    description,
    alternates: {
      canonical: localeUrl(locale as AppLocale, ""),
      languages: hreflangAlternates(""),
    },
    openGraph: {
      title,
      description,
      url: localeUrl(locale as AppLocale, ""),
      siteName: CONFIG.siteName,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Serif display font for headings, sans for body (next/font/google).
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Enable static rendering for the locale segment.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering of this locale.
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${playfair.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </NextIntlClientProvider>
        {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
      </body>
    </html>
  );
}
