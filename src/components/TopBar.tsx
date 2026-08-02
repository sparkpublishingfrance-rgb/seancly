import { Link, useLocation } from "react-router-dom";
import { BRAND, NAV_ITEMS } from "../config/brand";
import { COINS, CURRENT_USER } from "../data/community";
import { IconCoin, IconSearch } from "./icons";

export function TopBar() {
  const { pathname } = useLocation();

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <Link className="topbar__logo" to="/" aria-label={`${BRAND.name}, accueil`}>
          {BRAND.logo.start}
          <span className="topbar__logo-accent">{BRAND.logo.accent}</span>
          {BRAND.logo.end}
        </Link>

        <nav className="topbar__nav" aria-label="Navigation principale">
          {/* Seul « Accueil » a une route pour l'instant. Les autres attendent
              leurs écrans. */}
          <Link
            className="topbar__nav-link"
            to="/"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            {NAV_ITEMS[0]}
          </Link>
          {NAV_ITEMS.slice(1).map((item) => (
            <a key={item} className="topbar__nav-link" href="#">
              {item}
            </a>
          ))}
        </nav>

        <div className="topbar__spacer" />

        <div className="topbar__search">
          <span className="topbar__search-icon">
            <IconSearch />
          </span>
          <label className="sr-only" htmlFor="topbar-search">
            Rechercher un film, une série, un créateur
          </label>
          <input
            id="topbar-search"
            className="topbar__search-input"
            type="search"
            placeholder="Rechercher un titre, un créateur"
          />
        </div>

        <span className="topbar__coins" title={`${COINS} pièces`}>
          <IconCoin />
          {COINS}
          <span className="sr-only">pièces</span>
        </span>

        <button
          type="button"
          className="topbar__avatar"
          aria-label={`Compte de ${CURRENT_USER.display_name}`}
        >
          {CURRENT_USER.initials}
        </button>
      </div>
    </header>
  );
}
