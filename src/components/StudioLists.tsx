import { useCallback, useEffect, useState } from "react";
import type { CreatorList, CreatorProfile, OfferStatus, PartnerOffer } from "../types/studio";
import { messageOf } from "../api/client";
import { createList, deleteList, getMyLists } from "../api/lists";
import type { PublicList } from "../api/listSocial";
import { getFollowedLists } from "../api/listSocial";
import { formatNumber } from "../utils/format";
import { Notice, Spinner } from "./StateMessage";
import { Link } from "react-router-dom";
import { IconPlus, IconTrash } from "./icons";

type StudioListsProps = {
  creator: CreatorProfile;
};

export function StudioLists({ creator }: StudioListsProps) {
  const [lists, setLists] = useState<CreatorList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLists(await getMyLists(creator.id));
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [creator.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submit(title: string, isPublic: boolean) {
    try {
      const created = await createList(creator.id, title, isPublic);
      setLists((current) => [created, ...current]);
      setCreating(false);
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    }
  }

  async function remove(list: CreatorList) {
    const previous = lists;
    setLists((current) => current.filter((item) => item.id !== list.id));

    try {
      await deleteList(list.id);
    } catch (cause) {
      setLists(previous);
      setError(messageOf(cause));
    }
  }

  return (
    <div className="studio-panel">
      <div className="studio-block__head">
        <h2 className="studio-block__title">Tes listes</h2>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => setCreating(true)}
          disabled={loading || creating}
        >
          <IconPlus size={14} />
          Créer une liste
        </button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {creating && <ListCreator onCancel={() => setCreating(false)} onSubmit={submit} />}

      {loading ? (
        <Spinner label="Nous chargeons tes listes" />
      ) : lists.length === 0 ? (
        <p className="studio-empty">
          Tu n'as pas encore créé de liste. C'est le meilleur moyen de faire découvrir
          ce que tu aimes.
        </p>
      ) : (
        <ul className="listgrid">
          {lists.map((list) => (
            <li className="listcard" key={list.id}>
              <div className="listcard__head">
                <h3 className="listcard__title">
                  {list.is_public ? (
                    <Link className="listcard__link" to={`/liste/${list.id}`}>
                      {list.title}
                    </Link>
                  ) : (
                    list.title
                  )}
                </h3>
                <button
                  type="button"
                  className="iconbtn iconbtn--danger"
                  onClick={() => void remove(list)}
                  aria-label={`Supprimer ${list.title}`}
                >
                  <IconTrash />
                </button>
              </div>

              <p className="listcard__meta">
                {formatNumber(list.item_count)}
                {list.item_count > 1 ? " titres" : " titre"}
                {list.views !== undefined && (
                  <>
                    <span className="listcard__sep" aria-hidden="true" />
                    {formatNumber(list.views)} vues
                  </>
                )}
              </p>

              <span className={list.is_public ? "tag" : "tag tag--muted"}>
                {list.is_public ? "Publique" : "Privée"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <FollowedLists viewerId={creator.id} />
    </div>
  );
}

/** Listes composées par d'autres, que le membre a choisi de suivre. */
function FollowedLists({ viewerId }: { viewerId: string }) {
  const [lists, setLists] = useState<PublicList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    void getFollowedLists(viewerId)
      .then((loaded) => {
        if (alive) setLists(loaded);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [viewerId]);

  if (loading) return null;

  return (
    <section className="studio-block" aria-labelledby="followed-lists">
      <div className="studio-block__head">
        <h2 className="studio-block__title" id="followed-lists">
          Listes que je suis
        </h2>
      </div>

      {lists.length === 0 ? (
        <p className="studio-empty">
          Tu ne suis encore aucune liste. Ouvre-en une depuis l'accueil pour la
          garder sous la main.
        </p>
      ) : (
        <ul className="listgrid">
          {lists.map((list) => (
            <li className="listcard" key={list.id}>
              <h3 className="listcard__title">
                <Link className="listcard__link" to={`/liste/${list.id}`}>
                  {list.title}
                </Link>
              </h3>
              <p className="listcard__meta">
                par {list.owner.displayName}
                <span className="listcard__sep" aria-hidden="true" />
                {formatNumber(list.stats.items)}
                {list.stats.items > 1 ? " titres" : " titre"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ListCreatorProps = {
  onSubmit: (title: string, isPublic: boolean) => Promise<void>;
  onCancel: () => void;
};

/** Création d'une liste. Le contenu s'ajoute ensuite depuis les fiches. */
function ListCreator({ onSubmit, onCancel }: ListCreatorProps) {
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="listform"
      onSubmit={async (event) => {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;

        setBusy(true);
        await onSubmit(trimmed, isPublic);
        setBusy(false);
      }}
    >
      <label className="sr-only" htmlFor="new-list-title">
        Titre de la liste
      </label>
      <input
        id="new-list-title"
        className="field"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Huis clos parfaits"
        maxLength={120}
        autoFocus
      />

      <label className="listform__visibility">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => setIsPublic(event.target.checked)}
        />
        Visible par tous
      </label>

      <button type="submit" className="btn btn--primary btn--small" disabled={busy}>
        {busy ? "Création" : "Créer"}
      </button>
      <button type="button" className="btn btn--ghost btn--small" onClick={onCancel}>
        Annuler
      </button>
    </form>
  );
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  brouillon: "Brouillon",
  en_ligne: "En ligne",
  clos: "Clos",
};

type StudioOffersProps = {
  offers: PartnerOffer[];
};

export function StudioOffers({ offers }: StudioOffersProps) {
  return (
    <div className="studio-panel">
      <div className="studio-block__head">
        <h2 className="studio-block__title">Tes offres de partenariat</h2>
        <button type="button" className="btn btn--ghost btn--small">
          <IconPlus size={14} />
          Proposer une offre
        </button>
      </div>

      {offers.length === 0 ? (
        <p className="studio-empty">
          Tu n'as pas encore publié d'offre. Décris ce que tu proposes aux marques et
          aux distributeurs, nous nous chargeons de la mise en relation.
        </p>
      ) : (
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Offre</th>
                <th scope="col">Statut</th>
                <th scope="col">Demandes</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <th scope="row">{offer.title}</th>
                  <td>
                    <span className={`status status--${offer.status}`}>
                      <span className="status__dot" aria-hidden="true" />
                      {STATUS_LABELS[offer.status]}
                    </span>
                  </td>
                  <td className="table__number">{formatNumber(offer.requests)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="studio-note">
        Les offres sont encore des exemples : leur table arrivera avec la mise en
        relation.
      </p>
    </div>
  );
}
