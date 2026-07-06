export function formatAED(value: number | string, locale: "en" | "ar" = "en"): string {
  const n = typeof value === "string" ? Number(value) : value;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
  return locale === "ar" ? `${formatted} د.إ` : `AED ${formatted}`;
}

export function formatDate(iso: string, locale: "en" | "ar" = "en"): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
