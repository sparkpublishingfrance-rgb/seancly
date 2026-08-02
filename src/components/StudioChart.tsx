import { useId } from "react";
import type { StatSeries } from "../types/studio";
import { COLORS } from "../config/theme";
import { formatNumber } from "../utils/format";

/* Repère de tracé. Le SVG est mis à l'échelle sans déformation par le CSS. */
const WIDTH = 600;
const HEIGHT = 170;
const PAD_TOP = 14;
const PAD_BOTTOM = 12;

type Bounds = { min: number; max: number };

function boundsOf(values: number[]): Bounds {
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Un plancher légèrement sous le minimum évite une aire écrasée en bas.
  return { min: min - (max - min) * 0.25, max };
}

function yOf(value: number, bounds: Bounds): number {
  const range = bounds.max - bounds.min || 1;
  const ratio = (value - bounds.min) / range;
  return PAD_TOP + (1 - ratio) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
}

/**
 * Résumé textuel d'une série, servi aux lecteurs d'écran à la place du tracé.
 * Le graphe reste ainsi lisible sans être vu.
 */
function summaryOf(series: StatSeries): string {
  const values = series.points.map((point) => point.value);
  const first = values[0];
  const last = values[values.length - 1];
  const total = values.reduce((sum, value) => sum + value, 0);
  const direction = last > first ? "en hausse" : last < first ? "en baisse" : "stable";

  return (
    `${series.title}, ${direction} sur ${series.points.length} points. ` +
    `Total ${formatNumber(total)} ${series.unit}, ` +
    `de ${formatNumber(first)} à ${formatNumber(last)}.`
  );
}

/** Lignes de repère horizontales, volontairement à peine visibles. */
function Grid() {
  const rows = [0, 0.5, 1];
  return (
    <g className="chart__grid">
      {rows.map((ratio) => {
        const y = PAD_TOP + ratio * (HEIGHT - PAD_TOP - PAD_BOTTOM);
        return <line key={ratio} x1="0" x2={WIDTH} y1={y} y2={y} />;
      })}
    </g>
  );
}

type ChartProps = {
  series: StatSeries;
};

/** Aire pour les séries denses, comme les vues quotidiennes. */
export function AreaChart({ series }: ChartProps) {
  const gradientId = useId();
  const values = series.points.map((point) => point.value);
  const bounds = boundsOf(values);
  const step = WIDTH / Math.max(values.length - 1, 1);

  const line = values
    .map((value, index) => `${index === 0 ? "M" : "L"} ${index * step} ${yOf(value, bounds)}`)
    .join(" ");
  const area = `${line} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

  return (
    <figure className="chart">
      <figcaption className="chart__caption">{series.title}</figcaption>
      <svg
        className="chart__canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={summaryOf(series)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={COLORS.raspberry} />
            <stop offset="1" stopColor={COLORS.gold} />
          </linearGradient>
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.raspberry} stopOpacity="0.36" />
            <stop offset="1" stopColor={COLORS.raspberry} stopOpacity="0" />
          </linearGradient>
        </defs>

        <Grid />
        <path d={area} fill={`url(#${gradientId}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <p className="chart__legend">
        <span>{series.points[0]?.label}</span>
        <span>{series.points[series.points.length - 1]?.label}</span>
      </p>
    </figure>
  );
}

/** Barres pour les séries courtes, comme les abonnés par semaine. */
export function BarChart({ series }: ChartProps) {
  const gradientId = useId();
  const values = series.points.map((point) => point.value);
  const max = Math.max(...values);
  const slot = WIDTH / values.length;
  const barWidth = slot * 0.46;

  return (
    <figure className="chart">
      <figcaption className="chart__caption">{series.title}</figcaption>
      <svg
        className="chart__canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={summaryOf(series)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={COLORS.raspberry} />
            <stop offset="1" stopColor={COLORS.gold} />
          </linearGradient>
        </defs>

        <Grid />
        {values.map((value, index) => {
          const height = ((value / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM)) || 0;
          return (
            <rect
              key={series.points[index].label}
              x={index * slot + (slot - barWidth) / 2}
              y={HEIGHT - PAD_BOTTOM - height}
              width={barWidth}
              height={height}
              rx="4"
              fill={`url(#${gradientId})`}
            />
          );
        })}
      </svg>
      <p className="chart__legend chart__legend--spread">
        {series.points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </p>
    </figure>
  );
}

/** Esquisse sans repère, glissée dans une carte de statistique. */
export function Sparkline({ series }: ChartProps) {
  const gradientId = useId();
  const values = series.points.map((point) => point.value);
  const bounds = boundsOf(values);
  const step = 120 / Math.max(values.length - 1, 1);
  const scale = 34 / HEIGHT;

  const line = values
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"} ${index * step} ${yOf(value, bounds) * scale}`,
    )
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 120 34" role="img" aria-label={summaryOf(series)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLORS.raspberry} />
          <stop offset="1" stopColor={COLORS.gold} />
        </linearGradient>
      </defs>
      <path
        d={line}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
