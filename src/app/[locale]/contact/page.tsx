import {setRequestLocale, getTranslations} from "next-intl/server";
import type {Metadata} from "next";
import {Container} from "@/components/Container";
import {Button} from "@/components/Button";
import {LeadCaptureForm} from "@/components/lead/LeadCaptureForm";
import {CONFIG, whatsappLink, wechatLink} from "@/lib/config";
import {hreflangAlternates, localeUrl} from "@/lib/seo";
import type {AppLocale} from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "contact"});
  return {
    title: t("contactTitle"),
    description: t("contactIntro"),
    alternates: {
      canonical: localeUrl(locale as AppLocale, "/contact"),
      languages: hreflangAlternates("/contact"),
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-3xl text-navy sm:text-4xl">
          {t("contactTitle")}
        </h1>
        <p className="mt-3 text-muted">{t("contactIntro")}</p>

        <div className="mt-10 rounded-2xl border border-stone/40 bg-cream p-6 sm:p-8">
          <LeadCaptureForm source="contact-page" />
          <p className="mt-4 text-xs text-muted">{t("followUpNote")}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="gold">WhatsApp</Button>
          </a>
          <a href={wechatLink} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">WeChat: {CONFIG.wechatId}</Button>
          </a>
          <a href={`mailto:${CONFIG.contactEmail}`}>
            <Button variant="ghost">{CONFIG.contactEmail}</Button>
          </a>
        </div>
      </Container>
    </div>
  );
}
