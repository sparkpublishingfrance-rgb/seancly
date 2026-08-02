import type { Guild, HoroscopeDay, Quest } from "../types/community";

/* ------------------------------------------------------------- horoscope */

type HoroscopeBandProps = {
  horoscope: HoroscopeDay;
};

export function HoroscopeBand({ horoscope }: HoroscopeBandProps) {
  return (
    <section className="shell" aria-labelledby="horoscope-title">
      <div className="horoscope">
        <span className="horoscope__sign" aria-hidden="true">
          {horoscope.sign_emoji}
        </span>

        <div className="horoscope__body">
          <p className="horoscope__label">
            Ton horoscope ciné · aujourd'hui · {horoscope.sign_name}
          </p>
          <h2 className="horoscope__title" id="horoscope-title">
            {horoscope.headline}
          </h2>
          <p className="horoscope__text">{horoscope.body}</p>

          <div className="horoscope__picks">
            <span className="horoscope__picks-label">Ta sélection du jour</span>
            {horoscope.picks.map((pick) => (
              <span className="chip" key={pick}>
                {pick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- guilde */

/** Initiales des membres visibles, en dur tant qu'il n'y a pas de base. */
const GUILD_FACES = ["MR", "JL", "TK", "SB"];

type GuildStripProps = {
  guild: Guild;
};

export function GuildStrip({ guild }: GuildStripProps) {
  const remaining = Math.max(guild.members - GUILD_FACES.length, 0);

  return (
    <section className="shell" aria-label="Visionnage groupé">
      <div className="guild">
        <div className="guild__avatars" aria-hidden="true">
          {GUILD_FACES.map((face) => (
            <span className="guild__avatar" key={face}>
              {face}
            </span>
          ))}
          {remaining > 0 && (
            <span className="guild__avatar guild__avatar--more">+{remaining}</span>
          )}
        </div>

        <p className="guild__text">
          <strong>
            {guild.emoji} {guild.name}
          </strong>{" "}
          visionne <strong>{guild.now_watching}</strong> ce soir
        </p>

        {guild.live && (
          <span className="guild__live">
            <span className="guild__live-dot" aria-hidden="true" />
            EN DIRECT
          </span>
        )}

        <button type="button" className="guild__join">
          Rejoindre
        </button>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- quêtes */

type QuestsGridProps = {
  quests: Quest[];
};

export function QuestsGrid({ quests }: QuestsGridProps) {
  return (
    <section className="shell" aria-labelledby="quests-title">
      <div className="quests__head">
        <h2 className="quests__title" id="quests-title">
          Tes quêtes
        </h2>
        <span className="quests__sub">Gagne de l'XP et des pièces en regardant</span>
      </div>

      <div className="quests__grid">
        {quests.map((quest) => (
          <article className="quest" key={quest.id}>
            <div className="quest__head">
              <h3 className="quest__title">{quest.title}</h3>
              {quest.daily && <span className="quest__daily">Quotidien</span>}
              <span className="quest__xp">+{quest.xp} XP</span>
            </div>

            <p className="quest__desc">{quest.description}</p>

            <div
              className="quest__track"
              role="progressbar"
              aria-valuenow={quest.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression : ${quest.title}`}
            >
              <div className="quest__bar" style={{ width: `${quest.progress}%` }} />
            </div>

            <span className="quest__progress-label">{quest.progress_label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
