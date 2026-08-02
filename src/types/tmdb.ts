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

export interface CastMember {
  id: number;
  name: string;
  character: string;
  /** Chemin relatif TMDB, `null` en mock. */
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  /** Poste tel que TMDB le nomme : "Director", "Screenplay"... */
  job: string;
}

/** Bloc `credits` de TMDB, obtenu via `append_to_response=credits`. */
export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

/** Mode de mise à disposition, aligné sur le vocabulaire TMDB et Watchmode. */
export type WatchProviderType = "flatrate" | "rent" | "buy";

export interface WatchProvider {
  name: string;
  type: WatchProviderType;
}

/** Note d'un membre suivi. Même échelle que `vote_average`, sur 10. */
export interface FriendRating {
  handle: string;
  initials: string;
  rating: number;
}

/** Champs maison, absents de TMDB. Alimentés par notre propre couche de données. */
export interface TitleAppMeta {
  /** Couleur dominante de la tranche, sert de base au placeholder d'affiche. */
  spine_color?: string;
  /** Avancement de visionnage, de 0 à 100. */
  progress?: number;
  /** Pseudos des créateurs qui ont repris le titre. */
  recommended_by?: string[];
  /** Avertissements de contenu, masqués par défaut et dépliables. */
  trigger_warnings?: string[];
  /** Où regarder le titre. Viendra de Watchmode, pas de TMDB. */
  watch_providers?: WatchProvider[];
  /** Notes des membres suivis. Couche sociale, source maison. */
  friends_ratings?: FriendRating[];
}

export interface TmdbTitle {
  id: number;
  media_type: MediaType;
  /** TMDB expose `title` pour les films et `name` pour les séries. On normalise. */
  title: string;
  overview: string;
  /** Accroche courte affichée sous le titre sur la fiche. */
  tagline?: string;
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
  /** Renseigné par `append_to_response=credits`, donc absent des listes. */
  credits?: Credits;
  app?: TitleAppMeta;
}

/** Une rangée de l'accueil. Les titres sont référencés par identifiant. */
export interface Rail {
  title: string;
  /** Sous-titre optionnel, sert à créditer la source de la reco. */
  by?: string;
  ids: number[];
  /**
   * Affiche l'avancement de visionnage sur les affiches.
   * Réservé aux rangées personnelles : l'accueil n'expose aucune donnée de compte.
   */
  show_progress?: boolean;
}
