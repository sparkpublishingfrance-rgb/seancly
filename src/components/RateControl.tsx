import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { messageOf } from "../api/client";
import { RATING_MAX, deleteRating, getMyRating, upsertRating } from "../api/ratings";
import { useAuth } from "../context/auth-context";
import { formatDecimal } from "../utils/format";
import { Notice } from "./StateMessage";
import { IconPen, IconStar } from "./icons";

const STARS = [1, 2, 3, 4, 5];

type RateControlProps = {
  /** Identifiant du titre. Texte, tant que `films_catalog` n'existe pas. */
  titleRef: string;
  titleName: string;
};

/**
 * Note personnelle sur un titre, en demi-étoiles.
 * Sans compte, le bouton renvoie vers la connexion plutôt que d'échouer.
 */
export function RateControl({ titleRef, titleName }: RateControlProps) {
  const { status, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const authorId = profile?.id;

  const load = useCallback(async () => {
    if (!authorId) return;
    try {
      const mine = await getMyRating(authorId, titleRef);
      setRating(mine?.rating ?? null);
    } catch (cause) {
      setError(messageOf(cause));
    }
  }, [authorId, titleRef]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status !== "signed-in" || !authorId) {
    return (
      <Link className="btn btn--ghost" to="/connexion">
        <IconPen />
        Noter
      </Link>
    );
  }

  async function pick(value: number) {
    if (!authorId) return;
    const previous = rating;
    setRating(value);
    setBusy(true);
    setError(null);

    try {
      await upsertRating(authorId, titleRef, value);
    } catch (cause) {
      setRating(previous);
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!authorId) return;
    const previous = rating;
    setRating(null);
    setBusy(true);

    try {
      await deleteRating(authorId, titleRef);
    } catch (cause) {
      setRating(previous);
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rate">
      <button
        type="button"
        className={rating === null ? "btn btn--ghost" : "btn btn--ghost btn--rated"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <IconPen />
        {rating === null ? "Noter" : `Ma note : ${formatDecimal(rating)} / ${RATING_MAX}`}
      </button>

      {open && (
        <div className="rate__panel">
          <p className="rate__label">Ta note pour {titleName}</p>

          <div className="rate__stars">
            {STARS.map((star) => {
              const fill = Math.min(Math.max(((rating ?? 0) - (star - 1)) * 100, 0), 100);
              return (
                <span className="rate__star" key={star}>
                  <span className="rate__star-bg" aria-hidden="true">
                    <IconStar size={24} />
                  </span>
                  <span
                    className="rate__star-fill"
                    style={{ width: `${fill}%` }}
                    aria-hidden="true"
                  >
                    <IconStar size={24} />
                  </span>
                  <button
                    type="button"
                    className="rate__half rate__half--left"
                    onClick={() => void pick(star - 0.5)}
                    disabled={busy}
                    aria-label={`${formatDecimal(star - 0.5)} sur ${RATING_MAX}`}
                  />
                  <button
                    type="button"
                    className="rate__half rate__half--right"
                    onClick={() => void pick(star)}
                    disabled={busy}
                    aria-label={`${formatDecimal(star)} sur ${RATING_MAX}`}
                  />
                </span>
              );
            })}
          </div>

          {rating !== null && (
            <button type="button" className="rate__clear" onClick={() => void clear()}>
              Retirer ma note
            </button>
          )}

          {error && <Notice tone="error">{error}</Notice>}
        </div>
      )}
    </div>
  );
}
