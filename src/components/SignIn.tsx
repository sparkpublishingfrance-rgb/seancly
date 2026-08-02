import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { BRAND } from "../config/brand";
import { useAuth } from "../context/auth-context";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Notice } from "./StateMessage";

type Phase = "idle" | "sending" | "sent";

export function SignIn() {
  useDocumentTitle("Connexion");

  const { status, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "signed-in") return <Navigate to="/studio" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPhase("sending");

    try {
      await signInWithEmail(email.trim());
      setPhase("sent");
    } catch (cause) {
      setPhase("idle");
      setError(cause instanceof Error ? cause.message : "L'envoi a échoué.");
    }
  }

  return (
    <main className="shell signin">
      <div className="signin__card">
        <h1 className="signin__title">Se connecter</h1>

        {status === "unconfigured" ? (
          <>
            <p className="signin__intro">
              La base n'est pas encore reliée à cette installation. Renseigne
              <code> VITE_SUPABASE_URL </code> et <code> VITE_SUPABASE_ANON_KEY </code>
              dans un fichier <code>.env</code>, puis relance le serveur.
            </p>
            <p className="signin__foot">
              Le catalogue reste consultable sans compte en attendant.
            </p>
            <Link className="btn btn--ghost" to="/">
              Retour à l'accueil
            </Link>
          </>
        ) : phase === "sent" ? (
          <>
            <p className="signin__intro">
              Nous venons d'envoyer un lien de connexion à <strong>{email}</strong>.
              Ouvre-le depuis cet appareil, il te connectera directement.
            </p>
            <p className="signin__foot">
              Rien reçu au bout de deux minutes ? Regarde dans les indésirables, puis
              réessaie.
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setPhase("idle");
                setError(null);
              }}
            >
              Utiliser une autre adresse
            </button>
          </>
        ) : (
          <>
            <p className="signin__intro">
              Nous t'envoyons un lien par e-mail. Pas de mot de passe à retenir, pas de
              mot de passe à perdre.
            </p>

            <form className="signin__form" onSubmit={onSubmit}>
              <label className="signin__label" htmlFor="signin-email">
                Ton adresse e-mail
              </label>
              <input
                id="signin-email"
                className="field field--block"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="toi@exemple.fr"
              />

              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={phase === "sending"}
              >
                {phase === "sending" ? "Envoi en cours" : "Recevoir mon lien"}
              </button>
            </form>

            {error && <Notice tone="error">{error}</Notice>}

            {/* Sign in with Apple arrivera avec l'application iOS. */}
            <p className="signin__foot">
              La connexion avec Apple arrivera en même temps que l'application iOS.
            </p>
          </>
        )}
      </div>

      <p className="signin__legal">
        En te connectant, tu rejoins {BRAND.name}. Nous ne demandons que ton adresse,
        et rien d'autre tant que tu ne le décides pas.
      </p>
    </main>
  );
}
