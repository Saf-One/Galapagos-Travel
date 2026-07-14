import {CONFIG} from "./config";

// === CONFIGURABLE VALUES ===
// WhatsApp deep link helpers. Builds a wa.me URL from an E.164-style phone
// number (digits only) and an optional prefilled message.
// Offline-safe: no network call, just URL building.

// Normalize a phone number to digits only (wa.me requires no + or spaces).
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

// Build a wa.me link. If `message` is provided it is URL-encoded.
export function whatsappLink(
  phone: string = CONFIG.whatsappNumber,
  message?: string
): string {
  const base = `https://wa.me/${normalizePhone(phone)}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// Convenience: open WhatsApp with the configured number.
export function defaultWhatsappLink(message?: string): string {
  return whatsappLink(CONFIG.whatsappNumber, message);
}
