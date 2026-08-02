import { Link } from "react-router-dom";
import type { TmdbTitle } from "../types/tmdb";
import { yearOf } from "../data/titles";
import { COLORS, posterGradient } from "../config/theme";
import { TMDB_IMAGE_BASE } from "../config/images";
import { formatDecimal } from "../utils/format";
import { IconPlay, IconPlus, IconStar } from "./icons";

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
            src={`${TMDB_IMAGE_BASE.poster}${title.poster_path}`}
            alt={`Affiche de ${title.title}`}
            loading="lazy"
          />
        ) : (
          <div
            className="poster__placeholder"
            style={{ background: posterGradient(spine) }}
          >
            <h3 className="poster__name">{title.title}</h3>
            <span className="poster__year">{year}</span>
          </div>
        )}

        {/* Lien étiré sur toute la carte. Les boutons d'action passent au-dessus,
            ce qui évite d'imbriquer des éléments interactifs dans un lien. */}
        <Link
          className="poster__link"
          to={`/film/${title.id}`}
          aria-label={`Voir la fiche de ${title.title}, ${year}`}
        />

        <span className="poster__rating">
          <IconStar size={11} />
          {formatDecimal(title.vote_average)}
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
    </article>
  );
}
