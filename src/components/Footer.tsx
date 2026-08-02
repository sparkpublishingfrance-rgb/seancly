import { Link } from "react-router-dom";
import { BRAND, NAV_ITEMS, SOCIAL_LINKS, TMDB_ATTRIBUTION } from "../config/brand";
import { useAuth } from "../context/auth-context";

/** Année d'exploitation, figée à l'ouverture de la page. */
const YEAR = new Date().getFullYear();

const LEGAL_LINKS = [
  { label: "Mentions légales", to: "/mentions-legales" },
  { label: "Conditions générales", to: "/cgu" },
  { label: "Politique de confidentialité", to: "/confidentialite" },
  { label: "Gestion des cookies", to: "/cookies" },
];

export function Footer() {
  const { status } = useAuth();
  const signedIn = status === "signed-in";

  return (
    <footer className="foot">
      <div className="shell foot__grid">
        <div className="foot__brandcol">
          <p className="foot__brand">{BRAND.name}</p>
          <p className="foot__tagline">{BRAND.tagline}</p>

          <ul className="foot__social">
            {SOCIAL_LINKS.map((social) =>
              social.href ? (
                <li key={social.label}>
                  <a
                    className="foot__link"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.label}
                  </a>
                </li>
              ) : (
                // Pas de lien mort : tant que le compte n'existe pas, le nom
                // reste du texte.
                <li key={social.label}>
                  <span className="foot__soon" title="Compte à ouvrir">
                    {social.label}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>

        <nav className="foot__col" aria-labelledby="foot-produit">
          <h2 className="foot__title" id="foot-produit">
            Produit
          </h2>
          <ul className="foot__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link className="foot__link" to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="foot__soon">{item.label}</span>
                )}
              </li>
            ))}
            <li>
              <Link className="foot__link" to="/tarifs">
                Tarifs
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="foot__col" aria-labelledby="foot-compte">
          <h2 className="foot__title" id="foot-compte">
            Compte
          </h2>
          <ul className="foot__list">
            {signedIn ? (
              <li>
                <Link className="foot__link" to="/mon-espace">
                  Mon espace
                </Link>
              </li>
            ) : (
              <li>
                <Link className="foot__link" to="/connexion">
                  Se connecter
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <nav className="foot__col" aria-labelledby="foot-legal">
          <h2 className="foot__title" id="foot-legal">
            Légal
          </h2>
          <ul className="foot__list">
            {LEGAL_LINKS.map((item) => (
              <li key={item.to}>
                <Link className="foot__link" to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="shell foot__bottom">
        {/* Emplacement de l'attribution TMDB. Le logo viendra se placer ici en
            même temps que les vraies fiches. */}
        <p className="foot__tmdb">
          <span className="foot__tmdb-logo" aria-hidden="true" />
          {TMDB_ATTRIBUTION}
        </p>

        <ul className="foot__notices">
          <li>{BRAND.notices.posters}</li>
          <li>{BRAND.notices.inpi}</li>
        </ul>

        <p className="foot__copy">
          © {YEAR} {BRAND.name}, édité par Spark Publishing.
        </p>
      </div>
    </footer>
  );
}
