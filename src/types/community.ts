/**
 * Types de la couche communautaire (horoscope, guildes, quêtes, profils).
 *
 * Volontairement séparés de `tmdb.ts` : les conditions d'utilisation de TMDB
 * interdisent d'adosser une application de recommandation par IA à leur contenu.
 * Ces données devront donc venir d'une source distincte (Wikidata, MovieLens,
 * profil de goût maison). On garde la frontière visible dès maintenant.
 */

export interface Profile {
  handle: string;
  display_name: string;
  initials: string;
  verified?: boolean;
  /** Ouvre l'accès au studio. Viendra du rôle porté par la session. */
  is_creator?: boolean;
}

export interface Guild {
  id: number;
  name: string;
  emoji: string;
  members: number;
  /** Titre en cours de visionnage groupé. */
  now_watching?: string;
  /** Séance en direct maintenant. */
  live?: boolean;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  xp: number;
  /** Avancement de 0 à 100. */
  progress: number;
  /** Avancement lisible, par exemple "7 / 10 films". */
  progress_label: string;
  /** Quête remise à zéro chaque jour. */
  daily?: boolean;
}

export interface HoroscopeDay {
  sign_emoji: string;
  sign_name: string;
  headline: string;
  body: string;
  /** Trois suggestions du jour, en texte libre. */
  picks: string[];
}

/** Progression du membre : niveau, expérience et paliers. */
export interface Progression {
  xp: number;
  level: number;
  /** Nom du palier courant, par exemple « Habitué du dernier rang ». */
  level_label: string;
  /** Expérience à atteindre pour le palier suivant. */
  next_level_xp: number;
  /** Titres terminés depuis le début. */
  titles_watched: number;
}
