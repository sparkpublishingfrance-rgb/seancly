import type { TmdbTitle } from "../types/tmdb";
import { yearOf } from "../data/titles";
import { formatDecimal } from "../utils/format";
import { IconPlay, IconPlus, IconStar } from "./icons";

/** Sépare le dernier mot du titre, rendu en framboise. */
function splitTitle(value: string): { head: string; tail: string } {
  const index = value.lastIndexOf(" ");
  if (index === -1) return { head: "", tail: value };
  return { head: value.slice(0, index + 1), tail: value.slice(index + 1) };
}

/** Formate une durée en minutes vers "2 h 08". */
function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${String(rest).padStart(2, "0")}`;
}

type HeroProps = {
  title: TmdbTitle;
};

export function Hero({ title }: HeroProps) {
  const { head, tail } = splitTitle(title.title);
  const recommendedBy = title.app?.recommended_by ?? [];
  const genre = title.genres[0]?.name;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />

      <div className="shell hero__inner">
        <div className="hero__content">
          <span className="hero__kicker">
            <span className="hero__kicker-dot" aria-hidden="true" />
            À l'affiche cette semaine
          </span>

          <h1 className="hero__title" id="hero-title">
            {head}
            <span className="hero__title-tail">{tail}</span>
          </h1>

          <div className="hero__meta">
            <span className="hero__rating">
              <IconStar size={12} /> {formatDecimal(title.vote_average)}
            </span>
            <span className="hero__meta-sep" aria-hidden="true" />
            <span>{yearOf(title)}</span>
            {genre && (
              <>
                <span className="hero__meta-sep" aria-hidden="true" />
                <span>{genre}</span>
              </>
            )}
            {title.runtime && (
              <>
                <span className="hero__meta-sep" aria-hidden="true" />
                <span>{formatRuntime(title.runtime)}</span>
              </>
            )}
            <span className="hero__audio">VF · VOSTFR</span>
          </div>

          <p className="hero__overview">{title.overview}</p>

          {recommendedBy.length > 0 && (
            <p className="hero__credit">
              <IconStar size={13} />
              Recommandé par <strong>{recommendedBy.length} créateurs</strong> que tu suis
            </p>
          )}

          <div className="hero__actions">
            <button type="button" className="btn btn--primary">
              <IconPlay />
              Bande-annonce
            </button>
            <button type="button" className="btn btn--ghost">
              <IconPlus />
              Ma liste
            </button>
            <button type="button" className="btn btn--ghost">
              <IconStar />
              Noter
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
