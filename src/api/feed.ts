import type { ActivityVerbRow } from "../lib/database.types";
import type { TmdbTitle } from "../types/tmdb";
import { requireSupabase } from "../lib/supabase";
import { titleById } from "../data/titles";
import { initialsOf } from "../utils/format";
import { unwrap } from "./client";

export type FeedProfile = {
  id: string;
  /** Sans arobase, tel qu'il apparaît dans l'URL. */
  slug: string;
  displayName: string;
  initials: string;
  avatarColor: string;
};

export type FeedEvent = {
  id: string;
  verb: ActivityVerbRow;
  createdAt: string;
  actor: FeedProfile;
  /** Note donnée, pour `rated` et `reviewed`. */
  rating?: number;
  /** Titre résolu depuis le jeu mocké, tant que `films_catalog` n'existe pas. */
  title?: TmdbTitle;
  titleRef?: string;
  /** Nom de la liste au moment de l'événement, lu dans `metadata`. */
  listTitle?: string;
  /** Profil concerné, pour `followed`. */
  target?: FeedProfile;
};

export type FeedPage = {
  events: FeedEvent[];
  /** Curseur de la page suivante, ou `null` quand le fil est épuisé. */
  nextCursor: string | null;
  /** Nombre d'abonnements du lecteur, pour distinguer les deux états vides. */
  followingCount: number;
};

const PROFILE_COLUMNS = "id, handle, display_name, avatar_color";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_color: string;
};

function toFeedProfile(row: ProfileRow): FeedProfile {
  return {
    id: row.id,
    slug: row.handle,
    displayName: row.display_name,
    initials: initialsOf(row.display_name),
    avatarColor: row.avatar_color,
  };
}

type FeedOptions = {
  limit?: number;
  /** Horodatage de la dernière ligne reçue, pour la page suivante. */
  before?: string;
};

/**
 * Fil d'activité du lecteur : ce qu'ont fait les personnes qu'il suit, et
 * lui-même.
 *
 * Trois requêtes au total, quel que soit le nombre d'événements : les
 * abonnements, la page d'activité, puis les profils cités, résolus en un lot.
 * Les titres viennent du jeu mocké et ne coûtent aucun appel.
 */
export async function getFeed(
  viewerId: string,
  { limit = 20, before }: FeedOptions = {},
): Promise<FeedPage> {
  const client = requireSupabase();

  const follows = unwrap(
    await client.from("follows").select("following_id").eq("follower_id", viewerId),
    "charger tes abonnements",
  );
  const followingIds = follows.map((row) => row.following_id);

  // Le fil réunit les abonnements et le lecteur : sans cela, un membre actif qui
  // ne suit encore personne verrait un écran vide alors qu'il vient d'agir.
  const actors = [viewerId, ...followingIds];

  let query = client
    .from("activity")
    .select("id, actor_id, verb, object_type, object_ref, metadata, created_at")
    .in("actor_id", actors)
    .order("created_at", { ascending: false })
    // Une ligne de plus que demandé : sa présence dit s'il reste une page.
    .limit(limit + 1);

  if (before) query = query.lt("created_at", before);

  const rows = unwrap(await query, "charger ton fil");
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1].created_at : null;

  // Résolution en un lot : acteurs et profils cités dans un seul appel.
  const profileIds = new Set<string>();
  for (const row of page) {
    profileIds.add(row.actor_id);
    if (row.object_type === "profile") profileIds.add(row.object_ref);
  }

  const profiles = new Map<string, FeedProfile>();
  if (profileIds.size > 0) {
    const loaded = unwrap(
      await client.from("profiles").select(PROFILE_COLUMNS).in("id", [...profileIds]),
      "charger les profils du fil",
    );
    for (const row of loaded) profiles.set(row.id, toFeedProfile(row));
  }

  const events: FeedEvent[] = [];
  for (const row of page) {
    const actor = profiles.get(row.actor_id);
    // Un acteur introuvable signale un compte supprimé entre-temps : on saute.
    if (!actor) continue;

    events.push({
      id: row.id,
      verb: row.verb,
      createdAt: row.created_at,
      actor,
      rating: row.metadata?.rating,
      titleRef: row.object_type === "title" ? row.object_ref : undefined,
      title:
        row.object_type === "title" ? titleById(Number(row.object_ref)) : undefined,
      listTitle: row.object_type === "list" ? row.metadata?.title : undefined,
      target: row.object_type === "profile" ? profiles.get(row.object_ref) : undefined,
    });
  }

  return { events, nextCursor, followingCount: followingIds.length };
}
