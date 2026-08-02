import type { Database } from "../lib/database.types";
import type { CreatorProfile } from "../types/studio";
import { requireSupabase } from "../lib/supabase";
import { initialsOf } from "../utils/format";
import { DataError, unwrap } from "./client";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Traduit une ligne de `public.profiles` vers le type manipulé par l'app. */
export function toCreatorProfile(row: ProfileRow): CreatorProfile {
  return {
    id: row.id,
    handle: `@${row.handle}`,
    display_name: row.display_name,
    initials: initialsOf(row.display_name),
    verified: row.verified,
    is_creator: row.is_creator,
    member_since: row.created_at,
    plan: row.plan,
    bio: row.bio ?? "",
    avatar_color: row.avatar_color,
    link_in_bio_slug: row.handle,
  };
}

/** Profil d'un compte. `null` si la ligne n'existe pas encore. */
export async function getProfile(id: string): Promise<CreatorProfile | null> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à charger ce profil.", error);
  return data ? toCreatorProfile(data) : null;
}

/** Profil public par son handle, sans arobase. Sert la vitrine créateur. */
export async function getProfileByHandle(handle: string): Promise<CreatorProfile | null> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à charger ce profil.", error);
  return data ? toCreatorProfile(data) : null;
}

export type ProfilePatch = {
  display_name?: string;
  bio?: string | null;
  handle?: string;
};

/**
 * Met à jour son propre profil.
 * `is_creator`, `plan` et `verified` en sont absents à dessein : ces colonnes
 * ne sont pas accordées au client, elles relèvent de la facturation et de la
 * modération.
 */
export async function updateProfile(id: string, patch: ProfilePatch): Promise<CreatorProfile> {
  const result = await requireSupabase()
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  return toCreatorProfile(unwrap(result, "enregistrer ton profil"));
}
