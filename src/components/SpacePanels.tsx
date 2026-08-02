import { Link } from "react-router-dom";
import type { Progression } from "../types/community";
import { COINS, HOROSCOPE_TODAY, PROGRESSION, QUESTS } from "../data/community";
import { CONTINUE_RAIL } from "../data/titles";
import { formatNumber } from "../utils/format";
import { HoroscopeBand, QuestsGrid } from "./Community";
import { Rail } from "./Rail";
import { IconCoin, IconStar } from "./icons";

/* ---------------------------------------------------------------- pour moi */

/**
 * Onglet d'atterrissage de « Mon espace ».
 * Réunit ce qui était éparpillé sur l'accueil : l'horoscope du jour, la reprise
 * de visionnage et un résumé de progression.
 */
export function SpaceForMe() {
  return (
    <div className="studio-panel space-forme">
      <HoroscopeBand horoscope={HOROSCOPE_TODAY} />
      <ProgressionSummary progression={PROGRESSION} compact />
      <Rail rail={CONTINUE_RAIL} />
    </div>
  );
}

/* ----------------------------------------------------------------- quêtes */

/** Toute la gamification : paliers, expérience, pièces et quêtes du moment. */
export function SpaceQuests() {
  return (
    <div className="studio-panel">
      <ProgressionSummary progression={PROGRESSION} />
      <QuestsGrid quests={QUESTS} />
    </div>
  );
}

/* ------------------------------------------------------------ progression */

type ProgressionSummaryProps = {
  progression: Progression;
  /** Version resserrée, pour l'onglet « Pour moi ». */
  compact?: boolean;
};

function ProgressionSummary({ progression, compact = false }: ProgressionSummaryProps) {
  const ratio = Math.min(
    Math.round((progression.xp / progression.next_level_xp) * 100),
    100,
  );
  const missing = Math.max(progression.next_level_xp - progression.xp, 0);

  return (
    <section className="shell progression" aria-labelledby="progression-title">
      <div className="progression__head">
        <p className="progression__label">Niveau {progression.level}</p>
        <h2 className="progression__title" id="progression-title">
          {progression.level_label}
        </h2>
      </div>

      <div
        className="progression__track"
        role="progressbar"
        aria-valuenow={ratio}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression vers le niveau ${progression.level + 1}`}
      >
        <div className="progression__bar" style={{ width: `${ratio}%` }} />
      </div>

      <p className="progression__legend">
        {formatNumber(progression.xp)} XP sur {formatNumber(progression.next_level_xp)}
        <span className="progression__sep" aria-hidden="true" />
        encore {formatNumber(missing)} XP avant le niveau {progression.level + 1}
      </p>

      {!compact && (
        <ul className="progression__stats">
          <li>
            <IconStar size={13} />
            <strong>{formatNumber(progression.titles_watched)}</strong> titres terminés
          </li>
          <li>
            <IconCoin size={13} />
            <strong>{formatNumber(COINS)}</strong> pièces
          </li>
        </ul>
      )}
    </section>
  );
}

/* --------------------------------------------------------- devenir créateur */

/** Point d'entrée informatif pour un membre qui n'est pas encore créateur. */
export function BecomeCreatorCard() {
  return (
    <section className="shell become">
      <h2 className="become__title">Devenir créateur</h2>
      <p className="become__text">
        Un compte créateur ouvre trois onglets de plus : les statistiques de ton
        audience, la gestion de ta page publique et tes offres de partenariat. Il
        s'ouvre dès que tu publies régulièrement des listes ou des critiques.
      </p>
      <p className="become__note">
        Nous n'avons pas encore branché la demande : cette page arrive avec les
        premiers passages en créateur.
      </p>
      <Link className="btn btn--ghost btn--small" to="/">
        Découvrir le catalogue
      </Link>
    </section>
  );
}
