import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { FeedEvent, FeedProfile } from "../api/feed";
import type { CreatorProfile } from "../types/studio";
import { messageOf } from "../api/client";
import { getFeed } from "../api/feed";
import { creatorAvatarGradient } from "../config/theme";
import { formatRelativeTime, formatScore } from "../utils/format";
import { Notice, Spinner } from "./StateMessage";

type SpaceFeedProps = {
  viewer: CreatorProfile;
};

/**
 * Fil d'activité des abonnements.
 * Il lit `activity`, qui est matérialisée par des triggers : aucun assemblage
 * de jointures au chargement.
 */
export function SpaceFeed({ viewer }: SpaceFeedProps) {
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
    <div className="studio-panel">
      <div className="studio-block__head">
        <h2 className="studio-block__title">Ton fil</h2>
      </div>

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
    </div>
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
