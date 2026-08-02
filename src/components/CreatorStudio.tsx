import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CreatorPlan, CreatorProfile } from "../types/studio";
import { CREATOR_STATS, PARTNER_OFFERS } from "../data/studio";
import { BRAND } from "../config/brand";
import { useAuth } from "../context/auth-context";
import { formatMonthYear } from "../utils/format";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Spinner } from "./StateMessage";
import { StudioLinks } from "./StudioLinks";
import { StudioLists, StudioOffers } from "./StudioLists";
import { StudioOverview } from "./StudioOverview";
import { IconCopy, IconExternal, IconVerified } from "./icons";

const TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "links", label: "Ma page publique" },
  { id: "lists", label: "Mes listes" },
  { id: "offers", label: "Partenariats" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PLAN_LABELS: Record<CreatorPlan, string> = {
  free: "Gratuit",
  pro: "Pro",
  cine_plus: "Ciné+",
};

export function CreatorStudio() {
  useDocumentTitle("Studio");

  const { status, profile } = useAuth();

  if (status === "unconfigured") {
    return (
      <Gate title="Studio hors ligne">
        La base n'est pas encore reliée à cette installation, donc ton studio n'a rien
        à afficher. Renseigne les variables d'environnement Supabase, puis relance le
        serveur.
      </Gate>
    );
  }

  if (status === "signed-out") {
    return (
      <Gate title="Connecte-toi" action={{ to: "/connexion", label: "Se connecter" }}>
        Le studio est ton espace privé : tes statistiques, ta page publique et tes
        partenariats. Il te faut un compte pour l'ouvrir.
      </Gate>
    );
  }

  if (status === "loading" || !profile) {
    return (
      <main className="shell studio">
        <Spinner label="Nous ouvrons ton studio" />
      </main>
    );
  }

  if (!profile.is_creator) return <BecomeCreator />;

  return (
    <main className="shell studio">
      <StudioHeader creator={profile} />
      <StudioTabs creator={profile} />
    </main>
  );
}

/* ---------------------------------------------------------------- en-tête */

type StudioHeaderProps = {
  creator: CreatorProfile;
};

function StudioHeader({ creator }: StudioHeaderProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${BRAND.public_domain}/@${creator.link_in_bio_slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le presse-papier peut être refusé. On ne bloque pas pour autant.
      setCopied(false);
    }
  }

  return (
    <header className="studio-head">
      <div className="studio-head__identity">
        <span className="studio-head__avatar" aria-hidden="true">
          {creator.initials}
        </span>

        <div className="studio-head__who">
          <h1 className="studio-head__name">
            {creator.display_name}
            {creator.verified && (
              <span className="studio-head__verified" title="Compte vérifié">
                <IconVerified />
                <span className="sr-only">Compte vérifié</span>
              </span>
            )}
            <span className={`plan plan--${creator.plan}`}>{PLAN_LABELS[creator.plan]}</span>
          </h1>
          <p className="studio-head__meta">
            {creator.handle}
            <span className="studio-head__sep" aria-hidden="true" />
            créateur depuis {formatMonthYear(creator.member_since)}
          </p>
        </div>
      </div>

      <div className="studio-head__link">
        <p className="studio-head__url">
          <span className="studio-head__url-label">Ta page publique</span>
          <span className="studio-head__url-value">{publicUrl}</span>
        </p>

        <div className="studio-head__actions">
          {/* La vitrine publique arrive au lot suivant, d'où le bouton inerte. */}
          <button type="button" className="btn btn--ghost btn--small">
            <IconExternal />
            Voir ma page publique
          </button>
          <button type="button" className="btn btn--ghost btn--small" onClick={copy}>
            <IconCopy />
            {copied ? "Lien copié" : "Copier le lien"}
          </button>
        </div>
      </div>

      {creator.plan === "free" && (
        <p className="upsell">
          Passe à <strong>Ciné+</strong> pour débloquer les statistiques avancées et la
          page créateur enrichie. Tes liens et tes listes restent gratuits, quoi qu'il
          arrive.
        </p>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- onglets */

function StudioTabs({ creator }: { creator: CreatorProfile }) {
  const [active, setActive] = useState<TabId>("overview");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /** Flèches, Origine et Fin déplacent la sélection, comme attendu d'un onglet. */
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    let next = index;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setActive(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Sections du studio">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            className="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} tabIndex={0}>
        {active === "overview" && <StudioOverview stats={CREATOR_STATS} />}
        {active === "links" && <StudioLinks creator={creator} />}
        {active === "lists" && <StudioLists creator={creator} />}
        {active === "offers" && <StudioOffers offers={PARTNER_OFFERS} />}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ écrans d'accès */

type GateProps = {
  title: string;
  children: React.ReactNode;
  action?: { to: string; label: string };
};

/** Écran plein pour un accès refusé ou impossible. On explique, on ne rejette pas. */
function Gate({ title, children, action }: GateProps) {
  return (
    <main className="shell empty">
      <h1 className="empty__title">{title}</h1>
      <p className="empty__body">{children}</p>
      {action ? (
        <Link className="btn btn--primary" to={action.to}>
          {action.label}
        </Link>
      ) : (
        <Link className="btn btn--ghost" to="/">
          Retour à l'accueil
        </Link>
      )}
    </main>
  );
}

/** Le studio est réservé aux créateurs. */
function BecomeCreator() {
  return (
    <Gate title="Deviens créateur">
      Le studio réunit tes statistiques, ta page publique et tes partenariats. Il
      s'ouvre dès que tu publies ta première liste ou ta première critique.
    </Gate>
  );
}
