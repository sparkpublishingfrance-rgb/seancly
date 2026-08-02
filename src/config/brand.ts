/**
 * Point unique de vérité pour le nom de la marque.
 * Le nom est provisoire et reste à valider auprès de l'INPI : on le change ici,
 * nulle part ailleurs.
 */
export const BRAND = {
  /** Nom complet, utilisé pour les textes et le titre du document. */
  name: "Séquence",
  /**
   * Logo découpé en trois morceaux pour colorer la lettre accentuée en or.
   * start + accent + end doit toujours reformer `name`.
   */
  logo: {
    start: "S",
    accent: "é",
    end: "quence",
  },
  tagline: "Le cinéma, mais avec du monde autour.",
  /** Domaine des pages publiques de créateur. Provisoire, comme le nom. */
  public_domain: "sequence.app",
  /** Mentions à afficher tant que la marque et les sources ne sont pas arrêtées. */
  notices: {
    inpi: "Nom provisoire, à valider INPI.",
    posters: "Les affiches sont des placeholders générés, aucune image distante.",
    tmdb: "Les fiches viendront de TMDB. Attribution et logo à ajouter ici.",
  },
} as const;

/** Libellés de navigation principale. */
export const NAV_ITEMS = [
  "Accueil",
  "Films",
  "Séries",
  "Guildes",
  "Ma collection",
] as const;
