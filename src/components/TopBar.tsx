import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BRAND, NAV_ITEMS } from "../config/brand";
import { COINS } from "../data/community";
import { useAuth } from "../context/auth-context";
import { IconClose, IconCoin, IconMenu, IconSearch } from "./icons";

export function TopBar() {
  const { pathname } = useLocation();
  const { status, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const signedIn = status === "signed-in";

  // Un changement de page referme le menu mobile.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <button
          type="button"
          className="topbar__burger"
          aria-expanded={menuOpen}
          aria-controls="nav-mobile"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <IconClose size={17} /> : <IconMenu size={17} />}
        </button>

        <Link className="topbar__logo" to="/" aria-label={`${BRAND.name}, accueil`}>
          {BRAND.logo.start}
          <span className="topbar__logo-accent">{BRAND.logo.accent}</span>
          {BRAND.logo.end}
        </Link>

        <nav className="topbar__nav" aria-label="Navigation principale">
          <NavLinks pathname={pathname} />
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

        {signedIn && profile ? (
          <AccountMenu initials={profile.initials} name={profile.display_name} />
        ) : (
          <Link className="topbar__signin" to="/connexion">
            Se connecter
          </Link>
        )}
      </div>

      {/* Sous 720px, la navigation principale se replie ici. */}
      {menuOpen && (
        <nav className="topbar__mobile" id="nav-mobile" aria-label="Navigation principale">
          <NavLinks pathname={pathname} />
        </nav>
      )}
    </header>
  );
}

/** Entrées de découverte. Celles sans route restent inertes en attendant l'écran. */
function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV_ITEMS.map((item) =>
        item.to ? (
          <Link
            key={item.label}
            className="topbar__nav-link"
            to={item.to}
            aria-current={pathname === item.to ? "page" : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className="topbar__nav-link topbar__nav-link--soon">
            {item.label}
          </span>
        ),
      )}
    </>
  );
}

type AccountMenuProps = {
  initials: string;
  name: string;
};

/** Menu de l'avatar : c'est le seul chemin vers l'espace personnel. */
function AccountMenu({ initials, name }: AccountMenuProps) {
  const { signOut } = useAuth();
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
          <li role="none">
            <Link className="account__item" role="menuitem" to="/mon-espace">
              Mon espace
            </Link>
          </li>
          <li role="none">
            <Link className="account__item" role="menuitem" to="/mon-espace">
              Mes listes
            </Link>
          </li>
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
