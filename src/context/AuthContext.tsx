import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { CreatorProfile } from "../types/studio";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getProfile } from "../api/profiles";
import { messageOf } from "../api/client";
import { AuthContext, type AuthStatus, type AuthValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Évite d'écrire dans l'état après démontage, et de traiter une réponse
  // périmée quand deux sessions se succèdent vite.
  const mounted = useRef(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const loaded = await getProfile(userId);
      if (!mounted.current) return;
      setProfile(loaded);
      // Le trigger d'inscription crée la ligne ; son absence signale un souci.
      setError(loaded ? null : "Ton profil n'a pas encore été créé. Reconnecte-toi.");
    } catch (cause) {
      if (!mounted.current) return;
      setProfile(null);
      setError(messageOf(cause));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
      if (data.session) void loadProfile(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted.current) return;
      setSession(next);
      setStatus(next ? "signed-in" : "signed-out");
      if (next) {
        void loadProfile(next.user.id);
      } else {
        setProfile(null);
        setError(null);
      }
    });

    return () => {
      mounted.current = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) throw new Error("La base n'est pas encore configurée.");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (authError) throw new Error(authError.message);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      error,
      signInWithEmail,
      signOut,
      refreshProfile,
    }),
    [status, session, profile, error, signInWithEmail, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
