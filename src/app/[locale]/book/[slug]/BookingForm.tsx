"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {Button} from "@/components/Button";
import {
  checkAvailabilityAction,
  createBookingAction,
} from "./actions";

// Client booking form: pick a date (real-time availability) and guests, then
// create a PENDING booking and navigate to the pay/status page.
export function BookingForm({
  packageId,
  priceInCents,
  currency,
  maxGuests,
  locale,
}: {
  packageId: string;
  priceInCents: number;
  currency: string;
  maxGuests: number;
  locale: string;
}) {
  const t = useTranslations("booking");
  const router = useRouter();

  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [soldOut, setSoldOut] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const total = (priceInCents * guests) / 100;

  async function onDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value;
    setDate(d);
    setError(null);
    setRemaining(null);
    setSoldOut(false);
    if (!d) return;

    setChecking(true);
    const res = await checkAvailabilityAction(packageId, d);
    setChecking(false);
    if (res.ok) {
      setRemaining(res.availability.remaining);
      setSoldOut(res.availability.soldOut);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("error.selectDate");
      return;
    }
    if (soldOut) {
      setError("error.capacityFull");
      return;
    }
    if (remaining !== null && guests > remaining) {
      setError("error.notEnoughSpots");
      return;
    }

    setSubmitting(true);
    const res = await createBookingAction(packageId, date, guests);
    if (res.ok) {
      router.push(`/bookings/${res.reference}`);
    } else {
      setError(mapError(res.error));
      setSubmitting(false);
    }
  }

  function mapError(code: string): string {
    switch (code) {
      case "sold-out":
        return "error.capacityFull";
      case "not-enough-spots":
        return "error.notEnoughSpots";
      case "past-date":
        return "error.pastDate";
      case "invalid-guests":
        return "error.invalidGuests";
      case "package-not-found":
        return "error.packageNotFound";
      default:
        return "error.generic";
    }
  }

  const canSubmit = !!date && !soldOut && !submitting;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="startDate"
          className="mb-1 block text-sm font-medium text-navy"
        >
          {t("selectDate")}
        </label>
        <input
          id="startDate"
          type="date"
          min={today}
          value={date}
          onChange={onDateChange}
          className="w-full rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <div className="mt-2 min-h-[1.5rem] text-sm">
          {checking && <span className="text-muted">{t("checking")}</span>}
          {!checking && remaining !== null && !soldOut && (
            <span className="text-teal">
              {t("spotsLeft", {count: remaining})}
            </span>
          )}
          {!checking && soldOut && (
            <span className="font-medium text-red-600">{t("soldOut")}</span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="guests"
          className="mb-1 block text-sm font-medium text-navy"
        >
          {t("guests")}
        </label>
        <select
          id="guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full rounded-lg border border-stone/50 bg-white px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
        >
          {Array.from({length: maxGuests}, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg bg-sand/60 px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">{t("total")}</span>
          <span className="font-semibold text-navy">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(total)}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600">{t(error)}</p>
      )}

      <Button type="submit" variant="gold" size="lg" disabled={!canSubmit}>
        {submitting ? t("processing") : t("continue")}
      </Button>
    </form>
  );
}
