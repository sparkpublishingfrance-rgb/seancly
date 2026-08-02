import { BRAND } from "../config/brand";

export function Footer() {
  return (
    <footer className="foot">
      <div className="shell">
        <p className="foot__brand">{BRAND.name}</p>
        <ul className="foot__list">
          <li>{BRAND.notices.posters}</li>
          {/* Emplacement de l'attribution TMDB, logo compris, dès le branchement. */}
          <li>{BRAND.notices.tmdb}</li>
          <li>{BRAND.notices.inpi}</li>
        </ul>
      </div>
    </footer>
  );
}
