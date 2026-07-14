"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/Button";

type Status = "idle" | "submitting" | "success" | "error";

interface LeadCaptureFormProps {
  source?: string;
  // Optional extra payload merged into the lead (e.g. package slug).
  payload?: Record<string, unknown>;
  className?: string;
}

// Client lead-capture form. POSTs to /api/lead and shows inline feedback.
// Offline-safe: a failed request just shows the error message.
export function LeadCaptureForm({
  source = "website",
  payload = {},
  className,
}: LeadCaptureFormProps) {
  const t = useTranslations("lead");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, name, source, payload}),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-full border border-stone/50 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40";

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="name"
          aria-label={t("leadName")}
          placeholder={t("leadName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoComplete="name"
        />
        <input
          type="email"
          name="email"
          required
          aria-label={t("leadEmail")}
          placeholder={t("leadEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoComplete="email"
        />
        <Button
          type="submit"
          variant="gold"
          disabled={status === "submitting"}
          className="whitespace-nowrap"
        >
          {t("leadSubmit")}
        </Button>
      </div>
      {status === "success" && (
        <p className="mt-3 text-sm text-teal">{t("leadSuccess")}</p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-red-500">{t("leadError")}</p>
      )}
    </form>
  );
}
