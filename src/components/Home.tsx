import { HOROSCOPE_TODAY, LIVE_GUILD, QUESTS } from "../data/community";
import { FEATURED, RAILS } from "../data/titles";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { GuildStrip, HoroscopeBand, QuestsGrid } from "./Community";
import { Hero } from "./Hero";
import { Rail } from "./Rail";

export function Home() {
  useDocumentTitle();

  return (
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
  );
}
