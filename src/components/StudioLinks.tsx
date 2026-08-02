import { useState } from "react";
import type { CreatorProfile, LinkInBioItem } from "../types/studio";
import { LINK_IN_BIO, LINK_SUGGESTIONS } from "../data/studio";
import { BRAND } from "../config/brand";
import { formatNumber } from "../utils/format";
import {
  IconArrowVertical,
  IconCheck,
  IconClose,
  IconPen,
  IconPlus,
  IconTrash,
} from "./icons";

type StudioLinksProps = {
  creator: CreatorProfile;
};

/**
 * Gestion de la page « lien en bio », avec son aperçu.
 * Tout est en état local : rien n'est enregistré tant que la base n'existe pas.
 */
export function StudioLinks({ creator }: StudioLinksProps) {
  const [links, setLinks] = useState<LinkInBioItem[]>(LINK_IN_BIO);
  const [editingId, setEditingId] = useState<number | null>(null);

  function toggle(id: number) {
    setLinks((current) =>
      current.map((link) => (link.id === id ? { ...link, enabled: !link.enabled } : link)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    setLinks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  function remove(id: number) {
    setLinks((current) => current.filter((link) => link.id !== id));
    setEditingId((current) => (current === id ? null : current));
  }

  function update(id: number, label: string, url: string) {
    setLinks((current) =>
      current.map((link) => (link.id === id ? { ...link, label, url } : link)),
    );
    setEditingId(null);
  }

  /** Ajoute une suggestion non encore présente, faute de formulaire de création. */
  function add() {
    const used = new Set(links.map((link) => link.label));
    const suggestion = LINK_SUGGESTIONS.find((item) => !used.has(item.label));
    if (!suggestion) return;

    const nextId = links.reduce((max, link) => Math.max(max, link.id), 0) + 1;
    setLinks((current) => [...current, { ...suggestion, id: nextId }]);
    setEditingId(nextId);
  }

  const visible = links.filter((link) => link.enabled);

  return (
    <div className="studio-panel links">
      <section className="links__manager" aria-labelledby="links-title">
        <div className="studio-block__head">
          <h2 className="studio-block__title" id="links-title">
            Tes liens
          </h2>
          <button type="button" className="btn btn--ghost btn--small" onClick={add}>
            <IconPlus size={14} />
            Ajouter un lien
          </button>
        </div>

        {links.length === 0 ? (
          <p className="studio-empty">Ajoute ton premier lien pour construire ta page.</p>
        ) : (
          <ul className="linklist">
            {links.map((link, index) => (
              <li className="linkrow" key={link.id}>
                <div className="linkrow__order">
                  <button
                    type="button"
                    className="iconbtn"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Monter ${link.label}`}
                  >
                    <IconArrowVertical up />
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    onClick={() => move(index, 1)}
                    disabled={index === links.length - 1}
                    aria-label={`Descendre ${link.label}`}
                  >
                    <IconArrowVertical />
                  </button>
                </div>

                {editingId === link.id ? (
                  <LinkEditor
                    link={link}
                    onCancel={() => setEditingId(null)}
                    onSave={(label, url) => update(link.id, label, url)}
                  />
                ) : (
                  <>
                    <div className="linkrow__main">
                      <span className="linkrow__label">{link.label}</span>
                      <span className="linkrow__url">{link.url}</span>
                    </div>

                    <span className="linkrow__clicks">
                      {formatNumber(link.clicks)}
                      <span className="linkrow__clicks-unit">clics</span>
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={link.enabled}
                      className="switch"
                      onClick={() => toggle(link.id)}
                    >
                      <span className="switch__knob" />
                      <span className="sr-only">
                        {link.enabled ? `Masquer ${link.label}` : `Afficher ${link.label}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="iconbtn"
                      onClick={() => setEditingId(link.id)}
                      aria-label={`Modifier ${link.label}`}
                    >
                      <IconPen size={14} />
                    </button>
                    <button
                      type="button"
                      className="iconbtn iconbtn--danger"
                      onClick={() => remove(link.id)}
                      aria-label={`Supprimer ${link.label}`}
                    >
                      <IconTrash />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="studio-note">
          Nous n'enregistrons rien pour l'instant : ces réglages disparaissent au
          rechargement de la page.
        </p>
      </section>

      <aside className="links__preview" aria-label="Aperçu de ta page publique">
        <p className="links__preview-label">Ce que voient tes abonnés</p>

        <div className="preview">
          <span className="preview__avatar" aria-hidden="true">
            {creator.initials}
          </span>
          <p className="preview__name">{creator.display_name}</p>
          <p className="preview__handle">{creator.handle}</p>
          <p className="preview__bio">{creator.bio}</p>

          {visible.length === 0 ? (
            <p className="preview__empty">Aucun lien actif pour le moment.</p>
          ) : (
            <ul className="preview__links">
              {visible.map((link) => (
                <li className="preview__link" key={link.id}>
                  {link.label}
                </li>
              ))}
            </ul>
          )}

          <p className="preview__foot">
            {BRAND.public_domain}/@{creator.link_in_bio_slug}
          </p>
        </div>
      </aside>
    </div>
  );
}

type LinkEditorProps = {
  link: LinkInBioItem;
  onSave: (label: string, url: string) => void;
  onCancel: () => void;
};

/** Édition en ligne d'un lien. Local, sans validation d'URL à ce stade. */
function LinkEditor({ link, onSave, onCancel }: LinkEditorProps) {
  const [label, setLabel] = useState(link.label);
  const [url, setUrl] = useState(link.url);

  return (
    <form
      className="linkrow__editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(label.trim() || link.label, url.trim() || link.url);
      }}
    >
      <label className="sr-only" htmlFor={`label-${link.id}`}>
        Intitulé du lien
      </label>
      <input
        id={`label-${link.id}`}
        className="field"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        autoFocus
      />

      <label className="sr-only" htmlFor={`url-${link.id}`}>
        Adresse du lien
      </label>
      <input
        id={`url-${link.id}`}
        className="field field--url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
      />

      <button type="submit" className="iconbtn iconbtn--confirm" aria-label="Enregistrer">
        <IconCheck />
      </button>
      <button type="button" className="iconbtn" onClick={onCancel} aria-label="Annuler">
        <IconClose />
      </button>
    </form>
  );
}
