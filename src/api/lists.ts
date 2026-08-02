import type { CreatorList } from "../types/studio";
import { requireSupabase } from "../lib/supabase";
import { unwrap, unwrapVoid } from "./client";

/** Forme retournée par l'agrégat `list_items(count)` de PostgREST. */
type ListRowWithCount = {
  id: string;
  title: string;
  is_public: boolean;
  created_at: string;
  list_items: { count: number }[];
};

const LIST_SELECT = "id, title, is_public, created_at, list_items(count)";

function toCreatorList(row: ListRowWithCount): CreatorList {
  return {
    id: row.id,
    title: row.title,
    is_public: row.is_public,
    item_count: row.list_items[0]?.count ?? 0,
    // `views` reste absent : l'audience arrivera avec sa propre table.
  };
}

/** Listes du compte, de la plus récente à la plus ancienne. */
export async function getMyLists(ownerId: string): Promise<CreatorList[]> {
  const result = await requireSupabase()
    .from("lists")
    .select(LIST_SELECT)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .returns<ListRowWithCount[]>();

  return unwrap(result, "charger tes listes").map(toCreatorList);
}

export async function createList(
  ownerId: string,
  title: string,
  isPublic: boolean,
): Promise<CreatorList> {
  const result = await requireSupabase()
    .from("lists")
    .insert({ owner_id: ownerId, title, is_public: isPublic })
    .select(LIST_SELECT)
    .single<ListRowWithCount>();

  return toCreatorList(unwrap(result, "créer cette liste"));
}

export async function renameList(id: string, title: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().from("lists").update({ title }).eq("id", id),
    "renommer cette liste",
  );
}

export async function setListVisibility(id: string, isPublic: boolean): Promise<void> {
  unwrapVoid(
    await requireSupabase().from("lists").update({ is_public: isPublic }).eq("id", id),
    "changer la visibilité de cette liste",
  );
}

export async function deleteList(id: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().from("lists").delete().eq("id", id),
    "supprimer cette liste",
  );
}

/**
 * Titres d'une liste, dans l'ordre choisi par son auteur.
 * `title_ref` pointe vers le jeu de données mocké tant que `films_catalog`
 * n'existe pas.
 */
export async function getListItems(listId: string): Promise<string[]> {
  const result = await requireSupabase()
    .from("list_items")
    .select("title_ref, position")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  return unwrap(result, "charger le contenu de cette liste").map((row) => row.title_ref);
}

export async function addListItem(
  listId: string,
  titleRef: string,
  position: number,
): Promise<void> {
  unwrapVoid(
    await requireSupabase()
      .from("list_items")
      .insert({ list_id: listId, title_ref: titleRef, position }),
    "ajouter ce titre à la liste",
  );
}

export async function removeListItem(id: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().from("list_items").delete().eq("id", id),
    "retirer ce titre de la liste",
  );
}
