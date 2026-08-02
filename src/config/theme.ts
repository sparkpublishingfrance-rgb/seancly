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

/**
 * Dégradés d'affiche et de fond construits à partir de la couleur de tranche.
 * Ils servent de placeholder tant que les images TMDB ne sont pas branchées.
 * Les suffixes hexadécimaux ajoutent l'opacité, au format #RRGGBBAA.
 */
export function posterGradient(spine: string): string {
  return [
    `radial-gradient(118% 76% at 22% 8%, ${spine}b0 0%, ${spine}22 58%, transparent 72%)`,
    `linear-gradient(168deg, ${spine}66 0%, ${COLORS.bg}f2 62%, ${COLORS.bg} 100%)`,
  ].join(", ");
}

export function backdropGradient(spine: string): string {
  return [
    `radial-gradient(70% 68% at 76% 18%, ${spine}88 0%, ${spine}00 64%)`,
    `radial-gradient(48% 52% at 12% 74%, ${COLORS.gold}22 0%, ${COLORS.gold}00 70%)`,
    `linear-gradient(112deg, #101018 0%, ${spine}33 52%, ${spine}55 100%)`,
  ].join(", ");
}

/** Pastille ronde des membres et du casting, déclinée à partir d'une teinte. */
export function avatarGradient(tint: string): string {
  return `linear-gradient(140deg, ${tint} 0%, ${COLORS.surface2} 100%)`;
}

export const LAYOUT = {
  /** Largeur maximale du contenu. */
  maxWidth: 1440,
  /** Breakpoint unique : sous cette largeur, nav et recherche disparaissent. */
  compactBreakpoint: 720,
} as const;

export type ColorToken = keyof typeof COLORS;
