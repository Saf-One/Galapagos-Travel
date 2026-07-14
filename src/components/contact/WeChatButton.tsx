"use client";

import {useState} from "react";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {CONFIG} from "@/lib/config";
import {Button, type ButtonProps} from "@/components/Button";

// WeChat contact card. Real WeChat requires an approved Official Account, so we
// show the WeChat ID (from CONFIG) plus a QR placeholder image (picsum). No
// external API needed. Toggling opens a small modal/panel.
export function WeChatButton({
  size,
  variant = "secondary",
  className,
}: {
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const t = useTranslations();
  const tc = useTranslations("contact");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        type="button"
        onClick={() => setOpen(true)}
      >
        {t("footer.wechat")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={tc("wechat")}
        >
          <div
            className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-stone/50 bg-cream p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg text-navy">
                {tc("wechat")}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={tc("close")}
                className="rounded-full p-1 text-muted transition-soft hover:bg-sand hover:text-navy"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* QR placeholder (real picsum image). */}
            <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-xl border border-stone/40 bg-sand">
              <Image
                src="https://picsum.photos/seed/galapagos-wechat-qr/320/320"
                alt={tc("scanQr")}
                width={320}
                height={320}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="text-sm text-muted">{tc("scanQr")}</p>
            <p className="mt-2 text-sm text-navy">
              <span className="text-muted">{tc("wechatId")}: </span>
              <span className="font-medium">{CONFIG.wechatId}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
