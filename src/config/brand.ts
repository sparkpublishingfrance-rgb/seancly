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
  },
} as const;

/**
 * Navigation principale : découverte uniquement, catalogue et social public.
 * Tout ce qui appartient au membre passe par le menu de l'avatar, pas par ici.
 * `to` vaut `null` tant que l'écran n'existe pas.
 */
export const NAV_ITEMS: {
  label: string;
  to: string | null;
  /** Masquée tant que personne n'est connecté. */
  requiresAuth?: boolean;
}[] = [
  { label: "Accueil", to: "/" },
  { label: "Actualité", to: "/actualite", requiresAuth: true },
  { label: "Films", to: null },
  { label: "Séries", to: null },
  { label: "Guildes", to: null },
];

/** Réseaux du pied de page. Les comptes ne sont pas encore ouverts. */
export const SOCIAL_LINKS: { label: string; href: string | null }[] = [
  { label: "Instagram", href: null },
  { label: "TikTok", href: null },
  { label: "YouTube", href: null },
];

/**
 * Mention exigée par TMDB dès que leurs données sont affichées.
 * Le texte est imposé en anglais, on ne le traduit pas.
 */
export const TMDB_ATTRIBUTION =
  "This product uses the TMDB API but is not endorsed or certified by TMDB.";
