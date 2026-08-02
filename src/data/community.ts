import type { Guild, HoroscopeDay, Progression, Quest } from "../types/community";

/**
 * Ce qui reste mocké côté communauté.
 * L'identité vient maintenant de la session, via `useAuth`. Horoscope, guildes
 * et quêtes attendent leurs tables.
 */

/** Monnaie de la gamification, affichée dans la barre du haut. */
export const COINS = 240;

/** Progression du membre. Attend sa table, comme le reste de la gamification. */
export const PROGRESSION: Progression = {
  xp: 2340,
  level: 7,
  level_label: "Habitué du dernier rang",
  next_level_xp: 3000,
  titles_watched: 84,
};

export const HOROSCOPE_TODAY: HoroscopeDay = {
  sign_emoji: "♏",
  sign_name: "Scorpion",
  headline: "Aujourd'hui, ferme la porte derrière toi",
  body: "Le huis clos te va bien en ce moment. Tu cherches moins l'action que le moment où plus personne ne peut sortir de la pièce. Nous te conseillons un thriller qui tient dans un seul décor, et un peu de patience avant le dernier quart d'heure.",
  picks: ["Huis clos tendu", "Thriller de nuit", "Moins de 100 minutes"],
};

export const LIVE_GUILD: Guild = {
  id: 7,
  name: "Guilde Néo-Noir",
  emoji: "🌧️",
  members: 12,
  now_watching: "Blade Runner 2049",
  live: true,
};

export const QUESTS: Quest[] = [
  {
    id: 1,
    title: "Marathon du mois",
    description: "Regarde dix films avant la fin du mois, tous genres confondus.",
    xp: 500,
    progress: 70,
    progress_label: "7 / 10 films",
  },
  {
    id: 2,
    title: "Critique du jour",
    description: "Publie une critique sur un titre terminé aujourd'hui.",
    xp: 50,
    progress: 0,
    progress_label: "0 / 1 critique",
    daily: true,
  },
  {
    id: 3,
    title: "Explorateur de genres",
    description: "Termine un titre dans cinq genres différents.",
    xp: 300,
    progress: 60,
    progress_label: "3 / 5 genres",
  },
];
