import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FeedEvent, FeedProfile } from "../api/feed";
import type { CreatorProfile } from "../types/studio";
import { messageOf } from "../api/client";
import { getFeed } from "../api/feed";
import { creatorAvatarGradient } from "../config/theme";
import { useAuth } from "../context/auth-context";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatRelativeTime, formatScore } from "../utils/format";
import { Notice, Spinner } from "./StateMessage";

/**
 * Page du fil, à sa propre adresse.
 *
 * C'est une destination de retour quotidien : elle mérite mieux que deux clics
 * dans un onglet d'espace personnel. La page reste privée, l'accueil public.
 */
export function Feed() {
  useDocumentTitle("Fil");

  const { status, profile } = useAuth();

  if (status === "unconfigured") {
    return (
      <main className="shell empty">
        <h1 className="empty__title">Fil hors ligne</h1>
        <p className="empty__body">
          La base n'est pas encore reliée à cette installation, donc ton fil n'a rien
          à afficher.
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
          Ton fil réunit ce qu'ont fait les membres que tu suis. Il te faut un compte
          pour l'ouvrir.
        </p>
        <Link className="btn btn--primary" to="/connexion?retour=%2Ffil">
          Se connecter
        </Link>
      </main>
    );
  }

  if (status === "loading" || !profile) {
    return (
      <main className="shell feed-page">
        <Spinner label="Nous chargeons ton fil" />
      </main>
    );
  }

  return (
    <main className="shell feed-page">
      <h1 className="feed-page__title">Ton fil</h1>
      <FeedList viewer={profile} />
    </main>
  );
}

type FeedListProps = {
  viewer: CreatorProfile;
};

/**
 * Liste des événements.
 * Elle lit `activity`, matérialisée par des triggers : aucun assemblage de
 * jointures au chargement.
 */
function FeedList({ viewer }: FeedListProps) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await getFeed(viewer.id);
      setEvents(page.events);
      setCursor(page.nextCursor);
      setFollowing(page.followingCount);
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [viewer.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);

    try {
      const page = await getFeed(viewer.id, { before: cursor });
      setEvents((current) => [...current, ...page.events]);
      setCursor(page.nextCursor);
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      {/* L'invitation à suivre n'a de sens que si le fil s'est bien chargé :
          sinon elle contredirait le message d'erreur juste au-dessus. */}
      {following === 0 && !loading && !error && (
        <p className="studio-empty">
          Suis des membres pour voir leur activité ici. Ouvre la page publique d'un
          créateur, puis abonne-toi.
        </p>
      )}

      {loading ? (
        <Spinner label="Nous chargeons ton fil" />
      ) : events.length === 0 ? (
        following > 0 && (
          <p className="studio-empty">Rien de nouveau pour l'instant.</p>
        )
      ) : (
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
        <ActorName profile={event.actor} />{" "}
        <FeedSentence event={event} />
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
