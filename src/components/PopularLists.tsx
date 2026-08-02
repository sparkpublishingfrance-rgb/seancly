import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PublicList } from "../api/listSocial";
import { getPopularLists } from "../api/listSocial";
import { creatorAvatarGradient } from "../config/theme";
import { isSupabaseConfigured } from "../lib/supabase";
import { formatNumber } from "../utils/format";

/**
 * Rangée « Listes en vogue » de l'accueil.
 *
 * C'est de la découverte publique, pas de l'activité personnelle : le
 * classement ne dépend de personne en particulier, et la rangée s'affiche
 * aussi bien à un visiteur sans compte. Elle disparaît si rien n'est à montrer,
 * plutôt que d'occuper la place avec un état vide.
 */
export function PopularLists() {
  const [lists, setLists] = useState<PublicList[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;

    void getPopularLists({ limit: 12 })
      .then((loaded) => {
        if (alive) setLists(loaded);
      })
      // Une rangée de découverte ne mérite pas de bloquer l'accueil : en cas
      // d'échec, elle ne s'affiche simplement pas.
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  if (lists.length === 0) return null;

  return (
    <section className="rail" aria-labelledby="rail-listes">
      <div className="shell rail__head">
        <h2 className="rail__title" id="rail-listes">
          Listes en vogue
        </h2>
        <span className="rail__by">Composées par des membres</span>
      </div>

      <div className="shell">
        <ul className="rail__track">
          {lists.map((list) => (
            <li className="rail__item" key={list.id}>
              <Link className="listtile" to={`/liste/${list.id}`}>
                <span className="listtile__title">{list.title}</span>

                <span className="listtile__author">
                  <span
                    className="listtile__avatar"
                    style={{ background: creatorAvatarGradient(list.owner.avatarColor) }}
                    aria-hidden="true"
                  >
                    {list.owner.initials}
                  </span>
                  {list.owner.displayName}
                </span>

                <span className="listtile__stats">
                  {formatNumber(list.stats.items)}
                  {list.stats.items > 1 ? " titres" : " titre"}
                  {list.stats.followers > 0 && (
                    <>
                      <span className="listtile__sep" aria-hidden="true" />
                      {formatNumber(list.stats.followers)}
                      {list.stats.followers > 1 ? " abonnés" : " abonné"}
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
