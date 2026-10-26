/** Display formatters shared across pages. */

export function kes(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
}

export function num(n: number | null | undefined, digits = 0): string {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: digits }).format(Number(n ?? 0));
}

/** ArcGIS stores dates as epoch milliseconds. */
export function fmtDate(epoch: number | null | undefined): string {
  if (epoch == null) return "—";
  return new Date(epoch).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtDateTime(epoch: number | null | undefined): string {
  if (epoch == null) return "—";
  return new Date(epoch).toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
