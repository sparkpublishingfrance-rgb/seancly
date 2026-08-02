import type { ReactNode } from "react";
import type { CreatorStats } from "../types/studio";
import {
  CREATOR_HIGHLIGHT,
  FOLLOWERS_SERIES,
  LINK_CLICKS_SERIES,
  PROFILE_VIEWS_SERIES,
} from "../data/studio";
import { formatDecimal, formatDelta, formatNumber } from "../utils/format";
import { AreaChart, BarChart, Sparkline } from "./StudioChart";
import { IconStar } from "./icons";

type StatCardProps = {
  label: string;
  value: string;
  /** Variation sur 30 jours. Le signe décide de la couleur. */
  delta?: number;
  deltaUnit?: string;
  note?: string;
  children?: ReactNode;
};

function StatCard({ label, value, delta, deltaUnit, note, children }: StatCardProps) {
  const direction = delta === undefined || delta === 0 ? "flat" : delta > 0 ? "up" : "down";

  return (
    <article className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>

      {delta !== undefined && (
        <p className={`stat__delta stat__delta--${direction}`}>
          {formatDelta(delta)} {deltaUnit} sur 30 jours
        </p>
      )}
      {note && <p className="stat__note">{note}</p>}
      {children}
    </article>
  );
}

type StudioOverviewProps = {
  stats: CreatorStats;
};

export function StudioOverview({ stats }: StudioOverviewProps) {
  return (
    <div className="studio-panel">
      <div className="stats-grid">
        <StatCard
          label="Abonnés"
          value={formatNumber(stats.followers)}
          delta={stats.followers_delta_30d}
          deltaUnit="abonnés"
        />
        <StatCard
          label="Vues du profil"
          value={formatNumber(stats.profile_views_30d)}
          note="sur les 30 derniers jours"
        />
        <StatCard
          label="Clics sur tes liens"
          value={formatNumber(stats.link_clicks_30d)}
          note="sur les 30 derniers jours"
        >
          <Sparkline series={LINK_CLICKS_SERIES} />
        </StatCard>
        <StatCard
          label="Note moyenne donnée"
          value={`${formatDecimal(stats.avg_rating_given)} / 10`}
          note={`sur ${formatNumber(stats.reviews_count)} critiques`}
        />
        <StatCard
          label="Listes publiées"
          value={formatNumber(stats.lists_count)}
          note="visibles sur ta page publique"
        />
      </div>

      <p className="highlight">
        <IconStar size={14} />
        {CREATOR_HIGHLIGHT}
      </p>

      <div className="charts">
        <AreaChart series={PROFILE_VIEWS_SERIES} />
        <BarChart series={FOLLOWERS_SERIES} />
      </div>
    </div>
  );
}
