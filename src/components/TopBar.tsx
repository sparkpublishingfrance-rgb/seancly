import { BRAND, NAV_ITEMS } from "../config/brand";
import { COINS, CURRENT_USER } from "../data/community";
import { IconCoin, IconSearch } from "./icons";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <a className="topbar__logo" href="#" aria-label={`${BRAND.name}, accueil`}>
          {BRAND.logo.start}
          <span className="topbar__logo-accent">{BRAND.logo.accent}</span>
          {BRAND.logo.end}
        </a>

        <nav className="topbar__nav" aria-label="Navigation principale">
          {NAV_ITEMS.map((item, index) => (
            <a
              key={item}
              className="topbar__nav-link"
              href="#"
              aria-current={index === 0 ? "page" : undefined}
            >
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
