import type { Rail as RailData } from "../types/tmdb";
import { titleById } from "../data/titles";
import { PosterCard } from "./PosterCard";

type RailProps = {
  rail: RailData;
};

export function Rail({ rail }: RailProps) {
  const titles = rail.ids.map(titleById).filter((title) => title !== undefined);

  if (titles.length === 0) return null;

  return (
    <section className="rail" aria-labelledby={`rail-${slug(rail.title)}`}>
      <div className="shell rail__head">
        <h2 className="rail__title" id={`rail-${slug(rail.title)}`}>
          {rail.title}
        </h2>
        {rail.by && <span className="rail__by">{rail.by}</span>}
        <a className="rail__all" href="#">
          Tout voir
        </a>
      </div>

      <div className="shell">
        <ul className="rail__track">
          {titles.map((title) => (
            <li className="rail__item" key={title.id}>
              <PosterCard title={title} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Identifiant stable dérivé du libellé, pour relier titre et section. */
function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
