/**
 * Miroir TypeScript des variables CSS de `src/styles/global.css`.
 * À utiliser quand une couleur doit être calculée en JS (dégradés d'affiches,
 * canvas, etc.). Toute modification ici doit être répercutée dans global.css.
 */
export const COLORS = {
  /** Fond principal, noir cinéma. */
  bg: "#0B0B0F",
  /** Surface, gris anthracite. */
  surface: "#16161C",
  /** Surface secondaire, anthracite clair. */
  surface2: "#1F1F27",
  /** Bordures et filets. */
  line: "#2A2A33",
  /** Accent primaire, départ du dégradé. */
  red: "#E50914",
  /** Accent primaire, arrivée du dégradé. */
  raspberry: "#C0386A",
  /** Accent secondaire, or projecteur. */
  gold: "#C9A24B",
  /** Texte principal, blanc cassé. */
  text: "#F4F1F4",
  /** Texte discret. */
  muted: "#9A94A2",
} as const;

export const GRADIENTS = {
  /** Dégradé de marque, rouge vers framboise. */
  accent: `linear-gradient(135deg, ${COLORS.red} 0%, ${COLORS.raspberry} 100%)`,
  /** Dégradé de gamification, framboise vers or. */
  reward: `linear-gradient(90deg, ${COLORS.raspberry} 0%, ${COLORS.gold} 100%)`,
} as const;

export const LAYOUT = {
  /** Largeur maximale du contenu. */
  maxWidth: 1440,
  /** Breakpoint unique : sous cette largeur, nav et recherche disparaissent. */
  compactBreakpoint: 720,
} as const;

export type ColorToken = keyof typeof COLORS;
