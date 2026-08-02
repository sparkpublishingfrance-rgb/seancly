import type { CreatorStats, LinkInBioItem, PartnerOffer, StatSeries } from "../types/studio";

/**
 * Ce qui reste mocké dans le studio.
 *
 * L'identité, les listes et les liens viennent désormais de Supabase, via
 * `src/api/`. Les statistiques d'audience et les offres de partenariat n'ont
 * pas encore de table : elles attendent leur propre lot.
 */
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

/** Propositions du bouton « Ajouter un lien », tant qu'il n'y a pas de formulaire. */
export const LINK_SUGGESTIONS: Pick<LinkInBioItem, "label" | "url">[] = [
  { label: "Ma chaîne YouTube", url: "https://youtube.com/@moi" },
  { label: "Instagram", url: "https://instagram.com/moi" },
  { label: "Ma newsletter", url: "https://manewsletter.substack.com" },
  { label: "Soutenir mon travail", url: "https://patreon.com/moi" },
  { label: "Me contacter", url: "mailto:contact@exemple.fr" },
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
