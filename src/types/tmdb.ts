/**
 * Types calqués sur les champs réels de l'API TMDB.
 * Objectif : quand on branchera le vrai client, les composants ne bougent pas.
 * Tout champ propre à l'application vit dans le sous-objet `app`, jamais à la
 * racine, pour rester superposable à une réponse TMDB brute.
 */

export type MediaType = "movie" | "tv";

export interface TmdbGenre {
  id: number;
  name: string;
}

/** Champs maison, absents de TMDB. Alimentés par notre propre couche de données. */
export interface TitleAppMeta {
  /** Couleur dominante de la tranche, sert de base au placeholder d'affiche. */
  spine_color?: string;
  /** Avancement de visionnage, de 0 à 100. */
  progress?: number;
  /** Pseudos des créateurs qui ont repris le titre. */
  recommended_by?: string[];
}

export interface TmdbTitle {
  id: number;
  media_type: MediaType;
  /** TMDB expose `title` pour les films et `name` pour les séries. On normalise. */
  title: string;
  overview: string;
  /** Format "YYYY-MM-DD". */
  release_date: string;
  /** Note sur 10. */
  vote_average: number;
  /** Durée en minutes. Absente pour la plupart des séries. */
  runtime?: number;
  genres: TmdbGenre[];
  /**
   * Chemin relatif TMDB, `null` en mock.
   * En production : `https://image.tmdb.org/t/p/w500${poster_path}`.
   */
  poster_path: string | null;
  backdrop_path: string | null;
  app?: TitleAppMeta;
}

/** Une rangée de l'accueil. Les titres sont référencés par identifiant. */
export interface Rail {
  title: string;
  /** Sous-titre optionnel, sert à créditer la source de la reco. */
  by?: string;
  ids: number[];
}
