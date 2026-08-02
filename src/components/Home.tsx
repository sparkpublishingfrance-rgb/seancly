import { BRAND } from "../config/brand";
import { HOROSCOPE_TODAY, LIVE_GUILD, QUESTS } from "../data/community";
import { FEATURED, RAILS } from "../data/titles";
import { GuildStrip, HoroscopeBand, QuestsGrid } from "./Community";
import { Hero } from "./Hero";
import { Rail } from "./Rail";
import { TopBar } from "./TopBar";

export function Home() {
  return (
    <>
      <TopBar />

      <main>
        <Hero title={FEATURED} />

        <div className="rows">
          <HoroscopeBand horoscope={HOROSCOPE_TODAY} />
          <GuildStrip guild={LIVE_GUILD} />

          {RAILS.map((rail) => (
            <Rail rail={rail} key={rail.title} />
          ))}

          <QuestsGrid quests={QUESTS} />
        </div>
      </main>

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
    </>
  );
}
