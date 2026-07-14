"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {ChatPanel} from "./ChatPanel";

// Floating chatbot launcher. Sits bottom-right, fixed, above content.
// Toggling opens the ChatPanel. Mobile responsive (panel shrinks).
export function ChatWidget() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && <ChatPanel onClose={() => setOpen(false)} />}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-cream shadow-xl transition-soft hover:bg-teal focus:outline-none focus:ring-2 focus:ring-gold/60"
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-4-1L3 20l1.5-4.5a8.38 8.38 0 0 1-1-4A8.5 8.5 0 0 1 21 11.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
