import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type EmptyStateProps = {
  title: string;
  body: string;
};

/** État vide plein écran, pour un identifiant inconnu ou une route absente. */
export function EmptyState({ title, body }: EmptyStateProps) {
  useDocumentTitle(title);

  return (
    <main className="shell empty">
      <h1 className="empty__title">{title}</h1>
      <p className="empty__body">{body}</p>
      <Link className="btn btn--ghost" to="/">
        Retour à l'accueil
      </Link>
    </main>
  );
}
