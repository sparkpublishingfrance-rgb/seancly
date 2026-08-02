import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { PublicList } from "../api/listSocial";
import type { CreatorProfile } from "../types/studio";
import { messageOf } from "../api/client";
import { getListItems } from "../api/lists";
import {
  getListFollowState,
  getPublicList,
  toggleListFollow,
} from "../api/listSocial";
import { titleById } from "../data/titles";
import { creatorAvatarGradient } from "../config/theme";
import { useAuth } from "../context/auth-context";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useOpenGraph } from "../hooks/useOpenGraph";
import { formatNumber } from "../utils/format";
import { EmptyState } from "./EmptyState";
import { ListComments } from "./ListComments";
import { PosterCard } from "./PosterCard";
import { Notice, Spinner } from "./StateMessage";

type PageData = {
  list: PublicList;
  titleRefs: string[];
};

/**
 * Page publique d'une liste.
 *
 * Une liste reste l'œuvre d'une seule personne : son auteur en garde le
 * contenu. Ce qui est collectif, c'est ce qu'on en fait autour, la suivre et la
 * commenter.
 */
export function ListDetail() {
  const { id = "" } = useParams();
  const { status, profile } = useAuth();

  const [data, setData] = useState<PageData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const list = await getPublicList(id);
      if (!list) {
        setState("missing");
        return;
      }

      setData({ list, titleRefs: await getListItems(list.id) });
      setState("ready");
    } catch (cause) {
      setError(messageOf(cause));
      setState("failed");
    }
  }, [id]);

  useEffect(() => {
    if (status === "unconfigured") {
      setState("failed");
      setError("La base n'est pas encore reliée à cette installation.");
      return;
    }
    if (status === "loading") return;
    void load();
  }, [status, load]);

  useDocumentTitle(data?.list.title);
  useOpenGraph({
    title: data ? `${data.list.title}, une liste sur Seancly` : "Seancly",
    description: data
      ? `Une liste de ${data.list.owner.displayName}, ${formatNumber(data.list.stats.items)} titres.`
      : "Le cinéma, mais avec du monde autour.",
  });

  if (state === "missing") {
    return (
      <EmptyState
        title="Cette liste n'existe pas"
        body="Elle a peut-être été retirée, ou son auteur l'a rendue privée."
      />
    );
  }

  if (state === "failed") {
    return (
      <main className="shell listpage">
        <Notice tone="error">{error}</Notice>
        <Link className="btn btn--ghost" to="/">
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  if (state === "loading" || !data) {
    return (
      <main className="shell listpage">
        <Spinner label="Nous ouvrons cette liste" />
      </main>
    );
  }

  const { list, titleRefs } = data;
  const titles = titleRefs.map((ref) => titleById(Number(ref))).filter((t) => t !== undefined);

  return (
    <main className="shell listpage">
      <header className="listhead">
        <p className="listhead__kicker">Liste</p>
        <h1 className="listhead__title">{list.title}</h1>

        <Link className="listhead__author" to={`/@${list.owner.slug}`}>
          <span
            className="listhead__avatar"
            style={{ background: creatorAvatarGradient(list.owner.avatarColor) }}
            aria-hidden="true"
          >
            {list.owner.initials}
          </span>
          {list.owner.displayName}
        </Link>

        <p className="listhead__stats">
          <strong>{formatNumber(list.stats.items)}</strong>
          {list.stats.items > 1 ? " titres" : " titre"}
          <span className="listhead__sep" aria-hidden="true" />
          <strong>{formatNumber(list.stats.followers)}</strong>
          {list.stats.followers > 1 ? " abonnés" : " abonné"}
        </p>

        <FollowListButton
          listId={list.id}
          viewer={status === "signed-in" ? profile : null}
          onChange={(delta) =>
            setData((current) =>
              current
                ? {
                    ...current,
                    list: {
                      ...current.list,
                      stats: {
                        ...current.list.stats,
                        followers: current.list.stats.followers + delta,
                      },
                    },
                  }
                : current,
            )
          }
        />
      </header>

      <section className="listpage__items" aria-label="Titres de la liste">
        {titles.length === 0 ? (
          <p className="studio-empty">Cette liste est encore vide.</p>
        ) : (
          <ul className="listpage__grid">
            {titles.map((title) => (
              <li key={title.id}>
                <PosterCard title={title} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ListComments listId={list.id} ownerId={list.owner.id} />
    </main>
  );
}

type FollowListButtonProps = {
  listId: string;
  viewer: CreatorProfile | null;
  /** Ajuste le compteur affiché sans recharger la page. */
  onChange: (delta: 1 | -1) => void;
};

/** Suivi d'une liste, optimiste et réversible si la base refuse. */
function FollowListButton({ listId, viewer, onChange }: FollowListButtonProps) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerId = viewer?.id;
  // Une bascule en cours prime sur la lecture d'état lancée au montage : sans
  // ce garde-fou, une réponse tardive écrase le choix de l'utilisateur.
  const touched = useRef(false);

  useEffect(() => {
    if (!viewerId) return;
    let alive = true;

    void getListFollowState(listId, viewerId)
      .then((value) => {
        if (alive && !touched.current) setFollowing(value);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [viewerId, listId]);

  if (!viewerId) {
    return (
      <Link
        className="btn btn--primary"
        to={`/connexion?retour=${encodeURIComponent(`/liste/${listId}`)}`}
      >
        Suivre la liste
      </Link>
    );
  }

  async function onToggle() {
    if (!viewerId) return;
    const previous = following;

    touched.current = true;
    setFollowing(!previous);
    onChange(previous ? -1 : 1);
    setBusy(true);
    setError(null);

    try {
      const result = await toggleListFollow(listId, viewerId);
      setFollowing(result);
    } catch (cause) {
      setFollowing(previous);
      onChange(previous ? 1 : -1);
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={following ? "btn btn--ghost" : "btn btn--primary"}
        aria-pressed={following}
        disabled={busy}
        onClick={() => void onToggle()}
      >
        {following ? "Liste suivie" : "Suivre la liste"}
      </button>
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}
