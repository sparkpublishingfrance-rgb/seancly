import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BRAND, NAV_ITEMS } from "../config/brand";
import { COINS } from "../data/community";
import { useAuth } from "../context/auth-context";
import { IconCoin, IconSearch } from "./icons";

export function TopBar() {
  const { pathname } = useLocation();
  const { status, profile } = useAuth();
  const signedIn = status === "signed-in";

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

        {signedIn && (
          <span className="topbar__coins" title={`${COINS} pièces`}>
            <IconCoin />
            {COINS}
            <span className="sr-only">pièces</span>
          </span>
        )}

        {/* Espace privé, réservé aux comptes créateurs. */}
        {signedIn && profile?.is_creator && (
          <Link
            className="topbar__studio"
            to="/studio"
            aria-current={pathname === "/studio" ? "page" : undefined}
          >
            Studio
          </Link>
        )}

        {signedIn && profile ? (
          <AccountMenu initials={profile.initials} name={profile.display_name} />
        ) : (
          <Link className="topbar__signin" to="/connexion">
            Se connecter
          </Link>
        )}
      </div>
    </header>
  );
}

type AccountMenuProps = {
  initials: string;
  name: string;
};

/** Menu de l'avatar : accès au studio et déconnexion. */
function AccountMenu({ initials, name }: AccountMenuProps) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="account" ref={container}>
      <button
        type="button"
        className="topbar__avatar"
        aria-label={`Compte de ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>

      {open && (
        <ul className="account__menu" role="menu">
          <li role="none" className="account__who">
            {name}
          </li>
          {profile?.is_creator && (
            <li role="none">
              <Link className="account__item" role="menuitem" to="/studio">
                Mon studio
              </Link>
            </li>
          )}
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="account__item"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              Se déconnecter
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
