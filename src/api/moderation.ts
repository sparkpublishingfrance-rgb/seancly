import type { ModerationStatusRow } from "../lib/database.types";
import { requireSupabase } from "../lib/supabase";
import { unwrap, unwrapVoid } from "./client";

export type ModerationStatus = ModerationStatusRow;

/** Une entrée de la file, telle que la fonction `moderation_queue` la renvoie. */
export type ModerationEntry = {
  commentId: string;
  listId: string;
  listTitle: string;
  authorSlug: string;
  authorName: string;
  body: string;
  status: ModerationStatus;
  /** Niveau de la dernière décision, absent si aucune n'a été enregistrée. */
  level: number | null;
  category: string | null;
  reason: string | null;
  source: string | null;
  createdAt: string;
};

/**
 * File de modération : signalés, masqués et bloqués.
 * La fonction en base vérifie elle-même le rôle et renvoie zéro ligne à qui
 * n'est pas administrateur. Le garde côté interface n'est qu'un confort.
 */
export async function getModerationQueue(limit = 50): Promise<ModerationEntry[]> {
  const rows = unwrap(
    await requireSupabase().rpc("moderation_queue", { max_rows: limit }),
    "charger la file de modération",
  );

  return rows.map((row) => ({
    commentId: row.comment_id,
    listId: row.list_id,
    listTitle: row.list_title,
    authorSlug: row.author_handle,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    level: row.level,
    category: row.category,
    reason: row.reason,
    source: row.source,
    createdAt: row.created_at,
  }));
}

/**
 * Décision humaine sur un commentaire.
 * Elle ne change que le statut : le texte reste celui de son auteur.
 */
export async function reviewComment(
  commentId: string,
  status: ModerationStatus,
  reason?: string,
): Promise<void> {
  unwrapVoid(
    await requireSupabase().rpc("review_comment", {
      target_comment: commentId,
      new_status: status,
      review_reason: reason ?? null,
    }),
    "enregistrer ta décision",
  );
}
