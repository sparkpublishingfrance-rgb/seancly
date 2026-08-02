import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { CreatorProfile } from "../types/studio";

/**
 * `unconfigured` couvre le cas où les variables d'environnement manquent :
 * l'application reste consultable, seules les fonctions de compte se retirent.
 */
export type AuthStatus = "loading" | "unconfigured" | "signed-out" | "signed-in";

export type AuthValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: CreatorProfile | null;
  /** Message d'erreur affichable, déjà rédigé dans la voix de l'application. */
  error: string | null;
  signInWithEmail: (email: string, redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  return value;
}
