import type { FeedProfile } from "./feed";
import { requireSupabase } from "../lib/supabase";
import { initialsOf } from "../utils/format";
import { DataError, unwrap, unwrapVoid } from "./client";

/** Compteurs d'une liste, tels que la vue `list_stats` les agrège. */
export type ListStats = {
  items: number;
  followers: number;
  comments: number;
};

/** Une liste publique, avec son auteur et ses compteurs. */
export type PublicList = {
  id: string;
  title: string;
  createdAt: string;
  owner: FeedProfile;
  stats: ListStats;
};

export type ListComment = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: FeedProfile;
};

export type ListCommentPage = {
  comments: ListComment[];
  /** Curseur de la page suivante, ou `null` quand le fil est épuisé. */
  nextCursor: string | null;
};

const PROFILE_COLUMNS = "id, handle, display_name, avatar_color";

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_color: string;
};

function toProfile(row: ProfileRow): FeedProfile {
  return {
    id: row.id,
    slug: row.handle,
    displayName: row.display_name,
    initials: initialsOf(row.display_name),
    avatarColor: row.avatar_color,
  };
}

/* --------------------------------------------------------------- la liste */

/**
 * Liste publique, son auteur et ses compteurs.
 * `null` si l'identifiant est inconnu ou si la liste est privée : la RLS ne
 * distingue pas les deux cas, et l'interface n'a pas à les distinguer non plus.
 */
export async function getPublicList(listId: string): Promise<PublicList | null> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("lists")
    .select("id, title, owner_id, is_public, created_at")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à charger cette liste.", error);
  if (!data || !data.is_public) return null;

  const [owner, stats] = await Promise.all([
    client.from("profiles").select(PROFILE_COLUMNS).eq("id", data.owner_id).maybeSingle(),
    client
      .from("list_stats")
      .select("items, followers, comments")
      .eq("list_id", listId)
      .maybeSingle(),
  ]);

  if (!owner.data) return null;

  return {
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
    owner: toProfile(owner.data),
    stats: {
      items: stats.data?.items ?? 0,
      followers: stats.data?.followers ?? 0,
      comments: stats.data?.comments ?? 0,
    },
  };
}

/* ------------------------------------------------------------- abonnements */

export async function getListFollowState(
  listId: string,
  viewerId: string,
): Promise<boolean> {
  const { data, error } = await requireSupabase()
    .from("list_follows")
    .select("list_id")
    .eq("list_id", listId)
    .eq("follower_id", viewerId)
    .maybeSingle();

  if (error) throw new DataError("Nous n'avons pas réussi à lire ton abonnement.", error);
  return data !== null;
}

/** Suit ou arrête de suivre une liste. Renvoie l'état après bascule. */
export async function toggleListFollow(
  listId: string,
  viewerId: string,
): Promise<boolean> {
  const client = requireSupabase();
  const already = await getListFollowState(listId, viewerId);

  if (already) {
    unwrapVoid(
      await client
        .from("list_follows")
        .delete()
        .eq("list_id", listId)
        .eq("follower_id", viewerId),
      "arrêter de suivre cette liste",
    );
    return false;
  }

  unwrapVoid(
    await client.from("list_follows").insert({ list_id: listId, follower_id: viewerId }),
    "suivre cette liste",
  );
  return true;
}

/** Listes suivies par un membre, avec leurs compteurs. */
export async function getFollowedLists(viewerId: string): Promise<PublicList[]> {
  const client = requireSupabase();

  const follows = unwrap(
    await client
      .from("list_follows")
      .select("list_id")
      .eq("follower_id", viewerId)
      .order("created_at", { ascending: false }),
    "charger les listes que tu suis",
  );

  const ids = follows.map((row) => row.list_id);
  if (ids.length === 0) return [];

  return hydrateLists(ids);
}

/* ---------------------------------------------------------- listes en vogue */

export type PopularOptions = {
  limit?: number;
  /** Fenêtre du score, en jours. */
  windowDays?: number;
};

/**
 * Listes publiques les plus vivantes de la période.
 * Le classement est calculé en base : un abonnement récent vaut deux points, un
 * commentaire récent un point, et les plus récentes départagent les ex aequo.
 */
export async function getPopularLists({
  limit = 12,
  windowDays = 30,
}: PopularOptions = {}): Promise<PublicList[]> {
  const client = requireSupabase();

  const rows = unwrap(
    await client.rpc("popular_lists", { window_days: windowDays, max_rows: limit }),
    "charger les listes en vogue",
  );

  if (rows.length === 0) return [];

  const owners = await loadProfiles(rows.map((row) => row.owner_id));

  return rows
    .map((row) => {
      const owner = owners.get(row.owner_id);
      if (!owner) return null;

      return {
        id: row.list_id,
        title: row.title,
        createdAt: "",
        owner,
        stats: { items: row.items, followers: row.followers, comments: row.comments },
      } satisfies PublicList;
    })
    .filter((list) => list !== null);
}

/* ------------------------------------------------------------ commentaires */

const COMMENT_PAGE = 20;

