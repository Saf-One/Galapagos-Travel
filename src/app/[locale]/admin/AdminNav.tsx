"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {usePathname} from "next/navigation";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";

// === CONFIGURABLE VALUES ===
// Admin sidebar navigation. Collapses to a toggle menu on mobile; full
// vertical sidebar on md+. Highlights the active section via the pathname.
export function AdminNav({
  locale,
  userName,
}: {
  locale: string;
  userName: string;
}) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    {href: `/admin`, label: t("dashboard"), exact: true},
    {href: `/admin/bookings`, label: t("navBookings")},
    {href: `/admin/packages`, label: t("navPackages")},
    {href: `/admin/promotions`, label: t("navPromotions")},
    {href: `/admin/leads`, label: t("navLeads")},
    {href: `/admin/export`, label: t("navExport")},
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === `/${locale}${href}`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <aside className="border-b border-stone/40 bg-cream md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-5 py-4 md:block">
        <div className="md:mb-2">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("title")}
          </p>
          <p className="truncate text-sm font-semibold text-navy">{userName}</p>
        </div>
        <button
          type="button"
          aria-label="Toggle admin menu"
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
      </div>

      <nav
        className={cn(
          "px-3 pb-4 md:block",
          open ? "block" : "hidden"
        )}
      >
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-soft",
                  isActive(item.href, item.exact)
                    ? "bg-navy text-cream"
                    : "text-navy hover:bg-sand"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
