import { Link } from "react-router-dom";
import type { LegalPage as LegalPageData } from "../data/legal";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type LegalPageProps = {
  page: LegalPageData;
};

/**
 * Gabarit d'une page légale.
 * Le plan est là, le texte reste à écrire avec un juriste : nous n'affichons
 * pas de clauses que personne n'a validées.
 */
export function LegalPage({ page }: LegalPageProps) {
  useDocumentTitle(page.title);

  return (
    <main className="shell legal">
      <h1 className="legal__title">{page.title}</h1>
      <p className="legal__intro">{page.intro}</p>

      <div className="legal__draft">
        <p className="legal__draft-label">Page en cours de rédaction</p>
        <p className="legal__draft-text">
          Voici ce qu'elle couvrira. Nous préférons une page vide et honnête à un
          texte recopié qui n'engagerait personne.
        </p>
        <ul className="legal__outline">
          {page.outline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <Link className="btn btn--ghost" to="/">
        Retour à l'accueil
      </Link>
    </main>
  );
}
