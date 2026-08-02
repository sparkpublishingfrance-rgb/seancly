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

/**
 * Profil tel que la vitrine publique le montre.
 * Ni `plan` ni `is_creator` : ces colonnes ne sont pas accordées à `anon`.
 */
export type PublicCreator = {
  id: string;
  /** Avec l'arobase, comme dans l'interface. */
  handle: string;
  /** Sans l'arobase, tel qu'il apparaît dans l'URL. */
  slug: string;
  display_name: string;
  initials: string;
  bio: string;
  avatar_color: string;
  verified: boolean;
  followers: number;
  public_lists: number;
};

const PUBLIC_COLUMNS = "id, handle, display_name, bio, avatar_color, verified";

/**
 * Vitrine d'un créateur, à partir du slug de l'URL.
 * Renvoie `null` si le slug ne correspond à personne, ce que la page traduit en
 * message plutôt qu'en erreur.
 */
export async function getPublicProfileBySlug(slug: string): Promise<PublicCreator | null> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("profiles")
    .select(PUBLIC_COLUMNS)
    .eq("handle", slug)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à charger ce profil.", error);
  if (!data) return null;

  // Agrégats publics. Un échec ici ne doit pas emporter la page entière.
  const [counts, lists] = await Promise.all([
    client.from("follow_counts").select("followers").eq("profile_id", data.id).maybeSingle(),
    client
      .from("lists")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", data.id)
      .eq("is_public", true),
  ]);

  return {
    id: data.id,
    handle: `@${data.handle}`,
    slug: data.handle,
    display_name: data.display_name,
    initials: initialsOf(data.display_name),
    bio: data.bio ?? "",
    avatar_color: data.avatar_color,
    verified: data.verified,
    followers: counts.data?.followers ?? 0,
    public_lists: lists.count ?? 0,
  };
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
