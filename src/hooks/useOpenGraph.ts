import { useEffect } from "react";

/**
 * Pose les balises Open Graph d'une page partagée.
 *
 * L'application est rendue côté client : un robot qui n'exécute pas le
 * JavaScript ne verra que les balises par défaut d'`index.html`. Les vraies
 * métadonnées par créateur demanderont un rendu serveur ou une fonction de
 * pré-rendu, à faire quand la vitrine sera vraiment partagée.
 */
export function useOpenGraph(tags: { title: string; description: string }): void {
  const { title, description } = tags;

  useEffect(() => {
    const applied = [
      setMeta("og:title", title),
      setMeta("og:description", description),
      setMeta("og:type", "profile"),
      setMeta("og:url", window.location.href),
    ];

    return () => {
      for (const restore of applied) restore();
    };
  }, [title, description]);
}

/** Écrit une balise, et rend de quoi remettre la valeur précédente. */
function setMeta(property: string, content: string): () => void {
  const existing = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );

  if (existing) {
    const previous = existing.content;
    existing.content = content;
    return () => {
      existing.content = previous;
    };
  }

  const created = document.createElement("meta");
  created.setAttribute("property", property);
  created.content = content;
  document.head.append(created);
  return () => created.remove();
}