export async function getListComments(
  listId: string,
  { limit = COMMENT_PAGE, before }: { limit?: number; before?: string } = {},
): Promise<ListCommentPage> {
  const client = requireSupabase();

  let query = client
    .from("list_comments")
    .select("id, author_id, body, created_at, updated_at, deleted_at")
    .eq("list_id", listId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    // Une ligne de plus que demandé : sa présence dit s'il reste une page.
    .limit(limit + 1);

  if (before) query = query.lt("created_at", before);

  const rows = unwrap(await query, "charger les commentaires");
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? page[page.length - 1].created_at : null;

  const authors = await loadProfiles(page.map((row) => row.author_id));

  const comments = page
    .map((row) => {
      const author = authors.get(row.author_id);
      if (!author) return null;

      return {
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        editedAt: row.updated_at !== row.created_at ? row.updated_at : null,
        author,
      } satisfies ListComment;
    })
    .filter((comment) => comment !== null);

  return { comments, nextCursor };
}

/** Réponse de la fonction de modération. */
/**
 * Sort d'un commentaire soumis.
 * Une variante par statut plutôt que deux variantes à statut multiple : le
 * discriminant doit être un littéral unique pour que le typage suive.
 */
export type PostedComment =
  | { status: "visible"; comment: ListComment }
  | { status: "flagged"; comment: ListComment }
  | { status: "hidden"; message: string }
  | { status: "blocked"; message: string };

type ModerationResponse = {
  status?: "visible" | "flagged" | "hidden" | "blocked";
  message?: string;
  error?: string;
  comment?: {
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    updated_at: string;
  };
};

/**
 * Publie un commentaire en passant par la modération.
 *
 * L'insertion directe n'est plus permise : la fonction en base classe le texte
 * avant de l'écrire, et renvoie ce qu'il est advenu du commentaire.
 */
export async function addListComment(
  listId: string,
  author: FeedProfile,
  body: string,
): Promise<PostedComment> {
  const { data, error } = await requireSupabase().functions.invoke<ModerationResponse>(
    "moderate-comment",
    { body: { listId, body } },
  );

  if (error) {
    throw new DataError("Nous n'avons pas réussi à publier ton commentaire.", undefined);
  }
  if (!data || data.error) {
    throw new DataError(data?.error ?? "Nous n'avons pas réussi à publier ton commentaire.");
  }

  if (data.status === "hidden" || data.status === "blocked") {
    return { status: data.status, message: data.message ?? "" };
  }

  if (!data.comment) {
    throw new DataError("Nous n'avons pas réussi à publier ton commentaire.");
  }

  return {
    status: data.status === "flagged" ? "flagged" : "visible",
    comment: {
      id: data.comment.id,
      body: data.comment.body,
      createdAt: data.comment.created_at,
      editedAt: null,
      author,
    },
  };
}

/** Retire son propre commentaire. Suppression douce, côté base. */
export async function deleteMyComment(commentId: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().rpc("delete_my_list_comment", { comment_id: commentId }),
    "retirer ton commentaire",
  );
}

/**
 * Masque un commentaire sur sa propre liste.
 * La fonction en base vérifie la propriété : elle ne touche jamais au texte.
 */
export async function hideCommentAsOwner(commentId: string): Promise<void> {
  unwrapVoid(
    await requireSupabase().rpc("hide_list_comment", { comment_id: commentId }),
    "masquer ce commentaire",
  );
}

/* --------------------------------------------------------------- résolution */

/** Charge des profils en un appel, quel que soit le nombre d'identifiants. */
async function loadProfiles(ids: string[]): Promise<Map<string, FeedProfile>> {
  const unique = [...new Set(ids)];
  const profiles = new Map<string, FeedProfile>();
  if (unique.length === 0) return profiles;

  const rows = unwrap(
    await requireSupabase().from("profiles").select(PROFILE_COLUMNS).in("id", unique),
    "charger les profils",
  );

  for (const row of rows) profiles.set(row.id, toProfile(row));
  return profiles;
}

/** Listes et compteurs en trois appels, sans boucle de requêtes. */
async function hydrateLists(ids: string[]): Promise<PublicList[]> {
  const client = requireSupabase();

  const [lists, stats] = await Promise.all([
    client.from("lists").select("id, title, owner_id, created_at").in("id", ids),
    client.from("list_stats").select("list_id, items, followers, comments").in("list_id", ids),
  ]);

  const rows = unwrap(lists, "charger ces listes");
  const counters = new Map(
    unwrap(stats, "charger les compteurs").map((row) => [row.list_id, row]),
  );
  const owners = await loadProfiles(rows.map((row) => row.owner_id));

  // On respecte l'ordre demandé plutôt que celui de la base.
  return ids
    .map((id) => {
      const row = rows.find((candidate) => candidate.id === id);
      const owner = row ? owners.get(row.owner_id) : undefined;
      if (!row || !owner) return null;

      const counter = counters.get(id);
      return {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        owner,
        stats: {
          items: counter?.items ?? 0,
          followers: counter?.followers ?? 0,
          comments: counter?.comments ?? 0,
        },
      } satisfies PublicList;
    })
    .filter((list) => list !== null);
}
