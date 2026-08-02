import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { ListComment } from "../api/listSocial";
import { messageOf } from "../api/client";
import {
  addListComment,
  deleteMyComment,
  getListComments,
  hideCommentAsOwner,
} from "../api/listSocial";
import { creatorAvatarGradient } from "../config/theme";
import { useAuth } from "../context/auth-context";
import { formatRelativeTime } from "../utils/format";
import { Notice, Spinner } from "./StateMessage";
import { IconTrash } from "./icons";

const MAX_LENGTH = 2000;

type ListCommentsProps = {
  listId: string;
  /** Auteur de la liste, seul habilité à masquer un commentaire d'autrui. */
  ownerId: string;
};

export function ListComments({ listId, ownerId }: ListCommentsProps) {
  const { status, profile } = useAuth();
  const [comments, setComments] = useState<ListComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerId = profile?.id;
  const isOwner = viewerId === ownerId;

  const load = useCallback(async () => {
    try {
      const page = await getListComments(listId);
      setComments(page.comments);
      setCursor(page.nextCursor);
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);

    try {
      const page = await getListComments(listId, { before: cursor });
      setComments((current) => [...current, ...page.comments]);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  /** Retrait local immédiat, remis en place si la base refuse. */
  async function remove(comment: ListComment, asOwner: boolean) {
    const previous = comments;
    setComments((current) => current.filter((item) => item.id !== comment.id));

    try {
      await (asOwner ? hideCommentAsOwner(comment.id) : deleteMyComment(comment.id));
      setError(null);
    } catch (cause) {
      setComments(previous);
      setError(messageOf(cause));
    }
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 className="comments__title" id="comments-title">
        Commentaires
      </h2>

      {status === "signed-in" && viewerId ? (
        <CommentForm
          listId={listId}
          authorId={viewerId}
          onAdded={(comment) => setComments((current) => [comment, ...current])}
          onError={setError}
        />
      ) : (
        <p className="comments__signin">
          <Link to={`/connexion?retour=${encodeURIComponent(`/liste/${listId}`)}`}>
            Connecte-toi
          </Link>{" "}
          pour laisser un commentaire.
        </p>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Spinner label="Nous chargeons les commentaires" />
      ) : comments.length === 0 ? (
        <p className="studio-empty">
          Personne n'a encore réagi. Ouvre la discussion.
        </p>
      ) : (
        <>
          <ol className="comments__list">
            {comments.map((comment) => (
              <li className="comment" key={comment.id}>
                <Link
                  className="comment__avatar"
                  to={`/@${comment.author.slug}`}
                  style={{ background: creatorAvatarGradient(comment.author.avatarColor) }}
                  aria-label={`Page de ${comment.author.displayName}`}
                >
                  {comment.author.initials}
                </Link>

                <div className="comment__body">
                  <p className="comment__meta">
                    <Link className="comment__author" to={`/@${comment.author.slug}`}>
                      {comment.author.displayName}
                    </Link>
                    <time className="comment__time" dateTime={comment.createdAt}>
                      {formatRelativeTime(comment.createdAt)}
                    </time>
                    {comment.editedAt && <span className="comment__edited">modifié</span>}
                  </p>
                  <p className="comment__text">{comment.body}</p>
                </div>

                {viewerId === comment.author.id ? (
                  <button
                    type="button"
                    className="iconbtn iconbtn--danger"
                    onClick={() => void remove(comment, false)}
                    aria-label={`Retirer mon commentaire du ${comment.createdAt}`}
                  >
                    <IconTrash />
                  </button>
                ) : (
                  isOwner && (
                    <button
                      type="button"
                      className="iconbtn iconbtn--danger"
                      onClick={() => void remove(comment, true)}
                      aria-label={`Masquer le commentaire de ${comment.author.displayName}`}
                    >
                      <IconTrash />
                    </button>
                  )
                )}
              </li>
            ))}
          </ol>

          {cursor && (
            <button
              type="button"
              className="btn btn--ghost btn--small feed__more"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Chargement" : "Voir plus"}
            </button>
          )}
        </>
      )}
    </section>
  );
}

type CommentFormProps = {
  listId: string;
  authorId: string;
  onAdded: (comment: ListComment) => void;
  onError: (message: string) => void;
};

function CommentForm({ listId, authorId, onAdded, onError }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setBusy(true);
    try {
      onAdded(await addListComment(listId, authorId, trimmed));
      setBody("");
    } catch (cause) {
      onError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="comments__form" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="comment-body">
        Ton commentaire
      </label>
      <textarea
        id="comment-body"
        className="comments__input"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_LENGTH}
        rows={3}
        placeholder="Ce que t'inspire cette liste"
      />
      <div className="comments__actions">
        <span className="comments__count">
          {body.length} / {MAX_LENGTH}
        </span>
        <button
          type="submit"
          className="btn btn--primary btn--small"
          disabled={busy || body.trim().length === 0}
        >
          {busy ? "Envoi" : "Publier"}
        </button>
      </div>
    </form>
  );
}
