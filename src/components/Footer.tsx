import {useTranslations} from "next-intl";
import {Container} from "./Container";
import {CONFIG, whatsappLink} from "@/lib/config";

// Site footer with contact links (WhatsApp / WeChat) and copyright.
export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-stone/40 bg-navy text-cream">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-serif text-lg">{CONFIG.siteName}</p>
          <p className="text-sm text-cream/70">{t("footer.text")}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-cream/70">{t("footer.contactLabel")}</p>
          <div className="flex flex-wrap gap-4">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-soft hover:text-gold-light"
            >
              {t("footer.whatsapp")}
            </a>
            <a
              href={`mailto:${CONFIG.contactEmail}`}
              className="transition-soft hover:text-gold-light"
            >
              {CONFIG.contactEmail}
            </a>
          </div>
        </div>
      </Container>

      <div className="border-t border-cream/10">
        <Container className="py-4 text-xs text-cream/60">
          &copy; {year} {CONFIG.siteName}. {t("footer.rights")}
        </Container>
      </div>
    </footer>
  );
}
