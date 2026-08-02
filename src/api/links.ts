import type { LinkInBioItem } from "../types/studio";
import { requireSupabase } from "../lib/supabase";
import { unwrap, unwrapVoid } from "./client";

const LINK_SELECT = "id, label, url, position, enabled, clicks";

type LinkRow = {
  id: string;
  label: string;
  url: string;
  position: number;
  enabled: boolean;
  clicks: number;
};

function toLinkItem(row: LinkRow): LinkInBioItem {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    enabled: row.enabled,
    clicks: row.clicks,
  };
}

/**
 * Liens d'un créateur, dans l'ordre d'affichage.
 * Un visiteur ne reçoit que les liens activés : la RLS s'en charge, pas nous.
 */
export async function getLinkInBioItems(ownerId: string): Promise<LinkInBioItem[]> {
  const result = await requireSupabase()
    .from("link_in_bio_items")
    .select(LINK_SELECT)
    .eq("owner_id", ownerId)
    .order("position", { ascending: true })
    .returns<LinkRow[]>();

  return unwrap(result, "charger tes liens").map(toLinkItem);
}

export async function createLinkInBioItem(
  ownerId: string,
  input: { label: string; url: string; position: number; enabled?: boolean },
): Promise<LinkInBioItem> {
  const result = await requireSupabase()
    .from("link_in_bio_items")
    .insert({
      owner_id: ownerId,
      label: input.label,
      url: input.url,
      position: input.position,
      enabled: input.enabled ?? true,
    })
    .select(LINK_SELECT)
    .single<LinkRow>();

  return toLinkItem(unwrap(result, "ajouter ce lien"));
}

export async function updateLinkInBioItem(
  id: string,
  patch: { label?: string; url?: string; enabled?: boolean },
): Promise<void> {
  unwrapVoid(
    await requireSupabase().from("link_in_bio_items").update(patch).eq("id", id),
    "enregistrer ce lien",
  );
}

export async function deleteLinkInBioItem(id: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().from("link_in_bio_items").delete().eq("id", id),
    "supprimer ce lien",
  );
}

/** Réécrit les positions d'après l'ordre du tableau reçu. */
export async function reorderLinkInBioItems(items: LinkInBioItem[]): Promise<void> {
  const client = requireSupabase();

  const results = await Promise.all(
    items.map((item, index) =>
      client.from("link_in_bio_items").update({ position: index }).eq("id", item.id),
    ),
  );

  for (const result of results) {
    unwrapVoid(result, "enregistrer le nouvel ordre");
  }
}

/**
 * Compte un clic depuis la page publique.
 * Passe par une fonction en base : personne n'a le droit d'écrire sur `clicks`.
 */
export async function registerLinkClick(id: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().rpc("register_link_click", { target_link: id }),
    "enregistrer ce clic",
  );
}
