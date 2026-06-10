/**
 * Formatting helpers. All monetary values in this app are stored as integer
 * cents and only converted to display strings here.
 */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 1245000 -> "$12,450.00" */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** 1245000 -> "$12,450" (no decimals — for big headline numbers) */
export function formatCentsWhole(cents: number): string {
  return usdWhole.format(cents / 100);
}

/** 0.12 -> "12%" */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 0.12 -> "+12%", -0.05 -> "−5%" (signed, with a true minus glyph) */
export function formatDelta(ratio: number): string {
  const sign = ratio >= 0 ? "+" : "−";
  return `${sign}${Math.abs(ratio * 100).toFixed(0)}%`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** ISO 8601 -> "Jun 12, 2026 · 7:24 PM" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // "Jun 12, 2026, 7:24 PM" -> "Jun 12, 2026 · 7:24 PM"
  return dateTimeFmt.format(d).replace(/, (\d+:\d+)/, " · $1");
}

/** Money that may be unknown (null) -> "$x" or an em dash. */
export function formatCentsOrDash(cents: number | null): string {
  return cents == null ? "—" : formatCents(cents);
}
