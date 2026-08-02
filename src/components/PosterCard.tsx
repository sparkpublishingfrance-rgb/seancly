import type { TmdbTitle } from "../types/tmdb";
import { yearOf } from "../data/titles";
import { COLORS } from "../config/theme";
import { IconPlay, IconPlus, IconStar } from "./icons";

/** URL de base des images TMDB, pour le jour où `poster_path` sera renseigné. */
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

/**
 * Construit le dégradé de l'affiche placeholder à partir de la couleur de tranche.
 * Les suffixes hexadécimaux ajoutent l'opacité au format #RRGGBBAA.
 */
function placeholderBackground(spine: string): string {
  return [
    `radial-gradient(118% 76% at 22% 8%, ${spine}b0 0%, ${spine}22 58%, transparent 72%)`,
    `linear-gradient(168deg, ${spine}66 0%, ${COLORS.bg}f2 62%, ${COLORS.bg} 100%)`,
  ].join(", ");
}

type PosterCardProps = {
  title: TmdbTitle;
};

export function PosterCard({ title }: PosterCardProps) {
  const spine = title.app?.spine_color ?? COLORS.surface2;
  const progress = title.app?.progress;
  const year = yearOf(title);

  return (
    <article className="poster">
      <div className="poster__frame">
        {title.poster_path ? (
          <img
            className="poster__img"
            src={`${TMDB_IMAGE_BASE}${title.poster_path}`}
            alt={`Affiche de ${title.title}`}
            loading="lazy"
          />
        ) : (
          <div
            className="poster__placeholder"
            style={{ background: placeholderBackground(spine) }}
          >
            <h3 className="poster__name">{title.title}</h3>
            <span className="poster__year">{year}</span>
          </div>
        )}

        <span className="poster__rating">
          <IconStar size={11} />
          {title.vote_average.toFixed(1)}
        </span>

        <div className="poster__overlay">
          <button
            type="button"
            className="poster__action poster__action--play"
            aria-label={`Lire ${title.title}`}
          >
            <IconPlay />
          </button>
          <button
            type="button"
            className="poster__action"
            aria-label={`Ajouter ${title.title} à ma liste`}
          >
            <IconPlus />
          </button>
          <button
            type="button"
            className="poster__action poster__action--star"
            aria-label={`Noter ${title.title}`}
          >
            <IconStar />
          </button>
        </div>

        {progress !== undefined && (
          <div
            className="poster__progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression de ${title.title}`}
          >
            <div className="poster__progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Le titre visible vit dans le placeholder. Quand la vraie affiche arrive,
          ce doublon prend le relais pour les lecteurs d'écran. */}
      {title.poster_path !== null && (
        <span className="sr-only">
          {title.title}, {year}
        </span>
      )}
    </article>
  );
}
