import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { FeedEvent, FeedProfile, FeedScope } from "../api/feed";
import type { CreatorProfile } from "../types/studio";
import { messageOf } from "../api/client";
import { getFeed } from "../api/feed";
import { creatorAvatarGradient } from "../config/theme";
import { useAuth } from "../context/auth-context";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatRelativeTime, formatScore } from "../utils/format";
import { Notice, Spinner } from "./StateMessage";

const SCOPES: { id: FeedScope; label: string }[] = [
  { id: "community", label: "La communauté" },
  { id: "following", label: "Mes abonnements" },
];

/**
 * Actualité des membres, à sa propre adresse.
 *
 * Deux périmètres : ce que publie toute la communauté, et ce que font les
 * personnes suivies. C'est une destination de retour quotidien, d'où sa place
 * dans la navigation principale. La page reste privée, l'accueil public.
 */
export function Feed() {
  useDocumentTitle("Actualité");

  const { status, profile } = useAuth();

  if (status === "unconfigured") {
    return (
      <main className="shell empty">
        <h1 className="empty__title">Actualité hors ligne</h1>
        <p className="empty__body">
          La base n'est pas encore reliée à cette installation, donc l'actualité n'a
          rien à afficher.
        </p>
        <Link className="btn btn--ghost" to="/">
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  if (status === "signed-out") {
    return (
      <main className="shell empty">
        <h1 className="empty__title">Connecte-toi</h1>
        <p className="empty__body">
          L'actualité réunit les notes et les critiques des membres. Il te faut un
          compte pour la lire.
        </p>
        <Link className="btn btn--primary" to="/connexion?retour=%2Factualite">
          Se connecter
        </Link>
      </main>
    );
  }

  if (status === "loading" || !profile) {
    return (
      <main className="shell feed-page">
        <Spinner label="Nous chargeons l'actualité" />
      </main>
    );
  }

  return (
    <main className="shell feed-page">
      <h1 className="feed-page__title">Actualité</h1>
      <FeedScopes viewer={profile} />
    </main>
  );
}

/** Bascule entre les deux périmètres, au motif d'onglets habituel. */
function FeedScopes({ viewer }: { viewer: CreatorProfile }) {
  const [scope, setScope] = useState<FeedScope>("community");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = SCOPES.length - 1;
    let next = index;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setScope(SCOPES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Périmètre de l'actualité">
        {SCOPES.map((entry, index) => (
          <button
            key={entry.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`scope-${entry.id}`}
            className="tab"
            aria-selected={scope === entry.id}
            aria-controls={`feed-${entry.id}`}
            tabIndex={scope === entry.id ? 0 : -1}
            onClick={() => setScope(entry.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`feed-${scope}`} aria-labelledby={`scope-${scope}`} tabIndex={0}>
        {/* La clé force un remontage : changer de périmètre repart d'une page
            vierge plutôt que d'empiler deux fils. */}
        <FeedList viewer={viewer} scope={scope} key={scope} />
      </div>
    </>
  );
}

type FeedListProps = {
  viewer: CreatorProfile;
  scope: FeedScope;
};

/**
 * Liste des événements.
 * Elle lit `activity`, matérialisée par des triggers : aucun assemblage de
 * jointures au chargement.
 */
function FeedList({ viewer, scope }: FeedListProps) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await getFeed(viewer.id, { scope });
      setEvents(page.events);
      setCursor(page.nextCursor);
      setFollowing(page.followingCount);
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [viewer.id, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);

    try {
      const page = await getFeed(viewer.id, { scope, before: cursor });
      setEvents((current) => [...current, ...page.events]);
      setCursor(page.nextCursor);
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return <Spinner label="Nous chargeons l'actualité" />;

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      {/* L'invitation à suivre n'a de sens que si le fil s'est bien chargé :
          sinon elle contredirait le message d'erreur juste au-dessus. */}
      {!error && scope === "following" && following === 0 && (
        <p className="studio-empty">
          Suis des membres pour voir leur activité ici. Ouvre la page publique d'un
          créateur, puis abonne-toi.
        </p>
      )}

      {!error && events.length === 0 && (
        <p className="studio-empty">
          {scope === "community"
            ? "Personne n'a encore noté de titre. Ouvre une fiche et lance-toi."
            : "Rien de nouveau pour l'instant."}
        </p>
      )}

      {events.length > 0 && (
        <>
          <ol className="feed">
            {events.map((event) => (
              <FeedCard event={event} key={event.id} />
            ))}
          </ol>

          {cursor && (
            <button
              type="button"
              className="btn btn--ghost btn--small feed__more"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Chargement" : "Voir plus"}
            </button>
          )}
        </>
      )}
    </>
  );
}

function FeedCard({ event }: { event: FeedEvent }) {
  return (
    <li className="feed__item">
      <Avatar profile={event.actor} />

      <p className="feed__line">
        <ActorName profile={event.actor} /> <FeedSentence event={event} />
      </p>

      <time className="feed__time" dateTime={event.createdAt}>
        {formatRelativeTime(event.createdAt)}
      </time>
    </li>
  );
}

function Avatar({ profile }: { profile: FeedProfile }) {
  return (
    <Link
      className="feed__avatar"
      to={`/@${profile.slug}`}
      style={{ background: creatorAvatarGradient(profile.avatarColor) }}
      aria-label={`Page de ${profile.displayName}`}
    >
      {profile.initials}
    </Link>
  );
}

function ActorName({ profile }: { profile: FeedProfile }) {
  return (
    <Link className="feed__actor" to={`/@${profile.slug}`}>
      {profile.displayName}
    </Link>
  );
}

/** La phrase d'activité, en une ligne de sens par verbe. */
function FeedSentence({ event }: { event: FeedEvent }) {
  switch (event.verb) {
    case "rated":
    case "reviewed": {
      const label = event.verb === "reviewed" ? "a écrit sur" : "a noté";
      return (
        <>
          {label}{" "}
          {event.title && event.titleRef ? (
            <Link className="feed__object" to={`/film/${event.titleRef}`}>
              {event.title.title}
            </Link>
          ) : (
            <span className="feed__object">un titre</span>
          )}
          {event.rating !== undefined && (
            <span className="feed__rating"> {formatScore(event.rating)} sur 5</span>
          )}
        </>
      );
    }

    case "created_list":
      return (
        <>
          a créé la liste <span className="feed__object">{event.listTitle}</span>
        </>
      );

    case "added_to_list":
      return (
        <>
          a enrichi sa liste <span className="feed__object">{event.listTitle}</span>
        </>
      );

    case "followed":
      return (
        <>
          suit désormais{" "}
          {event.target ? (
            <Link className="feed__object" to={`/@${event.target.slug}`}>
              {event.target.displayName}
            </Link>
          ) : (
            <span className="feed__object">un membre</span>
          )}
        </>
      );

    case "joined_guild":
      return <>a rejoint une guilde</>;
  }
}
