import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import type { TmdbTitle } from "../types/tmdb";
import { similarTo, titleById, yearOf } from "../data/titles";
import { COLORS, backdropGradient } from "../config/theme";
import { TMDB_IMAGE_BASE } from "../config/images";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatDecimal } from "../utils/format";
import { EmptyState } from "./EmptyState";
import {
  ContentWarnings,
  CreditsBlock,
  SocialBar,
  Synopsis,
  WatchProviders,
} from "./FilmSections";
import { Rail } from "./Rail";
import { RateControl } from "./RateControl";
import { IconArrowLeft, IconGuild, IconPlay, IconPlus, IconStar } from "./icons";

/** Formate une durée en minutes vers "2 h 08". */
function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${String(rest).padStart(2, "0")}`;
}

export function FilmDetail() {
  const { id } = useParams();
  const title = id ? titleById(Number(id)) : undefined;

  useDocumentTitle(title?.title);

  // Une fiche ouverte depuis « Dans le même esprit » doit démarrer en haut.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!title) {
    return (
      <EmptyState
        title="Ce titre n'existe pas"
        body="Il a peut-être été retiré du catalogue, ou le lien est incomplet."
      />
    );
  }

  return (
    <main>
      <FilmHero title={title} />

      <div className="rows">
        <SocialBar
          average={title.vote_average}
          friends={title.app?.friends_ratings ?? []}
        />

        <Synopsis overview={title.overview} />

        <WatchProviders providers={title.app?.watch_providers ?? []} />

        {title.app?.trigger_warnings && title.app.trigger_warnings.length > 0 && (
          <ContentWarnings warnings={title.app.trigger_warnings} />
        )}

        {title.credits && (title.credits.cast.length > 0 || title.credits.crew.length > 0) && (
          <CreditsBlock cast={title.credits.cast} crew={title.credits.crew} />
        )}

        <Rail rail={similarTo(title)} />
      </div>
    </main>
  );
}

type FilmHeroProps = {
  title: TmdbTitle;
};

function FilmHero({ title }: FilmHeroProps) {
  const spine = title.app?.spine_color ?? COLORS.surface2;

  return (
    <section className="film-hero" aria-labelledby="film-title">
      {title.backdrop_path ? (
        <img
          className="film-hero__image"
          src={`${TMDB_IMAGE_BASE.backdrop}${title.backdrop_path}`}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div
          className="film-hero__image"
          style={{ background: backdropGradient(spine) }}
          aria-hidden="true"
        />
      )}
      <div className="film-hero__scrim" aria-hidden="true" />

      <div className="shell film-hero__inner">
        <Link className="film-hero__back" to="/">
          <IconArrowLeft size={15} />
          Retour à l'accueil
        </Link>

        <h1 className="film-hero__title" id="film-title">
          {title.title}
        </h1>

        {title.tagline && <p className="film-hero__tagline">{title.tagline}</p>}

        <div className="film-hero__meta">
          <span className="film-hero__rating">
            <IconStar size={13} /> {formatDecimal(title.vote_average)}
          </span>
          <span>{yearOf(title)}</span>
          <span>{title.media_type === "tv" ? "Série" : "Film"}</span>
          {title.runtime && <span>{formatRuntime(title.runtime)}</span>}
          <span className="film-hero__audio">VF · VOSTFR</span>
        </div>

        <ul className="film-hero__genres">
          {title.genres.map((genre) => (
            <li className="chip" key={genre.id}>
              {genre.name}
            </li>
          ))}
        </ul>

        <div className="film-hero__actions">
          <button type="button" className="btn btn--primary">
            <IconPlay />
            Bande-annonce
          </button>
          <button type="button" className="btn btn--ghost">
            <IconPlus />
            Ma liste
          </button>
          <RateControl titleRef={String(title.id)} titleName={title.title} />
          <button type="button" className="btn btn--ghost">
            <IconGuild />
            Ajouter à une guilde
          </button>
        </div>
      </div>
    </section>
  );
}
