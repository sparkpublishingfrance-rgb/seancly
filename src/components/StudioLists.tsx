import type { CreatorList, OfferStatus, PartnerOffer } from "../types/studio";
import { formatNumber } from "../utils/format";
import { IconPlus } from "./icons";

type StudioListsProps = {
  lists: CreatorList[];
};

export function StudioLists({ lists }: StudioListsProps) {
  return (
    <div className="studio-panel">
      <div className="studio-block__head">
        <h2 className="studio-block__title">Tes listes</h2>
        <button type="button" className="btn btn--ghost btn--small">
          <IconPlus size={14} />
          Créer une liste
        </button>
      </div>

      {lists.length === 0 ? (
        <p className="studio-empty">
          Tu n'as pas encore créé de liste. C'est le meilleur moyen de faire découvrir
          ce que tu aimes.
        </p>
      ) : (
        <ul className="listgrid">
          {lists.map((list) => (
            <li className="listcard" key={list.id}>
              <h3 className="listcard__title">{list.title}</h3>
              <p className="listcard__meta">
                {formatNumber(list.item_count)} titres
                <span className="listcard__sep" aria-hidden="true" />
                {list.is_public ? `${formatNumber(list.views)} vues` : "non publiée"}
              </p>
              <span
                className={
                  list.is_public ? "tag" : "tag tag--muted"
                }
              >
                {list.is_public ? "Publique" : "Privée"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
    </div>
  );
}
