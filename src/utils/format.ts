const NUMBER = new Intl.NumberFormat("fr-FR");
const DECIMAL = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/** Entier avec séparateurs de milliers français ("12 480"). */
export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

/** Nombre avec au plus une décimale ("7,4"). */
export function formatDecimal(value: number): string {
  return DECIMAL.format(value);
}

/** Variation signée, le signe étant porteur de sens ("+318", "-12"). */
export function formatDelta(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${NUMBER.format(Math.abs(value))}`;
}

/** Date "YYYY-MM-DD" vers "avril 2023". */
export function formatMonthYear(isoDate: string): string {
  return MONTH_YEAR.format(new Date(`${isoDate}T00:00:00`));
}
