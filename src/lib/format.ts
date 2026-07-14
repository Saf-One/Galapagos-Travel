// Shared price formatting (cents to localized currency string).
// Kept locale-agnostic on the number locale (en-US) so currency display is
// consistent across UI locales; only the currency code changes.
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
