import { useId, useState } from "react";
import type {
  CastMember,
  CrewMember,
  FriendRating,
  WatchProvider,
  WatchProviderType,
} from "../types/tmdb";
import { avatarGradient } from "../config/theme";
import { TMDB_IMAGE_BASE } from "../config/images";
import { IconAlert, IconChevronDown, IconStar } from "./icons";

/* ------------------------------------------------------------ note sociale */

type SocialBarProps = {
  average: number;
  friends: FriendRating[];
};

/**
 * Note moyenne et notes des membres suivis.
 * Le bloc social ne s'affiche que si au moins un membre a noté.
 */
export function SocialBar({ average, friends }: SocialBarProps) {
  return (
    <section className="shell" aria-label="Notes">
      <div className="social">
        <p className="social__score">
          <IconStar size={17} />
          <span className="social__score-value">{average.toFixed(1)}</span>
          <span className="social__score-scale">/ 10</span>
          <span className="social__score-label">note moyenne</span>
        </p>

        {friends.length > 0 && (
          <div className="social__friends">
            <ul className="social__friend-list">
              {friends.map((friend) => (
                <li className="friend" key={friend.handle}>
                  <span
                    className="friend__avatar"
                    style={{ background: avatarGradient("#C0386A") }}
                    aria-hidden="true"
                  >
                    {friend.initials}
                  </span>
                  <span className="friend__rating">{friend.rating.toFixed(1)}</span>
                  <span className="sr-only">
                    {friend.handle} a mis {friend.rating.toFixed(1)} sur 10
                  </span>
                </li>
              ))}
            </ul>
            <p className="social__friends-label">
              Noté par <strong>{friends.length}</strong>{" "}
              {friends.length > 1 ? "membres que tu suis" : "membre que tu suis"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- synopsis */

type SynopsisProps = {
  overview: string;
};

export function Synopsis({ overview }: SynopsisProps) {
  return (
    <section className="shell film-section" aria-labelledby="synopsis-title">
      <h2 className="film-section__title" id="synopsis-title">
        Synopsis
      </h2>
      <p className="film-section__prose">{overview}</p>
    </section>
  );
}

/* ------------------------------------------------------------ où regarder */

const PROVIDER_GROUPS: { type: WatchProviderType; label: string }[] = [
  { type: "flatrate", label: "En streaming" },
  { type: "rent", label: "En location" },
  { type: "buy", label: "À l'achat" },
];

type WatchProvidersProps = {
  providers: WatchProvider[];
};

export function WatchProviders({ providers }: WatchProvidersProps) {
  const groups = PROVIDER_GROUPS.map((group) => ({
    ...group,
    items: providers.filter((provider) => provider.type === group.type),
  })).filter((group) => group.items.length > 0);

  return (
    <section className="shell film-section" aria-labelledby="providers-title">
      <h2 className="film-section__title" id="providers-title">
        Où regarder
      </h2>

      {groups.length === 0 ? (
        <p className="film-section__empty">
          Pas encore disponible en streaming en France.
        </p>
      ) : (
        <div className="providers">
          {groups.map((group) => (
            <div className="providers__group" key={group.type}>
              <h3 className="providers__label">{group.label}</h3>
              <ul className="providers__list">
                {group.items.map((provider) => (
                  <li className="provider" key={`${group.type}-${provider.name}`}>
                    <span className="provider__mark" aria-hidden="true">
                      {provider.name.slice(0, 1)}
                    </span>
                    {provider.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------- avertissements de contenu */

type ContentWarningsProps = {
  warnings: string[];
};

/** Bloc replié par défaut : on informe, on ne juge pas, et on ne divulgâche pas. */
export function ContentWarnings({ warnings }: ContentWarningsProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section className="shell film-section">
      <div className="warnings">
        <button
          type="button"
          className="warnings__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <IconAlert />
          {open ? "Masquer les avertissements de contenu" : "Afficher les avertissements de contenu"}
          <span className={open ? "warnings__chevron warnings__chevron--open" : "warnings__chevron"}>
            <IconChevronDown />
          </span>
        </button>

        <div className="warnings__panel" id={panelId} hidden={!open}>
          <ul className="warnings__list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- casting, équipe */

/** Postes TMDB retenus pour l'équipe, dans l'ordre d'affichage. */
const CREW_LABELS: { jobs: string[]; label: string }[] = [
  { jobs: ["Director"], label: "Réalisation" },
  { jobs: ["Screenplay", "Writer"], label: "Scénario" },
  { jobs: ["Director of Photography"], label: "Image" },
  { jobs: ["Original Music Composer"], label: "Musique" },
];

/** Teintes de repli pour les portraits absents. */
const PROFILE_TINTS = ["#C0386A", "#7B4BC9", "#2F6F62", "#8C6239", "#3E5C76", "#9C3B2E"];

type CreditsBlockProps = {
  cast: CastMember[];
  crew: CrewMember[];
};

export function CreditsBlock({ cast, crew }: CreditsBlockProps) {
  const lines = CREW_LABELS.map((entry) => ({
    label: entry.label,
    names: [
      ...new Set(
        crew.filter((member) => entry.jobs.includes(member.job)).map((member) => member.name),
      ),
    ],
  })).filter((line) => line.names.length > 0);

  return (
    <section className="shell film-section" aria-labelledby="credits-title">
      <h2 className="film-section__title" id="credits-title">
        Casting et équipe
      </h2>

      {lines.length > 0 && (
        <dl className="crew">
          {lines.map((line) => (
            <div className="crew__line" key={line.label}>
              <dt className="crew__label">{line.label}</dt>
              <dd className="crew__names">{line.names.join(", ")}</dd>
            </div>
          ))}
        </dl>
      )}

      {cast.length > 0 && (
        <ul className="cast">
          {cast.map((member, index) => (
            <li className="cast__item" key={member.id}>
              {member.profile_path ? (
                <img
                  className="cast__photo"
                  src={`${TMDB_IMAGE_BASE.profile}${member.profile_path}`}
                  alt={member.name}
                  loading="lazy"
                />
              ) : (
                <span
                  className="cast__photo cast__photo--placeholder"
                  style={{
                    background: avatarGradient(PROFILE_TINTS[index % PROFILE_TINTS.length]),
                  }}
                  aria-hidden="true"
                >
                  {initialsOf(member.name)}
                </span>
              )}
              <span className="cast__name">{member.name}</span>
              <span className="cast__role">{member.character}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Initiales d'un nom complet, deux lettres au maximum. */
function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}
