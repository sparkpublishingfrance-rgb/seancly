import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AuthoredRating } from "../api/ratings";
import type { PublicLink } from "../api/links";
import type { CreatorList } from "../types/studio";
import type { PublicCreator } from "../api/profiles";
import { messageOf } from "../api/client";
import { getPublicLinks, registerLinkClick } from "../api/links";
import { getPublicLists } from "../api/lists";
import { getPublicProfileBySlug } from "../api/profiles";
import { getRecentRatingsByAuthor } from "../api/ratings";
import { isFollowing, toggleFollow } from "../api/follows";
import { titleById, yearOf } from "../data/titles";
import { useAuth } from "../context/auth-context";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useOpenGraph } from "../hooks/useOpenGraph";
import { formatDecimal, formatNumber } from "../utils/format";
import { CreatorShowcase } from "./CreatorShowcase";
import { EmptyState } from "./EmptyState";
import { Notice, Spinner } from "./StateMessage";
import { IconStar } from "./icons";

type PageData = {
  creator: PublicCreator;
  links: PublicLink[];
  lists: CreatorList[];
  ratings: AuthoredRating[];
};

/**
 * Vitrine publique d'un créateur, atteignable sans compte.
 * C'est la page qui reçoit les visiteurs venus d'un lien en bio, donc pensée
 * pour le téléphone d'abord.
 */
