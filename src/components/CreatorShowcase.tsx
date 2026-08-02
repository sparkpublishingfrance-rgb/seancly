import type { ReactNode } from "react";
import type { PublicLink } from "../api/links";
import { BRAND } from "../config/brand";
import { COLORS, creatorAvatarGradient } from "../config/theme";
import { IconVerified } from "./icons";

/** Le strict nécessaire à l'affichage d'une vitrine, quelle que soit la source. */
export type ShowcaseProfile = {
  display_name: string;
  handle: string;
  initials: string;
  bio: string;
  /** Fragment d'URL, sans arobase. */
  slug: string;
  avatar_color?: string;
  verified?: boolean;
};

type CreatorShowcaseProps = {
  profile: ShowcaseProfile;
  /** Déjà filtrés sur les liens actifs, dans l'ordre voulu par le créateur. */
  links: PublicLink[];
  /**
   * `preview` rend une maquette inerte, pour le studio.
   * `public` rend la vraie page, dont les liens s'ouvrent.
   */
  variant: "preview" | "public";
  emptyLabel: string;
  /** Bandeau ou action glissés entre l'identité et les liens. */
  children?: ReactNode;
  onLinkClick?: (link: PublicLink) => void;
};

/**
 * Vitrine « lien en bio », partagée entre l'aperçu du studio et la page
 * publique. Une seule mise en forme, deux usages : ce que le créateur règle est
 * exactement ce que ses abonnés voient.
 */
export function CreatorShowcase({
  profile,
  links,
  variant,
  emptyLabel,
  children,
  onLinkClick,
}: CreatorShowcaseProps) {
  const isPublic = variant === "public";

  return (
    <div className={`showcase showcase--${variant}`}>
      <span
        className="showcase__avatar"
        style={{ background: creatorAvatarGradient(profile.avatar_color ?? COLORS.raspberry) }}
        aria-hidden="true"
      >
        {profile.initials}
      </span>

      <p className="showcase__name">
        {profile.display_name}
        {profile.verified && (
          <span className="showcase__verified" title="Compte vérifié">
            <IconVerified size={isPublic ? 17 : 14} />
            <span className="sr-only">Compte vérifié</span>
          </span>
        )}
      </p>
      <p className="showcase__handle">{profile.handle}</p>

      {profile.bio && <p className="showcase__bio">{profile.bio}</p>}

      {children}

      {links.length === 0 ? (
        <p className="showcase__empty">{emptyLabel}</p>
      ) : (
        <ul className="showcase__links">
          {links.map((link) => (
            <li key={link.id}>
              {isPublic ? (
                <a
                  className="showcase__link"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                >
                  {link.label}
                </a>
              ) : (
                <span className="showcase__link">{link.label}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="showcase__foot">
        {BRAND.public_domain}/@{profile.slug}
      </p>
    </div>
  );
}
