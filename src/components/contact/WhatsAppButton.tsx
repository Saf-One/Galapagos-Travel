"use client";

import {useTranslations} from "next-intl";
import {whatsappLink} from "@/lib/whatsapp";
import {Button, type ButtonProps} from "@/components/Button";

// WhatsApp CTA. Reuses the shared wa.me helper. Opens in a new tab.
export function WhatsAppButton({
  message,
  size,
  variant = "gold",
  className,
}: {
  message?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const t = useTranslations();
  return (
    <a href={whatsappLink(undefined, message)} target="_blank" rel="noopener noreferrer">
      <Button variant={variant} size={size} className={className} type="button">
        {t("footer.whatsapp")}
      </Button>
    </a>
  );
}
