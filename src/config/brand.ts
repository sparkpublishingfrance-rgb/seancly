/**
 * Point unique de vérité pour le nom de la marque.
 * La recherche d'antériorité INPI reste à faire avant tout dépôt : on change le
 * nom ici, nulle part ailleurs.
 */
export const BRAND = {
  /** Nom complet, utilisé pour les textes et le titre du document. */
  name: "Seancly",
  /**
   * Logo découpé en trois morceaux pour colorer une lettre en or.
   * start + accent + end doit toujours reformer `name`.
   */
  logo: {
    start: "S",
    accent: "e",
    end: "ancly",
  },
  tagline: "Le cinéma, mais avec du monde autour.",
  /** Domaine des pages publiques de créateur. */
  public_domain: "seancly.app",
  /** Mentions à afficher tant que la marque et les sources ne sont pas arrêtées. */
  notices: {
    inpi: "Marque en cours de dépôt, recherche d'antériorité INPI à faire (classes 9, 41, 42).",
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
