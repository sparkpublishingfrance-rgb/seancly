/**
 * Tailles d'images TMDB, par usage.
 * En mock, tous les chemins valent `null` et l'application rend un placeholder
 * en dégradé. Ces bases servent le jour où le client TMDB alimente les chemins.
 */
export const TMDB_IMAGE_BASE = {
  poster: "https://image.tmdb.org/t/p/w500",
  backdrop: "https://image.tmdb.org/t/p/w1280",
  profile: "https://image.tmdb.org/t/p/w185",
} as const;