export function CreatorPublic() {
  const { slug: segment = "" } = useParams();
  // Seul un segment commençant par une arobase désigne une vitrine. Le reste
  // est une adresse inconnue, traitée comme telle plus bas.
  const slug = segment.startsWith("@") ? segment.slice(1) : "";
  const { status, profile } = useAuth();

  const [data, setData] = useState<PageData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const creator = await getPublicProfileBySlug(slug);
      if (!creator) {
        setState("missing");
        return;
      }

      const [links, lists, ratings] = await Promise.all([
        getPublicLinks(creator.id),
        getPublicLists(creator.id),
        getRecentRatingsByAuthor(creator.id),
      ]);

      setData({ creator, links, lists, ratings });
      setState("ready");
    } catch (cause) {
      setError(messageOf(cause));
      setState("failed");
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setState("missing");
      return;
    }
    if (status === "unconfigured") {
      setState("failed");
      setError("La base n'est pas encore reliée à cette installation.");
      return;
    }
    // On attend de savoir si quelqu'un est connecté avant de charger : le
    // visiteur anonyme et le créateur ne voient pas tout à fait la même page.
    if (status === "loading") return;
    void load();
  }, [status, slug, load]);

  useDocumentTitle(data?.creator.display_name);
  useOpenGraph({
    title: data ? `${data.creator.display_name} sur Seancly` : "Seancly",
    description: data?.creator.bio || "Le cinéma, mais avec du monde autour.",
  });

  if (state === "missing") {
    return (
      <EmptyState
        title="Cette page n'existe pas"
        body={
          slug
            ? `Personne ne porte le nom « @${slug} » chez nous, ou ce compte a été fermé.`
            : "Le lien que tu as suivi ne mène nulle part."
        }
      />
    );
  }

  if (state === "failed") {
    return (
      <main className="shell creator">
        <Notice tone="error">{error}</Notice>
        <Link className="btn btn--ghost" to="/">
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  if (state === "loading" || !data) {
    return (
      <main className="shell creator">
        <Spinner label="Nous ouvrons cette page" />
      </main>
    );
  }

  const { creator, links, lists, ratings } = data;
  const isOwner = profile?.id === creator.id;

  return (
    <main className="shell creator">
      {isOwner && (
        <p className="creator__owner">
          C'est ta page publique, telle que tes abonnés la voient.
          <Link className="btn btn--ghost btn--small" to="/studio">
            Gérer dans le studio
          </Link>
        </p>
      )}

      <CreatorShowcase
        variant="public"
        profile={creator}
        links={links}
        emptyLabel={
          isOwner
            ? "Tu n'as pas encore ajouté de lien. Ajoute le premier depuis ton studio."
            : "Ce créateur n'a pas encore ajouté de liens."
        }
        onLinkClick={(link) => {
          // Le comptage ne doit jamais retarder ni empêcher l'ouverture du lien.
          void registerLinkClick(link.id).catch(() => undefined);
        }}
      >
        <p className="creator__counts">
          <strong>{formatNumber(creator.followers)}</strong>
          {creator.followers > 1 ? " abonnés" : " abonné"}
          {creator.public_lists > 0 && (
            <>
              <span className="creator__sep" aria-hidden="true" />
              <strong>{formatNumber(creator.public_lists)}</strong>
              {creator.public_lists > 1 ? " listes" : " liste"}
            </>
          )}
        </p>

        {!isOwner && <FollowButton creatorId={creator.id} slug={slug} />}
      </CreatorShowcase>

      {lists.length > 0 && (
        <section className="creator__section" aria-labelledby="creator-lists">
          <h2 className="creator__section-title" id="creator-lists">
            Ses listes
          </h2>
          <ul className="listgrid">
            {lists.map((list) => (
              <li className="listcard" key={list.id}>
                <h3 className="listcard__title">{list.title}</h3>
                <p className="listcard__meta">
                  {formatNumber(list.item_count)}
                  {list.item_count > 1 ? " titres" : " titre"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentRatings ratings={ratings} isOwner={isOwner} />
    </main>
  );
}

/* ------------------------------------------------------------- abonnement */

type FollowButtonProps = {
  creatorId: string;
  slug: string;
};

/**
 * Abonnement, avec bascule optimiste et retour arrière si la base refuse.
 * Sans compte, on renvoie vers la connexion en gardant le chemin de retour.
 */
function FollowButton({ creatorId, slug }: FollowButtonProps) {
  const { status, profile } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerId = profile?.id;

  useEffect(() => {
    if (!viewerId) return;
    let alive = true;

    void isFollowing(viewerId, creatorId)
      .then((value) => {
        if (alive) setFollowing(value);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [viewerId, creatorId]);

  if (status !== "signed-in" || !viewerId) {
    return (
      <Link
        className="btn btn--primary btn--block"
        to={`/connexion?retour=${encodeURIComponent(`/@${slug}`)}`}
      >
        S'abonner
      </Link>
    );
  }

  async function onToggle() {
    if (!viewerId) return;
    const previous = following;

    setFollowing(!previous);
    setBusy(true);
    setError(null);

    try {
      const result = await toggleFollow(viewerId, creatorId);
      setFollowing(result);
    } catch (cause) {
      setFollowing(previous);
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={following ? "btn btn--ghost btn--block" : "btn btn--primary btn--block"}
        aria-pressed={following}
        disabled={busy}
        onClick={() => void onToggle()}
      >
        {following ? "Abonné" : "S'abonner"}
      </button>
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}

/* --------------------------------------------------------------- activité */

type RecentRatingsProps = {
  ratings: AuthoredRating[];
  isOwner: boolean;
};

/** Dernières notes publiques. Les titres viennent encore du jeu de données mocké. */
function RecentRatings({ ratings, isOwner }: RecentRatingsProps) {
  const resolved = ratings
    .map((entry) => ({ entry, title: titleById(Number(entry.titleRef)) }))
    .filter((row) => row.title !== undefined);

  return (
    <section className="creator__section" aria-labelledby="creator-activity">
      <h2 className="creator__section-title" id="creator-activity">
        Ce qu'il a aimé récemment
      </h2>

      {resolved.length === 0 ? (
        <p className="studio-empty">
          {isOwner
            ? "Note un titre depuis sa fiche, il apparaîtra ici."
            : "Ce créateur n'a pas encore noté de titre publiquement."}
        </p>
      ) : (
        <ul className="activity">
          {resolved.map(({ entry, title }) => (
            <li className="activity__item" key={entry.titleRef}>
              <Link className="activity__link" to={`/film/${title!.id}`}>
                <span className="activity__title">{title!.title}</span>
                <span className="activity__year">{yearOf(title!)}</span>
              </Link>
              <span className="activity__rating">
                <IconStar size={12} />
                {formatDecimal(entry.rating)}
                <span className="sr-only">sur 5</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
