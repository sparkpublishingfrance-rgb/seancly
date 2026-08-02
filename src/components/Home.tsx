import { LIVE_GUILD } from "../data/community";
import { FEATURED, HOME_RAILS } from "../data/titles";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { GuildStrip } from "./Community";
import { Hero } from "./Hero";
import { PopularLists } from "./PopularLists";
import { Rail } from "./Rail";

/**
 * Accueil : découverte de catalogue, rien de personnel.
 * Un visiteur sans compte doit pouvoir le parcourir de bout en bout sans y
 * croiser la moindre donnée de compte. L'horoscope, les quêtes et la reprise de
 * visionnage vivent dans « Mon espace ».
 */
export function Home() {
  useDocumentTitle();

  return (
    <main>
      <Hero title={FEATURED} />

      <div className="rows">
        <GuildStrip guild={LIVE_GUILD} />

        {HOME_RAILS.slice(0, 1).map((rail) => (
          <Rail rail={rail} key={rail.title} />
        ))}

        <PopularLists />

        {HOME_RAILS.slice(1).map((rail) => (
          <Rail rail={rail} key={rail.title} />
        ))}
      </div>
    </main>
  );
}
