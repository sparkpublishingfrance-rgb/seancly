import type { Rail, TmdbTitle } from "../types/tmdb";

/**
 * Jeu de données factice, au format TMDB.
 * `poster_path` vaut `null` partout : on rend un placeholder en dégradé à partir
 * de `app.spine_color`. Les titres sont inventés.
 */
export const TITLES: TmdbTitle[] = [
  {
    id: 101,
    media_type: "movie",
    title: "La Nuit Écarlate",
    overview:
      "Une nuit d'hiver, une commissaire rappelée d'office suit la trace d'un tueur qui signe ses crimes à la craie rouge. Plus elle avance, moins la ville lui semble étrangère.",
    release_date: "2024-11-06",
    vote_average: 8.4,
    runtime: 128,
    genres: [
      { id: 53, name: "Thriller" },
      { id: 80, name: "Policier" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: {
      spine_color: "#C0386A",
      recommended_by: ["@cinéphage", "@salleobscure", "@vhsclub", "@nuitblanche"],
    },
  },
  {
    id: 102,
    media_type: "movie",
    title: "Sang Froid",
    overview:
      "Un chirurgien réputé accepte d'opérer un patient qu'il aurait dû refuser. Le lendemain, sa vie entière tient dans un dossier qu'il n'a pas le droit d'ouvrir.",
    release_date: "2023-03-15",
    vote_average: 7.6,
    runtime: 112,
    genres: [
      { id: 53, name: "Thriller" },
      { id: 18, name: "Drame" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#3E5C76" },
  },
  {
    id: 103,
    media_type: "tv",
    title: "Néon Sombre",
    overview:
      "Dans un port du Nord noyé sous la pluie, une brigade de nuit démêle une affaire de disparitions que personne ne veut voir résolue.",
    release_date: "2022-09-01",
    vote_average: 8.1,
    genres: [
      { id: 80, name: "Policier" },
      { id: 9648, name: "Mystère" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#7B4BC9", progress: 62 },
  },
  {
    id: 104,
    media_type: "movie",
    title: "Rue des Ombres",
    overview:
      "Un huissier découvre que tous les appartements d'un même immeuble appartiennent à un mort. Il décide de sonner à chaque porte.",
    release_date: "2021-05-19",
    vote_average: 7.2,
    runtime: 104,
    genres: [
      { id: 9648, name: "Mystère" },
      { id: 53, name: "Thriller" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#8C6239" },
  },
  {
    id: 105,
    media_type: "tv",
    title: "Éclipse",
    overview:
      "Une famille se réunit dans une maison de bord de mer pour observer une éclipse. À la nuit tombée, il manque quelqu'un et personne ne s'en étonne.",
    release_date: "2024-01-24",
    vote_average: 7.9,
    genres: [
      { id: 18, name: "Drame" },
      { id: 9648, name: "Mystère" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#2F6F62", progress: 28 },
  },
  {
    id: 106,
    media_type: "movie",
    title: "Marée Basse",
    overview:
      "Deux frères pêcheurs remontent dans leurs filets de quoi changer leur vie, à condition de ne jamais en parler. L'un des deux parle.",
    release_date: "2020-08-12",
    vote_average: 7.4,
    runtime: 119,
    genres: [
      { id: 18, name: "Drame" },
      { id: 80, name: "Policier" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#25617A" },
  },
  {
    id: 107,
    media_type: "movie",
    title: "Cendres",
    overview:
      "Après l'incendie d'un théâtre, une costumière reconstitue la dernière soirée à partir des vêtements retrouvés. Sa reconstitution ne colle pas avec l'enquête.",
    release_date: "2023-10-04",
    vote_average: 8.0,
    runtime: 97,
    genres: [
      { id: 18, name: "Drame" },
      { id: 9648, name: "Mystère" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#9C3B2E" },
  },
  {
    id: 108,
    media_type: "tv",
    title: "Vertige",
    overview:
      "Une architecte engagée sur la tour la plus haute du pays comprend que les plans qu'elle signe ne sont pas ceux qui sont construits.",
    release_date: "2025-02-05",
    vote_average: 7.7,
    genres: [
      { id: 53, name: "Thriller" },
      { id: 18, name: "Drame" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#4A4E9B", progress: 85 },
  },
  {
    id: 109,
    media_type: "movie",
    title: "Silhouette",
    overview:
      "Un portraitiste de nuit dessine les passants sans jamais leur parler. Un visage revient trois soirs de suite, toujours au même endroit.",
    release_date: "2022-04-27",
    vote_average: 7.1,
    runtime: 88,
    genres: [
      { id: 9648, name: "Mystère" },
      { id: 18, name: "Drame" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#6E6E7D" },
  },
  {
    id: 110,
    media_type: "movie",
    title: "Faux-Semblants",
    overview:
      "Un couple d'escrocs monte une dernière affaire dans une station thermale hors saison. Chacun a prévu de partir seul.",
    release_date: "2021-11-17",
    vote_average: 7.5,
    runtime: 108,
    genres: [
      { id: 80, name: "Policier" },
      { id: 53, name: "Thriller" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#B08447" },
  },
  {
    id: 111,
    media_type: "tv",
    title: "Terminus Nord",
    overview:
      "Le dernier train d'une ligne condamnée transporte chaque nuit les mêmes six passagers. La septième nuit, ils sont sept.",
    release_date: "2024-06-12",
    vote_average: 8.3,
    genres: [
      { id: 9648, name: "Mystère" },
      { id: 53, name: "Thriller" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#1F5D52", progress: 45 },
  },
  {
    id: 112,
    media_type: "movie",
    title: "Les Reflets",
    overview:
      "Une restauratrice de miroirs anciens travaille sur une commande qui lui renvoie une pièce dans laquelle elle n'est jamais entrée.",
    release_date: "2025-09-10",
    vote_average: 7.8,
    runtime: 116,
    genres: [
      { id: 27, name: "Épouvante" },
      { id: 9648, name: "Mystère" },
    ],
    poster_path: null,
    backdrop_path: null,
    app: { spine_color: "#5A3E7A" },
  },
];

/** Titre mis en avant dans le hero. */
export const FEATURED: TmdbTitle = TITLES[0];

/** Les trois rangées de l'accueil. */
export const RAILS: Rail[] = [
  {
    title: "Repris par les créateurs que tu suis",
    by: "via @cinéphage, @salleobscure",
    ids: [107, 101, 110, 104, 109, 112, 102],
  },
  {
    title: "Reprendre ta série",
    ids: [103, 108, 111, 105],
  },
  {
    title: "Trouvé pour toi",
    by: "Matchbook · d'après tes goûts",
    ids: [112, 106, 105, 111, 103, 108],
  },
];

/** Retrouve un titre par identifiant. Renvoie `undefined` si l'identifiant est inconnu. */
export function titleById(id: number): TmdbTitle | undefined {
  return TITLES.find((title) => title.id === id);
}

/** Extrait l'année de `release_date` ("2024-11-06" donne "2024"). */
export function yearOf(title: TmdbTitle): string {
  return title.release_date.slice(0, 4);
}
