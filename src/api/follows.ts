import { requireSupabase } from "../lib/supabase";
import { DataError, unwrap, unwrapVoid } from "./client";

export type FollowCounts = {
  followers: number;
  following: number;
};

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await requireSupabase()
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à vérifier cet abonnement.", error);
  return data !== null;
}

/** Suit ou arrête de suivre un profil. Renvoie l'état après bascule. */
export async function toggleFollow(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const client = requireSupabase();
  const already = await isFollowing(followerId, followingId);

  if (already) {
    unwrapVoid(
      await client
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId),
      "arrêter de suivre ce profil",
    );
    return false;
  }

  unwrapVoid(
    await client
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId }),
    "suivre ce profil",
  );
  return true;
}

/** Compteurs d'abonnés et d'abonnements, lus depuis la vue agrégée. */
export async function getFollowCounts(profileId: string): Promise<FollowCounts> {
  const result = await requireSupabase()
    .from("follow_counts")
    .select("followers, following")
    .eq("profile_id", profileId)
    .single();

  const row = unwrap(result, "charger les compteurs d'abonnés");
  return { followers: row.followers, following: row.following };
}
