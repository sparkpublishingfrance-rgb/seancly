import { useEffect } from "react";
import { BRAND } from "../config/brand";

/**
 * Met à jour le titre du document, suffixé par la marque.
 * Sans argument, retombe sur le nom de la marque seul.
 */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND.name}` : BRAND.name;
  }, [title]);
}
