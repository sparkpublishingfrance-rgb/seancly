import { Link } from "react-router-dom";
import { BRAND } from "../config/brand";
import type { RulesBlock } from "../data/rules";
import { RULES_INTRO, RULES_SECTIONS, RULES_UPDATED_AT } from "../data/rules";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const RELATED = [
  { label: "Conditions générales d'utilisation", to: "/cgu" },
  { label: "Politique de confidentialité", to: "/confidentialite" },
  { label: "Politique de droit d'auteur", to: "/droit-auteur" },
  { label: "Mentions légales", to: "/mentions-legales" },
];

const UPDATED_LABEL = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  // Sans l'heure, la chaîne est lue en UTC et recule d'un jour à l'ouest de
  // Greenwich : la date d'une mise à jour ne doit dépendre de personne.
}).format(new Date(`${RULES_UPDATED_AT}T12:00:00`));

/**
 * Règles de la communauté.
 *
 * Contrairement aux pages légales, le texte est écrit et publié tel quel : pas
 * de bandeau « en cours de rédaction » ici.
 */
export function Rules() {
  useDocumentTitle("Règles de la communauté");

  return (
    <main className="shell legal rules">
      <h1 className="legal__title">Règles de la communauté</h1>
      <p className="rules__updated">Dernière mise à jour : {UPDATED_LABEL}</p>
      <p className="legal__intro">{RULES_INTRO}</p>

      {RULES_SECTIONS.map((section) => (
        <section className="rules__section" key={section.title}>
          <h2 className="rules__heading">{section.title}</h2>
          {section.blocks.map((block, index) => (
            <Block block={block} key={index} />
          ))}
        </section>
      ))}

      <section className="rules__section">
        <h2 className="rules__heading">Nous écrire</h2>
        <p className="rules__text">
          Pour un signalement, une contestation de modération ou toute question
          sur ces règles :{" "}
          <a className="rules__mail" href={`mailto:${BRAND.contact_email}`}>
            {BRAND.contact_email}
          </a>
        </p>
      </section>

      <div className="rules__related">
        <p className="rules__editor">
          {BRAND.name} est édité par {BRAND.publisher}.
        </p>
        <ul className="rules__links">
          {RELATED.map((item) => (
            <li key={item.to}>
              <Link className="rules__link" to={item.to}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link className="btn btn--ghost" to="/">
        Retour à l'accueil
      </Link>
    </main>
  );
}

function Block({ block }: { block: RulesBlock }) {
  if (block.type === "paragraph") {
    return <p className="rules__text">{block.text}</p>;
  }

  if (block.type === "lead") {
    return (
      <p className="rules__text">
        <strong className="rules__lead">{block.lead}</strong> {block.text}
      </p>
    );
  }

  return (
    <ul className="rules__list">
      {block.items.map((item) => (
        <li key={item.text}>
          {item.lead && <strong className="rules__lead">{item.lead}</strong>}
          {item.lead ? ` : ${item.text}` : item.text}
        </li>
      ))}
    </ul>
  );
}
