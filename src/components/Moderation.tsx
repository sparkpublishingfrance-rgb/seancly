import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ModerationEntry, ModerationStatus } from "../api/moderation";
import { messageOf } from "../api/client";
import { getModerationQueue, reviewComment } from "../api/moderation";
import { useAuth } from "../context/auth-context";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatRelativeTime } from "../utils/format";
import { Notice, Spinner } from "./StateMessage";

const STATUS_LABELS: Record<ModerationStatus, string> = {
  visible: "Publié",
  flagged: "Signalé",
  hidden: "Masqué",
  blocked: "Bloqué",
};

/** Actions humaines proposées, dans l'ordre du plus clément au plus sévère. */
const ACTIONS: { status: ModerationStatus; label: string }[] = [
  { status: "visible", label: "Approuver" },
  { status: "hidden", label: "Masquer" },
  { status: "blocked", label: "Bloquer" },
];

/**
 * File de modération.
 *
 * Le rôle est vérifié en base : la fonction ne renvoie rien à qui n'est pas
 * administrateur, et les décisions passent par une fonction qui refait la
 * vérification. Le garde ci-dessous évite seulement d'afficher un écran vide.
 */
export function Moderation() {
  useDocumentTitle("Modération");

  const { status, profile } = useAuth();

  if (status === "unconfigured" || status === "signed-out" || (profile && !profile.is_admin)) {
    return (
      <main className="shell empty">
        <h1 className="empty__title">Rien à voir ici</h1>
        <p className="empty__body">
          Cette page est réservée à l'équipe de modération.
        </p>
        <Link className="btn btn--ghost" to="/">
          Retour à l'accueil
        </Link>
      </main>
    );
  }

  if (status === "loading" || !profile) {
    return (
      <main className="shell moderation">
        <Spinner label="Nous ouvrons la file" />
      </main>
    );
  }

  return (
    <main className="shell moderation">
      <h1 className="moderation__title">Modération</h1>
      <ModerationQueue />
    </main>
  );
}

function ModerationQueue() {
  const [entries, setEntries] = useState<ModerationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await getModerationQueue());
      setError(null);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(entry: ModerationEntry, next: ModerationStatus) {
    const previous = entries;
    setBusy(entry.commentId);
    // Une décision retire l'entrée de la file : approuvée, elle n'a plus rien
    // à y faire ; masquée ou bloquée, elle est traitée.
    setEntries((current) => current.filter((item) => item.commentId !== entry.commentId));

    try {
      await reviewComment(entry.commentId, next);
      setError(null);
    } catch (cause) {
      setEntries(previous);
      setError(messageOf(cause));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner label="Nous chargeons la file" />;

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      {entries.length === 0 ? (
        <p className="studio-empty">Rien à relire. La file est vide.</p>
      ) : (
        <ul className="modqueue">
          {entries.map((entry) => (
            <li className="modcard" key={entry.commentId}>
              <div className="modcard__head">
                <span className={`status status--mod-${entry.status}`}>
                  <span className="status__dot" aria-hidden="true" />
                  {STATUS_LABELS[entry.status]}
                </span>
                {entry.category && <span className="modcard__category">{entry.category}</span>}
                {entry.source === "human" && <span className="modcard__source">revue humaine</span>}
                <time className="modcard__time" dateTime={entry.createdAt}>
                  {formatRelativeTime(entry.createdAt)}
                </time>
              </div>

              <p className="modcard__meta">
                <Link className="modcard__author" to={`/@${entry.authorSlug}`}>
                  {entry.authorName}
                </Link>
                {" sous "}
                <Link className="modcard__list" to={`/liste/${entry.listId}`}>
                  {entry.listTitle}
                </Link>
              </p>

              <blockquote className="modcard__body">{entry.body}</blockquote>

              {entry.reason && <p className="modcard__reason">{entry.reason}</p>}

              <div className="modcard__actions">
                {ACTIONS.filter((action) => action.status !== entry.status).map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    className={
                      action.status === "visible"
                        ? "btn btn--ghost btn--small"
                        : "btn btn--ghost btn--small btn--danger"
                    }
                    disabled={busy === entry.commentId}
                    onClick={() => void decide(entry, action.status)}
                  >
                    {action.label}
                  </button>
                ))}
                {/* L'avertissement et le bannissement viendront avec la gestion
                    des comptes ; l'emplacement est prêt. */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
