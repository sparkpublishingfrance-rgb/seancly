import type {
  CreatorList,
  CreatorProfile,
  CreatorStats,
  LinkInBioItem,
  PartnerOffer,
  StatSeries,
} from "../types/studio";

/**
 * Le créateur connecté. Viendra de la session Supabase le jour venu ; ici c'est
 * une constante, et l'application ne doit lire l'identité que par ce point.
 */
export const CURRENT_CREATOR: CreatorProfile = {
  handle: "@alexis",
  display_name: "Alexis Duval",
  initials: "AD",
  verified: true,
  member_since: "2023-04-18",
  plan: "cine_plus",
  bio: "Je parle de polars français, de huis clos et de tout ce qui se passe après minuit. Une critique par jour, une liste par semaine.",
  link_in_bio_slug: "alexis-cine",
};

export const CREATOR_STATS: CreatorStats = {
  followers: 12480,
  followers_delta_30d: 318,
  profile_views_30d: 27270,
  link_clicks_30d: 3742,
  avg_rating_given: 7.4,
  reviews_count: 168,
  lists_count: 5,
};

/** Vues du profil, un point par jour sur les 30 derniers jours. */
const PROFILE_VIEWS_VALUES = [
  620, 585, 640, 910, 980, 705, 660, 690, 720, 1040, 1120, 760, 700, 735, 780, 1180, 1240,
  820, 760, 790, 830, 1290, 1360, 880, 830, 865, 910, 1420, 1490, 960,
];

export const PROFILE_VIEWS_SERIES: StatSeries = {
  id: "profile-views",
  title: "Vues du profil",
  unit: "vues",
  points: PROFILE_VIEWS_VALUES.map((value, index) => ({
    label: index === PROFILE_VIEWS_VALUES.length - 1 ? "aujourd'hui" : `J-${29 - index}`,
    value,
  })),
};

/** Nouveaux abonnés, un point par semaine sur cinq semaines. */
export const FOLLOWERS_SERIES: StatSeries = {
  id: "followers",
  title: "Nouveaux abonnés",
  unit: "abonnés",
  points: [
    { label: "S-4", value: 58 },
    { label: "S-3", value: 71 },
    { label: "S-2", value: 64 },
    { label: "S-1", value: 82 },
    { label: "Cette semaine", value: 43 },
  ],
};

/** Clics sur les liens, un point par jour sur deux semaines. Sert d'esquisse. */
const LINK_CLICKS_VALUES = [96, 110, 88, 132, 145, 101, 94, 120, 138, 150, 112, 105, 160, 171];

export const LINK_CLICKS_SERIES: StatSeries = {
  id: "link-clicks",
  title: "Clics sur les liens",
  unit: "clics",
  points: LINK_CLICKS_VALUES.map((value, index) => ({
    label: index === LINK_CLICKS_VALUES.length - 1 ? "aujourd'hui" : `J-${13 - index}`,
    value,
  })),
};

/** Fait marquant du mois, mis en avant sous les cartes de statistiques. */
export const CREATOR_HIGHLIGHT =
  "Ta liste « Huis clos parfaits » vient de dépasser 3 000 vues.";

export const LINK_IN_BIO: LinkInBioItem[] = [
  {
    id: 1,
    label: "Ma chaîne YouTube",
    url: "https://youtube.com/@alexiscine",
    clicks: 1204,
    enabled: true,
  },
  {
    id: 2,
    label: "Instagram",
    url: "https://instagram.com/alexis.cine",
    clicks: 862,
    enabled: true,
  },
  {
    id: 3,
    label: "La Séance du dimanche, ma newsletter",
    url: "https://laseance.substack.com",
    clicks: 496,
    enabled: true,
  },
  {
    id: 4,
    label: "Affiches sérigraphiées",
    url: "https://boutique.alexiscine.fr",
    clicks: 415,
    enabled: false,
  },
  {
    id: 5,
    label: "Soutenir mon travail",
    url: "https://patreon.com/alexiscine",
    clicks: 331,
    enabled: true,
  },
];

/** Propositions du bouton « Ajouter un lien », tant qu'il n'y a pas de formulaire. */
export const LINK_SUGGESTIONS: Omit<LinkInBioItem, "id">[] = [
  { label: "Twitch", url: "https://twitch.tv/alexiscine", clicks: 0, enabled: true },
  { label: "TikTok", url: "https://tiktok.com/@alexiscine", clicks: 0, enabled: true },
  { label: "Mon podcast", url: "https://podcast.alexiscine.fr", clicks: 0, enabled: true },
  { label: "Me contacter", url: "mailto:contact@alexiscine.fr", clicks: 0, enabled: true },
];

export const CREATOR_LISTS: CreatorList[] = [
  {
    id: 1,
    title: "Le polar français des années 2020",
    item_count: 24,
    views: 4820,
    is_public: true,
  },
  { id: 2, title: "Huis clos parfaits", item_count: 12, views: 3110, is_public: true },
  { id: 3, title: "À voir avant la fin du monde", item_count: 18, views: 1245, is_public: true },
  { id: 4, title: "Repérages pour la chaîne", item_count: 31, views: 0, is_public: false },
  { id: 5, title: "Néo-noir européen", item_count: 9, views: 980, is_public: true },
];

export const PARTNER_OFFERS: PartnerOffer[] = [
  {
    id: 1,
    title: "Placement de produit, format critique longue",
    status: "en_ligne",
    requests: 7,
  },
  {
    id: 2,
    title: "Partenariat festival, couverture sur trois jours",
    status: "brouillon",
    requests: 0,
  },
  { id: 3, title: "Sponsor de la newsletter, un numéro", status: "clos", requests: 12 },
];
