"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {LOCALS_LABELS, LOCALES} from "./locale-config";
import {cn} from "@/lib/utils";

// Locale switcher. Preserves the current path while changing the locale prefix.
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    router.replace(pathname, {locale: next});
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-stone/60 bg-cream"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-soft",
            locale === l
              ? "bg-navy text-cream"
              : "text-muted hover:text-navy"
          )}
        >
          {LOCALS_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
