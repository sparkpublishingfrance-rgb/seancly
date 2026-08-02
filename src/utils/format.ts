const NUMBER = new Intl.NumberFormat("fr-FR");
const DECIMAL = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const SCORE = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/** Entier avec séparateurs de milliers français ("12 480"). */
export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

/** Nombre avec au plus une décimale ("7,4"). */
export function formatDecimal(value: number): string {
  return DECIMAL.format(value);
}

/** Note sur dix, toujours avec sa décimale ("8,0"). */
export function formatScore(value: number): string {
  return SCORE.format(value);
}

/** Variation signée, le signe étant porteur de sens ("+318", "-12"). */
export function formatDelta(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${NUMBER.format(Math.abs(value))}`;
}

/** Date "YYYY-MM-DD" ou horodatage ISO vers "avril 2023". */
export function formatMonthYear(isoDate: string): string {
  const date = isoDate.includes("T") ? new Date(isoDate) : new Date(`${isoDate}T00:00:00`);
  return MONTH_YEAR.format(date);
}

const RELATIVE = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

/** Paliers de l'horodatage relatif, du plus fin au plus large. */
const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/** Horodatage relatif en français ("il y a 2 heures", "hier"). */
export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  let delta = (new Date(isoDate).getTime() - now) / 1000;

  for (const [unit, span] of RELATIVE_STEPS) {
    if (Math.abs(delta) < span) return RELATIVE.format(Math.round(delta), unit);
    delta /= span;
  }

  return RELATIVE.format(Math.round(delta), "year");
}

/** Initiales d'un nom complet, deux lettres au maximum. */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.slice(0, 1).toUpperCase())
      .join("") || "?"
  );
}
