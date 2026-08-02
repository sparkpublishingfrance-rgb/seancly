/**
 * Types de l'espace privé du créateur.
 *
 * Rien ici ne vient de TMDB : ce sont nos données de compte, d'audience et de
 * monétisation. Elles vivront dans notre propre base, d'où un fichier distinct
 * de `tmdb.ts`.
 */

/** Formule d'abonnement. `cine_plus` est le palier premium, signé par l'or. */
export type CreatorPlan = "free" | "pro" | "cine_plus";

/**
 * Profil du compte connecté, tel que l'application le manipule.
 * Construit à partir de `public.profiles` par `src/api/profiles.ts`.
 */
export interface CreatorProfile {
  id: string;
  /** Avec l'arobase, contrairement à la colonne `handle` de la base. */
  handle: string;
  display_name: string;
  initials: string;
  verified: boolean;
  is_creator: boolean;
  /** Accès à la file de modération. */
  is_admin: boolean;
  /** Date d'arrivée, format "YYYY-MM-DD". */
  member_since: string;
  plan: CreatorPlan;
  bio: string;
  /** Teinte du dégradé d'avatar, à défaut de photo. */
  avatar_color: string;
  /** Fragment d'URL de la page publique, sans le arobase. */
  link_in_bio_slug: string;
}

/** Agrégats affichés en cartes dans l'onglet Vue d'ensemble. */
export interface CreatorStats {
  followers: number;
  /** Variation d'abonnés sur 30 jours, négative si baisse. */
  followers_delta_30d: number;
  profile_views_30d: number;
  link_clicks_30d: number;
  /** Note moyenne que le créateur attribue, sur 10. */
  avg_rating_given: number;
  reviews_count: number;
  lists_count: number;
}

export interface StatPoint {
  label: string;
  value: number;
}

/** Série temporelle prête à tracer. */
export interface StatSeries {
  id: string;
  title: string;
  /** Unité au pluriel, utilisée dans les résumés textuels. */
  unit: string;
  points: StatPoint[];
}

export interface CreatorList {
  id: string;
  title: string;
  item_count: number;
  /** Absent tant qu'il n'y a pas de table d'audience. */
  views?: number;
  is_public: boolean;
}

export interface LinkInBioItem {
  id: string;
  label: string;
  url: string;
  clicks: number;
  enabled: boolean;
}

export type OfferStatus = "brouillon" | "en_ligne" | "clos";

export interface PartnerOffer {
  id: number;
  title: string;
  status: OfferStatus;
  /** Demandes reçues de la part de marques ou de distributeurs. */
  requests: number;
}
