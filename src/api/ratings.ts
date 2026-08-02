import { requireSupabase } from "../lib/supabase";
import { DataError, unwrap, unwrapVoid } from "./client";

/**
 * Les notes sont saisies en demi-étoiles, de 0,5 à 5.
 * La fiche film affiche sur dix, comme TMDB : c'est une conversion d'affichage,
 * jamais un changement de ce qui est stocké.
 */
export const RATING_MIN = 0.5;
export const RATING_MAX = 5;

export function toTenScale(rating: number): number {
  return rating * 2;
}

export type TitleRating = {
  authorId: string;
  rating: number;
  body: string | null;
};

/** Note du compte sur un titre, ou `null` s'il ne l'a pas encore noté. */
export async function getMyRating(
  authorId: string,
  titleRef: string,
): Promise<TitleRating | null> {
  const { data, error } = await requireSupabase()
    .from("ratings")
    .select("author_id, rating, body")
    .eq("author_id", authorId)
    .eq("title_ref", titleRef)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à charger ta note.", error);
  return data ? { authorId: data.author_id, rating: data.rating, body: data.body } : null;
}

/** Toutes les notes portées sur un titre. Lecture publique. */
export async function getRatingsForTitle(titleRef: string): Promise<TitleRating[]> {
  const result = await requireSupabase()
    .from("ratings")
    .select("author_id, rating, body")
    .eq("title_ref", titleRef)
    .order("updated_at", { ascending: false });

  return unwrap(result, "charger les notes de ce titre").map((row) => ({
    authorId: row.author_id,
    rating: row.rating,
    body: row.body,
  }));
}

/**
 * Pose ou remplace sa note sur un titre.
 * La contrainte d'unicité `(author_id, title_ref)` fait de `upsert` une mise à
 * jour quand la note existe déjà.
 */
export async function upsertRating(
  authorId: string,
  titleRef: string,
  rating: number,
  body?: string | null,
): Promise<void> {
  unwrapVoid(
    await requireSupabase()
      .from("ratings")
      .upsert(
        { author_id: authorId, title_ref: titleRef, rating, body: body ?? null },
        { onConflict: "author_id,title_ref" },
      ),
    "enregistrer ta note",
  );
}

export async function deleteRating(authorId: string, titleRef: string): Promise<void> {
  unwrapVoid(
    await requireSupabase()
      .from("ratings")
      .delete()
      .eq("author_id", authorId)
      .eq("title_ref", titleRef),
    "retirer ta note",
  );
}
