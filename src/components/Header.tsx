"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {Container} from "./Container";
import {LocaleSwitcher} from "./LocaleSwitcher";
import {CONFIG} from "@/lib/config";
import {cn} from "@/lib/utils";

// Locale-aware header with nav, locale switcher, account/admin links and a
// mobile hamburger menu. Client component for interactive state.
export function Header() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const navItems = [
    {href: "/", label: t("nav.home")},
    {href: "/packages", label: t("nav.packages")},
    {href: "/bookings", label: t("nav.bookings")},
    {href: "/contact", label: t("nav.contact")},
    {href: "/account", label: t("nav.account")},
    {href: "/admin", label: t("nav.admin")},
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone/40 bg-cream/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-xl font-semibold text-navy">
          {CONFIG.siteName}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-soft hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-navy md:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-5 bg-navy transition-soft",
                open && "top-1.5 rotate-45"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1.5 h-0.5 w-5 bg-navy transition-soft",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-3 h-0.5 w-5 bg-navy transition-soft",
                open && "top-1.5 -rotate-45"
              )}
            />
          </span>
        </button>
      </Container>

      {/* Mobile nav panel */}
      {open && (
        <div className="border-t border-stone/40 bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-muted transition-soft hover:bg-sand hover:text-navy"
              >
                {item.label}
              </Link>
            ))}
            <div className="px-2 py-2">
              <LocaleSwitcher />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
